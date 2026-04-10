const User        = require('../models/User')
const Quiz        = require('../models/Quiz')
const Question    = require('../models/Question')
const QuizAttempt = require('../models/QuizAttempt')

// ── GET /api/admin/stats ───────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalQuizzes,
      totalQuestions,
      totalAttempts,
      completedAttempts,
      googleUsers,
      adminUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Quiz.countDocuments({ isPublished: true }),
      Question.countDocuments(),
      QuizAttempt.countDocuments(),
      QuizAttempt.countDocuments({ status: 'completed' }),
      User.countDocuments({ authProvider: 'google' }),
      User.countDocuments({ role: 'admin' }),
    ])

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    })

    // Average score across all completed attempts
    const scoreAgg = await QuizAttempt.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgScore: {
            $avg: { $multiply: [{ $divide: ['$score', '$totalQuestions'] }, 100] },
          },
        },
      },
    ])
    const avgScore = scoreAgg[0]?.avgScore
      ? Math.round(scoreAgg[0].avgScore)
      : 0

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalQuizzes,
        totalQuestions,
        totalAttempts,
        completedAttempts,
        googleUsers,
        adminUsers,
        recentSignups,
        avgScore,
      },
    })
  } catch (error) {
    next(error)
  }
}

// ── GET /api/admin/users ───────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const page     = parseInt(req.query.page)  || 1
    const limit    = parseInt(req.query.limit) || 10
    const search   = req.query.search || ''
    const role     = req.query.role   || ''
    const skip     = (page - 1) * limit

    const filter = {}
    if (search) {
      const regex = new RegExp(search, 'i')
      filter.$or  = [{ name: regex }, { email: regex }]
    }
    if (role) filter.role = role

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ])

    // Get attempt counts per user
    const userIds    = users.map((u) => u._id)
    const attemptAgg = await QuizAttempt.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 }, completed: {
        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
      }}},
    ])

    const attemptMap = {}
    attemptAgg.forEach((a) => {
      attemptMap[a._id.toString()] = { count: a.count, completed: a.completed }
    })

    const enriched = users.map((u) => ({
      ...u,
      attempts:  attemptMap[u._id.toString()]?.count     || 0,
      completed: attemptMap[u._id.toString()]?.completed || 0,
    }))

    res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    next(error)
  }
}

// ── PATCH /api/admin/users/:id/role ───────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body

    if (!['student', 'admin'].includes(role)) {
      res.status(400)
      return next(new Error('Invalid role'))
    }

    // Prevent self-demotion
    if (req.params.id === req.user._id.toString()) {
      res.status(400)
      return next(new Error('You cannot change your own role'))
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-password' }
    )

    if (!user) {
      res.status(404)
      return next(new Error('User not found'))
    }

    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      res.status(400)
      return next(new Error('You cannot delete your own account'))
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      res.status(404)
      return next(new Error('User not found'))
    }

    // Delete user's attempts too
    await QuizAttempt.deleteMany({ userId: req.params.id })
    await User.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: `User "${user.name}" deleted successfully`,
    })
  } catch (error) {
    next(error)
  }
}

// ── GET /api/admin/quizzes ─────────────────────────────────────────────────
const getAdminQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find()
      .select('title exam stream subject year questions isPublished createdAt')
      .sort({ createdAt: -1 })
      .lean()

    // Attempt counts per quiz
    const quizIds    = quizzes.map((q) => q._id)
    const attemptAgg = await QuizAttempt.aggregate([
      { $match: { quizId: { $in: quizIds } } },
      { $group: { _id: '$quizId', attempts: { $sum: 1 }, completed: {
        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
      }}},
    ])

    const aMap = {}
    attemptAgg.forEach((a) => {
      aMap[a._id.toString()] = { attempts: a.attempts, completed: a.completed }
    })

    const enriched = quizzes.map((q) => ({
      ...q,
      questionCount: q.questions.length,
      attempts:  aMap[q._id.toString()]?.attempts  || 0,
      completed: aMap[q._id.toString()]?.completed || 0,
    }))

    res.status(200).json({ success: true, data: enriched })
  } catch (error) {
    next(error)
  }
}

// ── PATCH /api/admin/quizzes/:id/toggle ───────────────────────────────────
const toggleQuizPublish = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) {
      res.status(404)
      return next(new Error('Quiz not found'))
    }

    quiz.isPublished = !quiz.isPublished
    await quiz.save()

    res.status(200).json({
      success: true,
      data: { isPublished: quiz.isPublished },
      message: `Quiz ${quiz.isPublished ? 'published' : 'unpublished'}`,
    })
  } catch (error) {
    next(error)
  }
}

// ── DELETE /api/admin/quizzes/:id ─────────────────────────────────────────
const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) {
      res.status(404)
      return next(new Error('Quiz not found'))
    }

    // Delete questions, attempts, quiz
    await Question.deleteMany({ _id: { $in: quiz.questions } })
    await QuizAttempt.deleteMany({ quizId: req.params.id })
    await Quiz.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: `Quiz "${quiz.title}" and its questions deleted`,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAdminQuizzes,
  toggleQuizPublish,
  deleteQuiz,
}