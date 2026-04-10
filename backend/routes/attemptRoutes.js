const express = require('express');
const router = express.Router();
const {
  startOrResumeAttempt,
  saveAnswer,
  submitAttempt,
  abandonAttempt,
  getMyAttempts, 
   getAttemptResults,
} = require('../controllers/attemptController');
const { protect } = require('../middleware/authMiddleware');

// All attempt routes require login
router.get('/my-attempts', protect, getMyAttempts)
router.post('/start',           protect, startOrResumeAttempt);
router.patch('/:id/answer',     protect, saveAnswer);
router.post('/:id/submit',      protect, submitAttempt);
router.post('/:id/abandon',     protect, abandonAttempt);
router.get('/:id/results',      protect, getAttemptResults)  

module.exports = router;