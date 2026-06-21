const mongoose = require('mongoose')

const MarkingSchemeSchema = new mongoose.Schema({
  correct:     { type: Number, default: 5 },
  wrong:       { type: Number, default: -1 },
  unattempted: { type: Number, default: 0  },
}, { _id: false })

const QuizSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  exam: {
    type: String,
    required: true,
    enum: ['CUET_UG', 'CUET_PG', 'UGC_NET'],
  },

  // ── UGC NET has no stream — goes straight to subject ──────────────
  stream:  { type: String, trim: true, default: '' },
  subject: { type: String, trim: true, default: '' },

  year:    { type: Number, required: true },

  // ── Variant — A/B/C for CUET, June/December for UGC NET ──────────
  variant: { type: String, trim: true, default: '' },

  // ── Marking scheme per quiz ────────────────────────────────────────
  markingScheme: {
    type:    MarkingSchemeSchema,
    default: () => ({ correct: 5, wrong: -1, unattempted: 0 }),
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