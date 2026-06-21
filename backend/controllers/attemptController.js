const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');

// ── @route  POST /api/attempts/start ──────────────────────────────────────
// ── @access Private
// Checks if user has an in-progress attempt → resume it
// Otherwise creates a fresh attempt
const startOrResumeAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.body
    const userId     = req.user._id

    if (!quizId) {
      res.status(400)
      return next(new Error('quizId is required'))
    }

    const quiz = await Quiz.findById(quizId)
    if (!quiz || !quiz.isPublished) {
      res.status(404)
      return next(new Error('Quiz not found'))
    }

    // 1. Check for in_progress
    const inProgress = await QuizAttempt.findOne({
      userId, quizId, status: 'in_progress',
    })

    if (inProgress) {
      const answersObj = Object.fromEntries(inProgress.answers)
      return res.status(200).json({
        success: true, isResuming: true,
        data: { ...inProgress.toObject(), answers: answersObj },
      })
    }

    // 2. Check for completed (only show if navigating normally)
    const completed = await QuizAttempt.findOne({
      userId, quizId, status: 'completed',
    }).sort({ completedAt: -1 })

    if (completed) {
      return res.status(200).json({
        success: true, isResuming: false,
        data: { ...completed.toObject(), answers: Object.fromEntries(completed.answers) },
      })
    }

    // 3. No attempt found — create fresh
    const attempt = await QuizAttempt.create({
      userId, quizId,
      totalQuestions:       quiz.questions.length,
      currentQuestionIndex: 0,
      answers:              {},
      status:               'in_progress',
    })

    res.status(201).json({
      success: true, isResuming: false,
      data: { ...attempt.toObject(), answers: {} },
    })
  } catch (error) {
    next(error)
  }
}

// ── @route  PATCH /api/attempts/:id/answer ────────────────────────────────
// ── @access Private
// Called every time user selects an option
// Also updates their current position in the quiz
const saveAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOptionIndex, currentQuestionIndex } = req.body
    const attemptId = req.params.id

    if (questionId === undefined || selectedOptionIndex === undefined || currentQuestionIndex === undefined) {
      res.status(400)
      return next(new Error('questionId, selectedOptionIndex and currentQuestionIndex are required'))
    }

    const attempt = await QuizAttempt.findOne({
      _id:    attemptId,
      userId: req.user._id,
      status: 'in_progress',
    })

    if (!attempt) {
      res.status(404)
      return next(new Error('Active attempt not found'))
    }

    const quiz = await Quiz.findById(attempt.quizId).populate({
      path:   'questions',
      select: 'correctOptionIndex isGrace',
    })

    const question = quiz.questions.find(
      (q) => q._id.toString() === questionId
    )

    if (!question) {
      res.status(404)
      return next(new Error('Question not found in this quiz'))
    }

    const isCorrect = question.isGrace
      ? true
      : question.correctOptionIndex === selectedOptionIndex

    attempt.answers.set(questionId, {
      questionId,
      selectedOptionIndex,
      isCorrect,
      answeredAt: new Date(),
    })

    attempt.currentQuestionIndex = currentQuestionIndex
    await attempt.save()

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        correctOptionIndex: question.correctOptionIndex,
        isGrace:            question.isGrace || false,
      },
    })
  } catch (error) {
    next(error)
  }
}

// ── @route  POST /api/attempts/:id/submit ─────────────────────────────────
// ── @access Private
// Finalizes the attempt, calculates score
const submitAttempt = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findOne({
      _id:    req.params.id,
      userId: req.user._id,
      status: 'in_progress',
    })

    if (!attempt) {
      res.status(404)
      return next(new Error('Active attempt not found'))
    }

    const quiz = await Quiz.findById(attempt.quizId).populate({
      path:   'questions',
      select: 'questionText questionImageUrl options correctOptionIndex explanation isGrace',
    })

    // ── Use quiz-specific marking scheme ──────────────────────────────
    const CORRECT_MARKS = quiz.markingScheme?.correct     ?? 5
    const WRONG_MARKS   = quiz.markingScheme?.wrong       ?? -1
    const SKIP_MARKS    = quiz.markingScheme?.unattempted ?? 0

    let totalMarks       = 0
    let correctCount     = 0
    let wrongCount       = 0
    let graceCount       = 0
    let unattemptedCount = 0

    const results = quiz.questions.map((question, index) => {
      const answer  = attempt.answers.get(question._id.toString())
      const isGrace = question.isGrace || false

      let isCorrect    = false
      let marksAwarded = SKIP_MARKS

      if (isGrace) {
        isCorrect    = true
        marksAwarded = CORRECT_MARKS
        graceCount++
      } else if (answer) {
        isCorrect    = answer.isCorrect
        marksAwarded = isCorrect ? CORRECT_MARKS : WRONG_MARKS
        if (isCorrect) correctCount++
        else wrongCount++
      } else {
        unattemptedCount++
      }

      totalMarks += marksAwarded

      return {
        questionNumber:      index + 1,
        questionText:        question.questionText,
        questionImageUrl:    question.questionImageUrl,
        options:             question.options,
        correctOptionIndex:  question.correctOptionIndex,
        explanation:         question.explanation,
        selectedOptionIndex: answer ? answer.selectedOptionIndex : null,
        isCorrect,
        isAttempted:         !!answer,
        isGrace,
        marksAwarded,
      }
    })

    const maxMarks     = quiz.questions.length * CORRECT_MARKS
    const scorePercent = maxMarks > 0
      ? Math.max(0, Math.round((totalMarks / maxMarks) * 100))
      : 0

    attempt.score       = totalMarks
    attempt.status      = 'completed'
    attempt.completedAt = new Date()
    await attempt.save()

    res.status(200).json({
      success: true,
      data: {
        attemptId:        attempt._id,
        quizId:           attempt.quizId.toString(),
        totalMarks,
        maxMarks,
        correctCount,
        wrongCount,
        graceCount,
        unattemptedCount,
        scorePercentage:  scorePercent,
        timeTaken:        Math.round((attempt.completedAt - attempt.startedAt) / 1000),
        markingScheme: {
          correct:     CORRECT_MARKS,
          wrong:       WRONG_MARKS,
          unattempted: SKIP_MARKS,
        },
        results,
      },
    })
  } catch (error) {
    next(error)
  }
}

// ── @route  POST /api/attempts/:id/abandon ────────────────────────────────
// ── @access Private
// Called when user clicks "Restart" — marks old attempt as abandoned
const abandonAttempt = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findOne({
      _id:    req.params.id,
      userId: req.user._id,
      status: { $in: ['in_progress', 'completed'] },  // ← both statuses
    })

    if (!attempt) {
      // Don't error — just return success silently
      return res.status(200).json({
        success: true,
        message: 'Attempt already abandoned or not found.',
      })
    }

    attempt.status = 'abandoned'
    await attempt.save()

    res.status(200).json({
      success: true,
      message: 'Attempt abandoned. You can start fresh.',
    })
  } catch (error) {
    next(error)
  }
}

// ── @route  GET /api/attempts/my-attempts ─────────────────────────────────
// ── @access Private
// Returns all non-abandoned attempts for the logged-in user
const getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({
      userId: req.user._id,
      status: { $ne: 'abandoned' },
    })
      .populate('quizId', 'title')
      .sort({ updatedAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      data: attempts,
    })
  } catch (error) {
    next(error)
  }
}

// ── GET /api/attempts/:id/results ─────────────────────────────────────────
// @access Private — for revisiting results page directly
const getAttemptResults = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findOne({
      _id:    req.params.id,
      userId: req.user._id,
      status: 'completed',
    })

    if (!attempt) {
      res.status(404)
      return next(new Error('Completed attempt not found'))
    }

    const quiz = await Quiz.findById(attempt.quizId).populate({
      path:   'questions',
      select: 'questionText questionImageUrl options correctOptionIndex explanation isGrace',
    })

    // ── Use quiz-specific marking scheme ──────────────────────────────
    const CORRECT_MARKS = quiz.markingScheme?.correct     ?? 5
    const WRONG_MARKS   = quiz.markingScheme?.wrong       ?? -1
    const SKIP_MARKS    = quiz.markingScheme?.unattempted ?? 0

    let correctCount     = 0
    let wrongCount       = 0
    let graceCount       = 0
    let unattemptedCount = 0

    const results = quiz.questions.map((question, index) => {
      const answer  = attempt.answers.get(question._id.toString())
      const isGrace = question.isGrace || false

      let isCorrect    = false
      let marksAwarded = SKIP_MARKS

      if (isGrace) {
        isCorrect    = true
        marksAwarded = CORRECT_MARKS
        graceCount++
      } else if (answer) {
        isCorrect    = answer.isCorrect
        marksAwarded = isCorrect ? CORRECT_MARKS : WRONG_MARKS
        if (isCorrect) correctCount++
        else wrongCount++
      } else {
        unattemptedCount++
      }

      return {
        questionNumber:      index + 1,
        questionText:        question.questionText,
        questionImageUrl:    question.questionImageUrl,
        options:             question.options,
        correctOptionIndex:  question.correctOptionIndex,
        explanation:         question.explanation,
        selectedOptionIndex: answer ? answer.selectedOptionIndex : null,
        isCorrect,
        isAttempted:         !!answer,
        isGrace,
        marksAwarded,
      }
    })

    const totalMarks   = attempt.score
    const maxMarks     = attempt.totalQuestions * CORRECT_MARKS
    const scorePercent = maxMarks > 0
      ? Math.max(0, Math.round((totalMarks / maxMarks) * 100))
      : 0
    const timeTaken    = Math.round(
      (attempt.completedAt - attempt.startedAt) / 1000
    )

    res.status(200).json({
      success: true,
      data: {
        attemptId:        attempt._id,
        quizId:           attempt.quizId.toString(),
        totalMarks,
        maxMarks,
        correctCount,
        wrongCount,
        graceCount,
        unattemptedCount,
        scorePercentage:  scorePercent,
        timeTaken,
        markingScheme: {
          correct:     CORRECT_MARKS,
          wrong:       WRONG_MARKS,
          unattempted: SKIP_MARKS,
        },
        results,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Add to exports
module.exports = {
  startOrResumeAttempt,
  saveAnswer,
  submitAttempt,
  abandonAttempt,
  getMyAttempts,
  getAttemptResults,  
}

