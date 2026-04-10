const express = require('express')
const router  = express.Router()
const {
  getQuizMeta,
  getAllQuizzes,
  getQuizById,
} = require('../controllers/quizController')
const { protect } = require('../middleware/authMiddleware')

// ⚠️ ORDER MATTERS — specific routes before param routes
router.get('/meta',  protect, getQuizMeta)     // ✅ first
router.get('/',      protect, getAllQuizzes)    // ✅ second
router.get('/:id',   protect, getQuizById)     // ✅ last

module.exports = router