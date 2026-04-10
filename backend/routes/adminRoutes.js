const express = require('express')
const router  = express.Router()
const { protect }   = require('../middleware/authMiddleware')
const { adminOnly } = require('../middleware/adminMiddleware')
const {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAdminQuizzes,
  toggleQuizPublish,
  deleteQuiz,
} = require('../controllers/adminController')

// All admin routes require login + admin role
router.use(protect, adminOnly)

router.get('/stats',                   getStats)
router.get('/users',                   getUsers)
router.patch('/users/:id/role',        updateUserRole)
router.delete('/users/:id',            deleteUser)
router.get('/quizzes',                 getAdminQuizzes)
router.patch('/quizzes/:id/toggle',    toggleQuizPublish)
router.delete('/quizzes/:id',          deleteQuiz)

module.exports = router