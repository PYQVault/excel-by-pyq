const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getEnabledExams, getMockConfig, startMockAttempt,
  getMockAttempt, saveMockBatch, submitMockAttempt,
} = require('../controllers/mockExamController')

router.get('/enabled-exams',          protect, getEnabledExams)
router.get('/quiz/:quizId/config',    protect, getMockConfig)
router.post('/quiz/:quizId/start',    protect, startMockAttempt)
router.get('/attempts/:id',           protect, getMockAttempt)
router.put('/attempts/:id/answers',   protect, saveMockBatch)
router.post('/attempts/:id/submit',   protect, submitMockAttempt)

module.exports = router