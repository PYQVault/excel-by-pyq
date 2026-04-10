const mongoose = require('mongoose')
const Quiz     = require('../models/Quiz')

// ── GET /api/quizzes/meta ─────────────────────────────────────────────────
const getQuizMeta = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ isPublished: true })
      .select('exam stream subject year title _id')
      .lean()

    const tree = {}

    quizzes.forEach(({ exam, stream, subject, year, title, _id }) => {
      if (!tree[exam])         tree[exam] = {}
      if (!tree[exam][stream]) tree[exam][stream] = {}

      // ── Key fix: use '__none__' for streams with no subject ──
      // General Aptitude papers have no subject — group under special key
      const subjectKey = subject?.trim() || '__none__'

      if (!tree[exam][stream][subjectKey]) {
        tree[exam][stream][subjectKey] = []
      }
      tree[exam][stream][subjectKey].push({ _id, title, year })
    })

    res.status(200).json({ success: true, data: tree })
  } catch (error) {
    next(error)
  }
}

// ── GET /api/quizzes ──────────────────────────────────────────────────────
const getAllQuizzes = async (req, res, next) => {
  try {
    const filter = { isPublished: true }

    if (req.query.exam)    filter.exam    = req.query.exam
    if (req.query.stream)  filter.stream  = req.query.stream
    if (req.query.subject) filter.subject = req.query.subject

    // ── Smart search ─────────────────────────────────────────────────────
    if (req.query.search) {
      const raw = req.query.search.trim()

      // Split search into individual words — match ALL of them
      // "cuet chem" → must contain "cuet" AND "chem"
      const words = raw.split(/\s+/).filter(Boolean)

      if (words.length === 1) {
        // Single word — simple regex
        const regex = new RegExp(raw, 'i')
        filter.$or = [
          { title:   regex },
          { subject: regex },
          { stream:  regex },
          { exam:    regex },
          { description: regex },
        ]
      } else {
        // Multiple words — each word must match somewhere in the document
        filter.$and = words.map((word) => {
          const regex = new RegExp(word, 'i')
          return {
            $or: [
              { title:       regex },
              { subject:     regex },
              { stream:      regex },
              { exam:        regex },
              { description: regex },
            ],
          }
        })
      }
    }

    const quizzes = await Quiz.find(filter)
      .select('title description exam stream subject year timeLimitMinutes questions createdAt')
      .sort({ year: -1 })
      .lean()

    const data = quizzes.map((q) => ({
      ...q,
      questionCount: q.questions.length,
    }))

    res.status(200).json({ success: true, count: data.length, data })
  } catch (error) {
    next(error)
  }
}

// ── GET /api/quizzes/:id ──────────────────────────────────────────────────
const getQuizById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400)
      return next(new Error('Invalid quiz ID'))
    }

    const quiz = await Quiz.findById(req.params.id).populate({
      path:   'questions',
      select: 'questionText questionImageUrl options explanation',
    })

    if (!quiz) {
      res.status(404)
      return next(new Error('Quiz not found'))
    }

    res.status(200).json({ success: true, data: quiz })
  } catch (error) {
    next(error)
  }
}

module.exports = { getQuizMeta, getAllQuizzes, getQuizById }