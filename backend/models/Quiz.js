const mongoose = require('mongoose')

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: { type: String, default: '' },
  exam: {
    type: String,
    required: true,
    enum: ['CUET_UG', 'CUET_PG', 'UGC_NET'],
  },
  stream: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
    default: '',        // ← empty for General Aptitude
  },
  year: {
    type: Number,
    required: true,
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  timeLimitMinutes: { type: Number, default: 0 },
  isPublished:      { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true })

QuizSchema.index({ exam: 1, stream: 1, subject: 1 })
QuizSchema.index({ exam: 1, year: 1 })

module.exports = mongoose.model('Quiz', QuizSchema)