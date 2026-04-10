const mongoose = require('mongoose')

const OptionSchema = new mongoose.Schema({
  text:     { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { _id: true })

const QuestionSchema = new mongoose.Schema({
  questionText:     { type: String, default: '' },
  questionImageUrl: { type: String, default: '' },
  options: {
    type: [OptionSchema],
    validate: {
      validator: (arr) => arr.length === 4,
      message: 'A question must have exactly 4 options.',
    },
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3],
  },
  explanation: { type: String, default: '' },
  tags: [String],
}, { timestamps: true })

module.exports = mongoose.model('Question', QuestionSchema)