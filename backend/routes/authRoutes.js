const express  = require('express')
const router   = express.Router()
const passport = require('../config/passport')
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback,
} = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')

// Local auth
router.post('/register',       register)
router.post('/login',          login)
router.get('/me',              protect, getMe)

// Forgot / Reset password
router.post('/forgot-password',        forgotPassword)
router.post('/reset-password/:token',  resetPassword)

// Google OAuth
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
)
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
    session: false,
  }),
  googleCallback
)

module.exports = router