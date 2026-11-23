const QuizAttempt = require('../models/QuizAttempt')
const Quiz        = require('../models/Quiz')

// ── Same marking rules as your practice submit, on the server ─────────────
const scoreAttempt = (quiz, rawAnswers) => {
  const scheme  = quiz.markingScheme || {}
  const CORRECT = scheme.correct     ?? 5
  const WRONG   = scheme.wrong       ?? -1
  const SKIP    = scheme.unattempted ?? 0

  let totalMarks = 0
  const finalAnswers = {}

  for (const q of quiz.questions) {
    const qid = String(q._id)
    const a   = rawAnswers[qid]
    const attempted =
      a && a.selectedOptionIndex !== null && a.selectedOptionIndex !== undefined

    if (attempted) {
      const isCorrect = q.isGrace ? true : q.correctOptionIndex === a.selectedOptionIndex
      finalAnswers[qid] = {
        questionId:          q._id,
        selectedOptionIndex: a.selectedOptionIndex,
        isCorrect,
        answeredAt:          a.answeredAt || new Date(),
      }
    }

    if (q.isGrace)        totalMarks += CORRECT
    else if (attempted)   totalMarks += finalAnswers[qid].isCorrect ? CORRECT : WRONG
    else                  totalMarks += SKIP
  }

  return { totalMarks, finalAnswers }
}

// ── Idempotent finalize ───────────────────────────────────────────────────
// Safe to call any number of times, from any number of callers at once.
// The write is conditional on status === 'in_progress' AND answerRev being
// unchanged since we read, so a late answer save can never be lost, and an
// already-finalized attempt is never recalculated or overwritten.
const finalizeAttempt = async (attemptId, { reason = 'user' } = {}) => {
  for (let tries = 0; tries < 3; tries++) {
    const attempt = await QuizAttempt.findById(attemptId).lean()
    if (!attempt) return null
    if (attempt.status !== 'in_progress') return attempt       // already final

    const quiz = await Quiz.findById(attempt.quizId)
      .populate({ path: 'questions', select: 'correctOptionIndex isGrace' })
      .lean()
    if (!quiz) return attempt

    const now      = new Date()
    const timedOut = reason === 'timeout' || (attempt.deadlineAt && now >= attempt.deadlineAt)
    const submittedBy = timedOut ? 'timeout' : 'user'
    const completedAt = timedOut && attempt.deadlineAt ? attempt.deadlineAt : now

    const { totalMarks, finalAnswers } = scoreAttempt(quiz, attempt.answers || {})

    const updated = await QuizAttempt.findOneAndUpdate(
      { _id: attemptId, status: 'in_progress', answerRev: attempt.answerRev || 0 },
      {
        $set: {
          status:           'completed',
          score:            totalMarks,
          answers:          finalAnswers,
          completedAt,
          submittedBy,
          timeSpentSeconds: Math.max(0, Math.round((completedAt - attempt.startedAt) / 1000)),
        },
      },
      { returnDocument: 'after' }
    ).lean()

    if (updated) return updated
  }
  return QuizAttempt.findById(attemptId).lean()
}

// ── Finalize every expired attempt of one user on one paper ───────────────
const finalizeExpiredFor = async (userId, quizId) => {
  const expired = await QuizAttempt.find({
    userId, quizId, mode: 'mock', status: 'in_progress',
    deadlineAt: { $lte: new Date() },
  }).select('_id').lean()
  for (const a of expired) await finalizeAttempt(a._id, { reason: 'timeout' })
}

// ── Background recovery sweeper ───────────────────────────────────────────
// Catches attempts nobody touched after the deadline (closed browser, etc.)
let sweeping = false
const sweepExpiredAttempts = async () => {
  if (sweeping) return
  sweeping = true
  try {
    const expired = await QuizAttempt.find({
      mode: 'mock', status: 'in_progress', deadlineAt: { $lte: new Date() },
    }).select('_id').limit(100).lean()

    for (const a of expired) {
      try { await finalizeAttempt(a._id, { reason: 'timeout' }) }
      catch (e) { console.error('Sweeper: finalize failed', String(a._id), e.message) }
    }
    if (expired.length) console.log(`🧹 Mock sweeper finalized ${expired.length} expired attempt(s)`)
  } catch (e) {
    console.error('Sweeper error:', e.message)
  } finally {
    sweeping = false
  }
}

const startMockSweeper = () => {
  setTimeout(sweepExpiredAttempts, 10 * 1000)       // recovery after a restart
  setInterval(sweepExpiredAttempts, 60 * 1000)
  console.log('🧹 Mock exam sweeper started')
}

module.exports = { scoreAttempt, finalizeAttempt, finalizeExpiredFor, startMockSweeper }