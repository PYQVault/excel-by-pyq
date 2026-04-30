const express  = require('express')
const router   = express.Router()
const passport = require('../config/passport')
const { protect } = require('../middleware/authMiddleware')
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback,
} = require('../controllers/authController')

router.post('/register',              register)
router.post('/verify-otp',            verifyOTP)
router.post('/resend-otp',            resendOTP)
router.post('/login',                 login)
router.get('/me',                     protect, getMe)
router.post('/forgot-password',       forgotPassword)
router.post('/reset-password/:token', resetPassword)

router.get('/google',
  passport.authenticate('google', {
    scope:   ['profile', 'email'],
    session: false,
  })
)
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
    session:         false,
  }),
  googleCallback
)

module.exports = router