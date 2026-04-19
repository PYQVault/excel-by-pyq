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

      // ── Key fix: use 'General Aptitude' for streams with no subject ──
      // General Aptitude papers have no subject — group under special key
      const subjectKey = subject?.trim() || 'General Aptitude'

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
    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 20
    const skip  = (page - 1) * limit

    const filter = { isPublished: true }
    if (req.query.exam)    filter.exam    = req.query.exam
    if (req.query.stream)  filter.stream  = req.query.stream
    if (req.query.subject) filter.subject = req.query.subject

    if (req.query.search) {
      const words = req.query.search.trim().split(/\s+/).filter(Boolean)
      filter.$and = words.map((word) => {
        const regex = new RegExp(word, 'i')
        return {
          $or: [
            { title: regex }, { subject: regex },
            { stream: regex }, { exam: regex },
          ],
        }
      })
    }

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .select('title description exam stream subject year timeLimitMinutes questions createdAt')
        .sort({ year: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quiz.countDocuments(filter),
    ])

    const data = quizzes.map((q) => ({
      ...q,
      questionCount: q.questions.length,
    }))

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data,
    })
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