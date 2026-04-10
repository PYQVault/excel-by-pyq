const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');

// ── @route  POST /api/attempts/start ──────────────────────────────────────
// ── @access Private
// Checks if user has an in-progress attempt → resume it
// Otherwise creates a fresh attempt
const startOrResumeAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.body;
    const userId = req.user._id;

    if (!quizId) {
      res.status(400);
      return next(new Error('quizId is required'));
    }

    // Verify quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.isPublished) {
      res.status(404);
      return next(new Error('Quiz not found'));
    }

    // Look for an existing in-progress attempt
    const existingAttempt = await QuizAttempt.findOne({
      userId,
      quizId,
      status: 'in_progress',
    });

    if (existingAttempt) {
      // ── RESUME: return existing attempt ──────────────────────────────
      // Convert Map to plain object for JSON serialization
      const answersObj = Object.fromEntries(existingAttempt.answers);

      return res.status(200).json({
        success: true,
        isResuming: true,
        data: {
          ...existingAttempt.toObject(),
          answers: answersObj,
        },
      });
    }

    // ── FRESH START: create new attempt ──────────────────────────────
    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      totalQuestions: quiz.questions.length,
      currentQuestionIndex: 0,
      answers: {},
      status: 'in_progress',
    });

    res.status(201).json({
      success: true,
      isResuming: false,
      data: {
        ...attempt.toObject(),
        answers: {},
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/attempts/:id/answer ────────────────────────────────
// ── @access Private
// Called every time user selects an option
// Also updates their current position in the quiz
const saveAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOptionIndex, currentQuestionIndex } = req.body;
    const attemptId = req.params.id;

    // Validate inputs
    if (
      questionId === undefined ||
      selectedOptionIndex === undefined ||
      currentQuestionIndex === undefined
    ) {
      res.status(400);
      return next(
        new Error('questionId, selectedOptionIndex and currentQuestionIndex are required')
      );
    }

    // Find the attempt and make sure it belongs to this user
    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      userId: req.user._id,
      status: 'in_progress',
    });

    if (!attempt) {
      res.status(404);
      return next(new Error('Active attempt not found'));
    }

    // Find the quiz to get the correct answer for this question
    const quiz = await Quiz.findById(attempt.quizId).populate({
      path: 'questions',
      select: 'correctOptionIndex',
    });

    const question = quiz.questions.find(
      (q) => q._id.toString() === questionId
    );

    if (!question) {
      res.status(404);
      return next(new Error('Question not found in this quiz'));
    }

    const isCorrect = question.correctOptionIndex === selectedOptionIndex;

    // Update the answers Map
    // Key = questionId string, Value = answer record
    attempt.answers.set(questionId, {
      questionId,
      selectedOptionIndex,
      isCorrect,
      answeredAt: new Date(),
    });

    // Update current position
    attempt.currentQuestionIndex = currentQuestionIndex;

    await attempt.save();

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        correctOptionIndex: question.correctOptionIndex,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/attempts/:id/submit ─────────────────────────────────
// ── @access Private
// Finalizes the attempt, calculates score
const submitAttempt = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'in_progress',
    });

    if (!attempt) {
      res.status(404);
      return next(new Error('Active attempt not found'));
    }

    // Calculate final score from the answers Map
    let score = 0;
    attempt.answers.forEach((answer) => {
      if (answer.isCorrect) score++;
    });

    attempt.score = score;
    attempt.status = 'completed';
    attempt.completedAt = new Date();

    await attempt.save();

    // Fetch quiz with correct answers for the results page
    const quiz = await Quiz.findById(attempt.quizId).populate({
      path: 'questions',
      select: 'questionText questionImageUrl options correctOptionIndex explanation',
    });

    // Build detailed results array
    const results = quiz.questions.map((question, index) => {
      const answer = attempt.answers.get(question._id.toString());
      return {
        questionNumber: index + 1,
        questionText: question.questionText,
        questionImageUrl: question.questionImageUrl,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        explanation: question.explanation,
        selectedOptionIndex: answer ? answer.selectedOptionIndex : null,
        isCorrect: answer ? answer.isCorrect : false,
        isAttempted: !!answer,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        scorePercentage: Math.round((score / attempt.totalQuestions) * 100),
        timeTaken: Math.round(
          (attempt.completedAt - attempt.startedAt) / 1000
        ), // in seconds
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/attempts/:id/abandon ────────────────────────────────
// ── @access Private
// Called when user clicks "Restart" — marks old attempt as abandoned
const abandonAttempt = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'in_progress',
    });

    if (!attempt) {
      res.status(404);
      return next(new Error('Active attempt not found'));
    }

    attempt.status = 'abandoned';
    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Attempt abandoned. You can start fresh.',
    });
  } catch (error) {
    next(error);
  }
};

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
      select: 'questionText questionImageUrl options correctOptionIndex explanation',
    })

    const results = quiz.questions.map((question, index) => {
      const answer = attempt.answers.get(question._id.toString())
      return {
        questionNumber:      index + 1,
        questionText:        question.questionText,
        questionImageUrl:    question.questionImageUrl,
        options:             question.options,
        correctOptionIndex:  question.correctOptionIndex,
        explanation:         question.explanation,
        selectedOptionIndex: answer ? answer.selectedOptionIndex : null,
        isCorrect:           answer ? answer.isCorrect : false,
        isAttempted:         !!answer,
      }
    })

    res.status(200).json({
      success: true,
      data: {
        attemptId:       attempt._id,
        score:           attempt.score,
        totalQuestions:  attempt.totalQuestions,
        scorePercentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
        timeTaken:       Math.round((attempt.completedAt - attempt.startedAt) / 1000),
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
  getAttemptResults,   // ← add this
}

