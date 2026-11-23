const mongoose    = require('mongoose')
const QuizAttempt = require('../models/QuizAttempt')
const Quiz        = require('../models/Quiz')
const { MOCK_ENABLED_EXAMS, isMockEnabled, warningsFor } = require('../utils/mockExamConfig')
const { finalizeAttempt, finalizeExpiredFor } = require('../utils/mockExamService')

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

// 409 helper for "this attempt can no longer accept changes"
const rejectInactive = async (res, attemptId) => {
  const a = await QuizAttempt.findById(attemptId).select('status deadlineAt').lean()
  if (a && a.status === 'in_progress' && a.deadlineAt && new Date() >= a.deadlineAt) {
    await finalizeAttempt(attemptId, { reason: 'timeout' })
    return res.status(409).json({
      success: false, code: 'ATTEMPT_EXPIRED',
      message: 'Time is up. Your exam has been submitted.',
    })
  }
  return res.status(409).json({
    success: false, code: 'ATTEMPT_FINALIZED',
    message: 'This attempt has already been submitted.',
  })
}

// Validates a batch of answer/review/position changes
const parseBatch = (body, validIds, total) => {
  const set = {}
  const unset = {}
  const out = {}

  if (body.answers !== undefined) {
    const a = body.answers
    if (typeof a !== 'object' || a === null || Array.isArray(a)) {
      return { error: 'answers must be an object of { questionId: optionIndex | null }' }
    }
    const keys = Object.keys(a)
    if (keys.length > total) return { error: 'Too many answers in one request' }
    for (const qid of keys) {
      if (!validIds.has(qid)) return { error: `Question ${qid} is not part of this exam` }
      const v = a[qid]
      if (v === null) {
        unset[`answers.${qid}`] = ''                       // clear response
      } else if (Number.isInteger(v) && v >= 0 && v <= 3) {
        set[`answers.${qid}`] = {
          questionId: qid, selectedOptionIndex: v, isCorrect: false, answeredAt: new Date(),
        }
      } else {
        return { error: 'selectedOptionIndex must be 0-3 or null' }
      }
    }
  }

  if (body.markedForReview !== undefined) {
    const m = body.markedForReview
    if (!Array.isArray(m) || m.length > total) return { error: 'markedForReview must be an array' }
    for (const qid of m) {
      if (!validIds.has(String(qid))) return { error: `Question ${qid} is not part of this exam` }
    }
    set.markedForReview = [...new Set(m.map(String))]
  }

  if (body.currentQuestionIndex !== undefined) {
    const i = body.currentQuestionIndex
    if (!Number.isInteger(i) || i < 0 || i >= total) return { error: 'Invalid currentQuestionIndex' }
    set.currentQuestionIndex = i
  }

  out.update = { $inc: { answerRev: 1 } }
  if (Object.keys(set).length)   out.update.$set   = set
  if (Object.keys(unset).length) out.update.$unset = unset
  return out
}

// One atomic write; rejected if not owner / not in progress / past deadline
const applyBatch = (attemptId, userId, update) =>
  QuizAttempt.findOneAndUpdate(
    {
      _id: attemptId, userId, mode: 'mock', status: 'in_progress',
      deadlineAt: { $gt: new Date() },
    },
    update,
    { returnDocument: 'after' }
  ).lean()

const loadValidIds = async (quizId) => {
  const quiz = await Quiz.findById(quizId).select('questions').lean()
  return new Set((quiz?.questions || []).map(String))
}

// ── GET /api/mock/enabled-exams ───────────────────────────────────────────
const getEnabledExams = (req, res) => {
  res.status(200).json({ success: true, data: { exams: MOCK_ENABLED_EXAMS } })
}

// ── GET /api/mock/quiz/:quizId/config ─────────────────────────────────────
const getMockConfig = async (req, res, next) => {
  try {
    const { quizId } = req.params
    if (!isValidId(quizId)) { res.status(400); return next(new Error('Invalid quiz ID')) }

    const quiz = await Quiz.findById(quizId)
      .select('title exam stream subject year variant timeLimitMinutes markingScheme questions isPublished')
      .lean()
    if (!quiz || !quiz.isPublished) { res.status(404); return next(new Error('Quiz not found')) }

    // Not enabled for this exam → not an error, the frontend just uses Practice Mode
    if (!isMockEnabled(quiz.exam)) {
      return res.status(200).json({ success: true, data: { mockEnabled: false } })
    }

    const scheme = {
      correct:     quiz.markingScheme?.correct     ?? 5,
      wrong:       quiz.markingScheme?.wrong       ?? -1,
      unattempted: quiz.markingScheme?.unattempted ?? 0,
    }
    const questionCount      = quiz.questions.length
    const durationConfigured = quiz.timeLimitMinutes > 0
    const issues = []
    if (!durationConfigured) issues.push('Exam duration has not been configured for this paper.')
    if (questionCount === 0) issues.push('This paper has no questions.')

    await finalizeExpiredFor(req.user._id, quiz._id)
    const active = await QuizAttempt.findOne({
      userId: req.user._id, quizId: quiz._id, mode: 'mock', status: 'in_progress',
    }).select('_id').lean()

    res.status(200).json({
      success: true,
      data: {
        mockEnabled:        true,
        quizId:             quiz._id,
        title:              quiz.title,
        exam:               quiz.exam,
        stream:             quiz.stream,
        subject:            quiz.subject,
        year:               quiz.year,
        variant:            quiz.variant,
        durationMinutes:    durationConfigured ? quiz.timeLimitMinutes : null,
        durationConfigured,
        questionCount,
        maxMarks:           questionCount * scheme.correct,
        markingScheme:      scheme,
        negativeMarking:    scheme.wrong < 0,
        canStart:           issues.length === 0,
        issues,
        activeAttemptId:    active ? active._id : null,
      },
    })
  } catch (error) { next(error) }
}

// ── POST /api/mock/quiz/:quizId/start ─────────────────────────────────────
const startMockAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.params
    const userId = req.user._id
    if (!isValidId(quizId)) { res.status(400); return next(new Error('Invalid quiz ID')) }

    const quiz = await Quiz.findById(quizId)
      .select('exam timeLimitMinutes questions isPublished').lean()
    if (!quiz || !quiz.isPublished) { res.status(404); return next(new Error('Quiz not found')) }
    if (!isMockEnabled(quiz.exam)) { res.status(403); return next(new Error('Mock exam is not available for this exam')) }
    if (!(quiz.timeLimitMinutes > 0)) { res.status(422); return next(new Error('Exam duration is not configured for this paper')) }
    if (quiz.questions.length === 0) { res.status(422); return next(new Error('This paper has no questions')) }

    // Settle anything that already expired, then resume or create
    await finalizeExpiredFor(userId, quiz._id)

    const findActive = () => QuizAttempt.findOne({
      userId, quizId: quiz._id, mode: 'mock', status: 'in_progress',
    }).lean()

    let attempt  = await findActive()
    let resumed  = !!attempt

    if (!attempt) {
      const startedAt       = new Date()
      const durationSeconds = quiz.timeLimitMinutes * 60
      try {
        const created = await QuizAttempt.create({
          userId, quizId: quiz._id, mode: 'mock',
          totalQuestions: quiz.questions.length,
          currentQuestionIndex: 0, answers: {},
          status: 'in_progress',
          startedAt, durationSeconds,
          deadlineAt: new Date(startedAt.getTime() + durationSeconds * 1000),
        })
        attempt = created.toObject()
      } catch (err) {
        if (err.code !== 11000) throw err          // duplicate → someone just started it
        attempt = await findActive()
        resumed = true
      }
    }

    res.status(resumed ? 200 : 201).json({
      success: true,
      data: {
        attemptId:  attempt._id,
        deadlineAt: attempt.deadlineAt,
        serverNow:  new Date().toISOString(),
        resumed,
      },
    })
  } catch (error) { next(error) }
}

// ── GET /api/mock/attempts/:id ────────────────────────────────────────────
// Questions WITHOUT correct answers, explanations or grace flags.
const getMockAttempt = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!isValidId(id)) { res.status(400); return next(new Error('Invalid attempt ID')) }

    let attempt = await QuizAttempt.findOne({ _id: id, userId: req.user._id, mode: 'mock' }).lean()
    if (!attempt) { res.status(404); return next(new Error('Attempt not found')) }

    // Lazy deadline enforcement
    if (attempt.status === 'in_progress' && attempt.deadlineAt && new Date() >= attempt.deadlineAt) {
      attempt = await finalizeAttempt(id, { reason: 'timeout' })
    }

    if (attempt.status !== 'in_progress') {
      return res.status(200).json({
        success: true,
        data: {
          finalized: true, status: attempt.status,
          attemptId: attempt._id, quizId: attempt.quizId,
          submittedBy: attempt.submittedBy,
        },
      })
    }

    const quiz = await Quiz.findById(attempt.quizId)
      .select('title exam stream subject year variant markingScheme questions')
      .populate({ path: 'questions', select: 'questionText questionImageUrl options' })
      .lean()

    const answers = {}
    for (const [qid, a] of Object.entries(attempt.answers || {})) {
      if (a && a.selectedOptionIndex !== null && a.selectedOptionIndex !== undefined) {
        answers[qid] = a.selectedOptionIndex
      }
    }

    res.status(200).json({
      success: true,
      data: {
        finalized:            false,
        attemptId:            attempt._id,
        quizId:               attempt.quizId,
        title:                quiz.title,
        exam:                 quiz.exam,
        stream:               quiz.stream,
        subject:              quiz.subject,
        year:                 quiz.year,
        variant:              quiz.variant,
        markingScheme:        quiz.markingScheme,
        questions:            quiz.questions,
        answers,
        markedForReview:      (attempt.markedForReview || []).map(String),
        currentQuestionIndex: attempt.currentQuestionIndex || 0,
        startedAt:            attempt.startedAt,
        deadlineAt:           attempt.deadlineAt,
        durationSeconds:      attempt.durationSeconds,
        warningThresholdsSeconds: warningsFor(attempt.durationSeconds),
        serverNow:            new Date().toISOString(),
      },
    })
  } catch (error) { next(error) }
}

// ── PUT /api/mock/attempts/:id/answers ────────────────────────────────────
// Batched save. Body (all optional, send only what changed):
// { answers: { [qid]: 0-3 | null }, markedForReview: [qid...], currentQuestionIndex: n }
const saveMockBatch = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!isValidId(id)) { res.status(400); return next(new Error('Invalid attempt ID')) }

    const attempt = await QuizAttempt.findOne({ _id: id, userId: req.user._id, mode: 'mock' })
      .select('quizId status deadlineAt totalQuestions').lean()
    if (!attempt) { res.status(404); return next(new Error('Attempt not found')) }

    if (attempt.status !== 'in_progress' || new Date() >= attempt.deadlineAt) {
      return rejectInactive(res, id)
    }

    const validIds = await loadValidIds(attempt.quizId)
    const parsed   = parseBatch(req.body || {}, validIds, attempt.totalQuestions)
    if (parsed.error) { res.status(400); return next(new Error(parsed.error)) }

    const updated = await applyBatch(id, req.user._id, parsed.update)
    if (!updated) return rejectInactive(res, id)       // lost a race with deadline/submit

    res.status(200).json({
      success: true,
      data: { savedAt: new Date().toISOString(), deadlineAt: updated.deadlineAt },
    })
  } catch (error) { next(error) }
}

// ── POST /api/mock/attempts/:id/submit ────────────────────────────────────
// Idempotent. Optionally carries a final batch (same shape as saveMockBatch)
// so the last click can't be lost. Repeat calls return the existing result.
const submitMockAttempt = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!isValidId(id)) { res.status(400); return next(new Error('Invalid attempt ID')) }

    const attempt = await QuizAttempt.findOne({ _id: id, userId: req.user._id, mode: 'mock' }).lean()
    if (!attempt) { res.status(404); return next(new Error('Attempt not found')) }

    let final = attempt
    const alreadyFinalized = attempt.status !== 'in_progress'

    if (!alreadyFinalized) {
      const now       = new Date()
      const expired   = now >= attempt.deadlineAt
      const hasBatch  = req.body && (req.body.answers !== undefined ||
                        req.body.markedForReview !== undefined)

      // Apply the final batch only if there is still time
      if (hasBatch && !expired) {
        const validIds = await loadValidIds(attempt.quizId)
        const parsed   = parseBatch(req.body, validIds, attempt.totalQuestions)
        if (parsed.error) { res.status(400); return next(new Error(parsed.error)) }
        await applyBatch(id, req.user._id, parsed.update)   // null is fine → deadline just passed
      }

      final = await finalizeAttempt(id, { reason: expired ? 'timeout' : 'user' })
    }

    if (!final || final.status !== 'completed') {
      return res.status(503).json({
        success: false, code: 'RETRY',
        message: 'Could not finalize right now. Please retry.',
      })
    }

    res.status(200).json({
      success: true,
      data: {
        attemptId:        final._id,
        quizId:           final.quizId,
        status:           'completed',
        score:            final.score,
        submittedBy:      final.submittedBy,
        completedAt:      final.completedAt,
        alreadyFinalized,
      },
    })
  } catch (error) { next(error) }
}

module.exports = {
  getEnabledExams, getMockConfig, startMockAttempt,
  getMockAttempt, saveMockBatch, submitMockAttempt,
}