const mongoose = require('mongoose')
const Quiz     = require('../models/Quiz')

// ── Exams where stream = organization, no subject level ───────────────────
const DIRECT_TO_QUIZ_EXAMS = ['FSL_PSC']

// ── GET /api/quizzes/meta ─────────────────────────────────────────────────
const getQuizMeta = async (req, res, next) => {
  try {
    const pipeline = [
      { $match: { isPublished: true } },
      {
        $group: {
          _id: {
            exam:    '$exam',
            stream:  '$stream',
            subject: '$subject',
          },
          ids: {
            $push: {
              _id:     '$_id',
              title:   '$title',
              year:    '$year',
              variant: '$variant',
            },
          },
        },
      },
    ]

    const results = await Quiz.aggregate(pipeline)

    const tree = {}
    results.forEach(({ _id, ids }) => {
      const { exam, stream, subject } = _id
      if (!tree[exam]) tree[exam] = {}

      const streamKey = stream?.trim() || ''

      if (DIRECT_TO_QUIZ_EXAMS.includes(exam)) {
        // FSL_PSC: stream = organization, quizzes listed directly
        // tree[FSL_PSC][Karnataka State Police] = [quiz1, quiz2, ...]
        if (!tree[exam][streamKey]) tree[exam][streamKey] = []
        tree[exam][streamKey].push(...ids)
      } else {
        // CUET_UG, UGC_NET, etc — normal subject grouping
        const subjectKey = subject?.trim() || '__none__'
        if (!tree[exam][streamKey])              tree[exam][streamKey] = {}
        if (!tree[exam][streamKey][subjectKey])  tree[exam][streamKey][subjectKey] = []
        tree[exam][streamKey][subjectKey].push(...ids)
      }
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

    if (req.query.exam) filter.exam = req.query.exam

    if (req.query.stream && req.query.stream !== '__no_stream__') {
      filter.stream = req.query.stream
    }

    if (req.query.subject && req.query.subject !== '__none__') {
      filter.subject = req.query.subject
    }

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

    const quizzes = await Quiz.find(filter)
      .select('title description exam stream subject year variant timeLimitMinutes questions createdAt markingScheme')
      .sort({ year: -1, variant: 1 })
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
      select: 'questionText questionImageUrl options correctOptionIndex explanation isGrace',
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