const mongoose = require('mongoose')

const AnswerRecordSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  selectedOptionIndex: {
    type: Number,
    enum: [0, 1, 2, 3, null],
    default: null,
  },
  isCorrect:  { type: Boolean, default: false },
  answeredAt: { type: Date, default: Date.now },
}, { _id: false })

const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
  },
  currentQuestionIndex: { type: Number, default: 0 },
  answers: { type: Map, of: AnswerRecordSchema, default: {} },
  score:            { type: Number, default: 0 },
  totalQuestions:   { type: Number, required: true },
  startedAt:        { type: Date, default: Date.now },
  completedAt:      { type: Date, default: null },
  timeSpentSeconds: { type: Number, default: 0 },

  // ── Mock exam fields (practice attempts leave these at defaults) ───
  mode:            { type: String, enum: ['practice', 'mock'], default: 'practice' },
  deadlineAt:      { type: Date, default: null },     // server-computed
  durationSeconds: { type: Number, default: 0 },      // snapshot at start
  markedForReview: [{ type: mongoose.Schema.Types.ObjectId }],
  answerRev:       { type: Number, default: 0 },      // bumps on every save
  submittedBy:     { type: String, enum: ['user', 'timeout', null], default: null },
}, { timestamps: true })

// Sweeper: find expired mock attempts quickly
QuizAttemptSchema.index({ mode: 1, status: 1, deadlineAt: 1 })

// One ACTIVE mock attempt per user per paper (blocks double-click / double-tab starts).
// Partial index, so practice attempts and old documents are unaffected.
QuizAttemptSchema.index(
  { userId: 1, quizId: 1, mode: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { mode: 'mock', status: 'in_progress' },
    name: 'one_active_mock_per_user_quiz',
  }
)

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema)