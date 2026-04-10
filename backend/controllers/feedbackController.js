const Feedback = require('../models/Feedback')
const {
  sendFeedbackNotification,
  sendFeedbackConfirmation,
} = require('../config/email')

// ── POST /api/feedback ────────────────────────────────────────────────────
const submitFeedback = async (req, res, next) => {
  try {
    const { type, subject, message } = req.body

    // Name and email come from logged-in user
    const name  = req.user.name
    const email = req.user.email

    if (!subject?.trim() || !message?.trim()) {
      res.status(400)
      return next(new Error('Subject and message are required'))
    }

    if (message.trim().length < 10) {
      res.status(400)
      return next(new Error('Message must be at least 10 characters'))
    }

    // Save to DB
    const feedback = await Feedback.create({
      userId:  req.user._id,
      name,
      email,
      type:    type || 'feedback',
      subject: subject.trim(),
      message: message.trim(),
    })

    // Send emails (non-blocking — don't fail if email fails)
    Promise.all([
      sendFeedbackNotification({ name, email, type, subject, message }),
      sendFeedbackConfirmation({ toEmail: email, toName: name, subject }),
    ]).catch((err) => console.error('Feedback email error:', err))

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Thank you!',
      data: { _id: feedback._id },
    })
  } catch (error) {
    next(error)
  }
}

// ── GET /api/feedback — Admin only ────────────────────────────────────────
const getAllFeedback = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1
    const limit  = parseInt(req.query.limit) || 15
    const status = req.query.status || ''
    const type   = req.query.type   || ''
    const skip   = (page - 1) * limit

    const filter = {}
    if (status) filter.status = status
    if (type)   filter.type   = type

    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ])

    res.status(200).json({
      success: true,
      data: feedbacks,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

// ── PATCH /api/feedback/:id/status — Admin only ───────────────────────────
const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['new', 'read', 'resolved'].includes(status)) {
      res.status(400)
      return next(new Error('Invalid status'))
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!feedback) {
      res.status(404)
      return next(new Error('Feedback not found'))
    }

    res.status(200).json({ success: true, data: feedback })
  } catch (error) {
    next(error)
  }
}

// ── DELETE /api/feedback/:id — Admin only ─────────────────────────────────
const deleteFeedback = async (req, res, next) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: 'Feedback deleted' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  submitFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
}