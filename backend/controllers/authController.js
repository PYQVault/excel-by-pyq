const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const User   = require('../models/User')
const { sendPasswordResetEmail } = require('../config/email')

// ── Helper ─────────────────────────────────────────────────────────────────
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id)
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id:          user._id,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      avatar:       user.avatar,
      authProvider: user.authProvider,
    },
  })
}

// ── Register ───────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      res.status(400)
      return next(new Error('Please provide name, email and password'))
    }
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400)
      return next(new Error('Email already registered'))
    }
    const user = await User.create({ name, email, password })
    sendTokenResponse(user, 201, res)
  } catch (error) {
    next(error)
  }
}

// ── Login ──────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400)
      return next(new Error('Please provide email and password'))
    }
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      res.status(401)
      return next(new Error('Invalid email or password'))
    }
    // Google-only users have no password
    if (user.authProvider === 'google' && !user.password) {
      res.status(401)
      return next(new Error('This account uses Google Sign-In. Please login with Google.'))
    }
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401)
      return next(new Error('Invalid email or password'))
    }
    sendTokenResponse(user, 200, res)
  } catch (error) {
    next(error)
  }
}

// ── Get Me ─────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user })
  } catch (error) {
    next(error)
  }
}

// ── Forgot Password ────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400)
      return next(new Error('Please provide your email'))
    }

    const user = await User.findOne({ email })

    // Always return success — prevents email enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    // Google-only users can't reset password
    if (user.authProvider === 'google' && !user.password) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    // Generate reset token — random 32 byte hex string
    const resetToken = crypto.randomBytes(32).toString('hex')

    // Hash before saving to DB (never store raw tokens)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    user.resetPasswordToken   = hashedToken
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000  // 15 minutes
    await user.save()

    // Build reset URL with RAW token (not hashed)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

    // Send email
    const result = await sendPasswordResetEmail({
      toEmail: user.email,
      toName:  user.name,
      resetUrl,
    })

    if (!result.success) {
      // Rollback token if email fails
      user.resetPasswordToken   = null
      user.resetPasswordExpires = null
      await user.save()
      res.status(500)
      return next(new Error('Email could not be sent. Try again.'))
    }

    res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    })
  } catch (error) {
    next(error)
  }
}

// ── Reset Password ─────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token }    = req.params
    const { password } = req.body

    if (!password || password.length < 6) {
      res.status(400)
      return next(new Error('Password must be at least 6 characters'))
    }

    // Hash the incoming token to compare with DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    // Find user with valid non-expired token
    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires')

    if (!user) {
      res.status(400)
      return next(new Error('Reset link is invalid or has expired'))
    }

    // Set new password — pre-save hook will hash it
    user.password             = password
    user.resetPasswordToken   = null
    user.resetPasswordExpires = null
    await user.save()

    sendTokenResponse(user, 200, res)
  } catch (error) {
    next(error)
  }
}

// ── Google OAuth callback ──────────────────────────────────────────────────
const googleCallback = async (req, res) => {
  try {
    // req.user is set by Passport after successful Google auth
    const token = generateToken(req.user._id)

    // Redirect to frontend with token in URL
    // Frontend will extract it and store in localStorage
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?token=${token}&user=${encodeURIComponent(
        JSON.stringify({
          _id:          req.user._id,
          name:         req.user.name,
          email:        req.user.email,
          role:         req.user.role,
          avatar:       req.user.avatar,
          authProvider: req.user.authProvider,
        })
      )}`
    )
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`)
  }
}

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback,
}