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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
  },
  currentQuestionIndex: { type: Number, default: 0 },
  answers: {
    type: Map,
    of: AnswerRecordSchema,
    default: {},
  },
  score:          { type: Number, default: 0 },
  totalQuestions: { type: Number, required: true },
  startedAt:      { type: Date, default: Date.now },
  completedAt:    { type: Date, default: null },
  timeSpentSeconds: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema)
