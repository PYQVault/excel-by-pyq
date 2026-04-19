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
  stream:  { type: String, required: true, trim: true },
  subject: { type: String, trim: true, default: '' },
  year:    { type: Number, required: true },

  // ── NEW: For multiple papers in same year ─────────────────────────
  // Examples: 'A', 'B', 'Morning', 'Evening', 'Shift 1', 'Shift 2'
  // Empty string means only one paper that year
  variant: {
    type: String,
    trim: true,
    default: '',
  },

  questions:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  timeLimitMinutes: { type: Number, default: 0 },
  isPublished:      { type: Boolean, default: true },
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

QuizSchema.index({ exam: 1, stream: 1, subject: 1, isPublished: 1 })
QuizSchema.index({ exam: 1, year: 1, variant: 1 })
QuizSchema.index({ title: 'text', subject: 'text' })

module.exports = mongoose.model('Quiz', QuizSchema)