const mongoose = require('mongoose')

const FeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['feedback', 'bug', 'suggestion', 'other'],
    default: 'feedback',
  },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['new', 'read', 'resolved'],
    default: 'new',
  },
}, { timestamps: true })

module.exports = mongoose.model('Feedback', FeedbackSchema)