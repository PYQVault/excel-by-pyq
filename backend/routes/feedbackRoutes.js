const express = require('express')
const router  = express.Router()
const { protect }   = require('../middleware/authMiddleware')
const { adminOnly } = require('../middleware/adminMiddleware')
const {
  submitFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} = require('../controllers/feedbackController')

// User — submit feedback (must be logged in)
router.post('/', protect, submitFeedback)

// Admin — view and manage
router.get('/',            protect, adminOnly, getAllFeedback)
router.patch('/:id/status',protect, adminOnly, updateFeedbackStatus)
router.delete('/:id',      protect, adminOnly, deleteFeedback)

module.exports = router