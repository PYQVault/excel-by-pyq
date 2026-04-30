const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const User   = require('../models/User')
const {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendFeedbackConfirmation,
} = require('../config/email')

// ── Helpers ────────────────────────────────────────────────────────────────
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
      isVerified:   user.isVerified,
    },
  })
}

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString()

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
      if (!existingUser.isVerified) {
        // Resend OTP for unverified account
        const otp             = generateOTP()
        existingUser.otpCode      = otp
        existingUser.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
        existingUser.otpAttempts  = 0
        await existingUser.save()

        const emailResult = await sendOTPEmail({
          toEmail: email,
          toName:  existingUser.name,
          otp,
        })

        if (!emailResult.success) {
          res.status(500)
          return next(new Error('Failed to send OTP. Try again.'))
        }

        return res.status(200).json({
          success:              true,
          requiresVerification: true,
          email,
          message: 'OTP resent. Please verify your email.',
        })
      }
      res.status(400)
      return next(new Error('Email already registered'))
    }

    const otp  = generateOTP()
    const user = await User.create({
      name,
      email,
      password,
      isVerified:   false,
      otpCode:      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts:  0,
    })

    const emailResult = await sendOTPEmail({ toEmail: email, toName: name, otp })

    if (!emailResult.success) {
      await User.findByIdAndDelete(user._id)
      res.status(500)
      return next(new Error('Failed to send OTP email. Try again.'))
    }

    res.status(201).json({
      success:              true,
      requiresVerification: true,
      email,
      message: 'OTP sent to your email.',
    })
  } catch (error) {
    next(error)
  }
}

// ── Verify OTP ─────────────────────────────────────────────────────────────
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      res.status(400)
      return next(new Error('Email and OTP are required'))
    }

    const user = await User.findOne({ email })
      .select('+otpCode +otpExpiresAt +otpAttempts')

    if (!user) {
      res.status(404)
      return next(new Error('User not found'))
    }

    if (user.isVerified) {
      return sendTokenResponse(user, 200, res)
    }

    if (user.otpAttempts >= 5) {
      res.status(429)
      return next(new Error('Too many attempts. Request a new OTP.'))
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      res.status(400)
      return next(new Error('OTP has expired. Please request a new one.'))
    }

    if (user.otpCode !== otp.toString().trim()) {
      user.otpAttempts += 1
      await user.save()
      const remaining = 5 - user.otpAttempts
      res.status(400)
      return next(new Error(
        `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
      ))
    }

    // OTP correct
    user.isVerified   = true
    user.otpCode      = null
    user.otpExpiresAt = null
    user.otpAttempts  = 0
    await user.save()

    sendTokenResponse(user, 200, res)
  } catch (error) {
    next(error)
  }
}

// ── Resend OTP ─────────────────────────────────────────────────────────────
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400)
      return next(new Error('Email is required'))
    }

    const user = await User.findOne({ email })
      .select('+otpCode +otpExpiresAt +otpAttempts')

    if (!user) {
      res.status(404)
      return next(new Error('User not found'))
    }

    if (user.isVerified) {
      res.status(400)
      return next(new Error('Email already verified'))
    }

    const otp         = generateOTP()
    user.otpCode      = otp
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    user.otpAttempts  = 0
    await user.save()

    const emailResult = await sendOTPEmail({
      toEmail: email,
      toName:  user.name,
      otp,
    })

    if (!emailResult.success) {
      res.status(500)
      return next(new Error('Failed to send OTP. Try again.'))
    }

    res.status(200).json({
      success: true,
      message: 'New OTP sent to your email.',
    })
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

    if (user.authProvider === 'google' && !user.password) {
      res.status(401)
      return next(new Error('This account uses Google Sign-In.'))
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401)
      return next(new Error('Invalid email or password'))
    }

    if (!user.isVerified) {
      const otp         = generateOTP()
      user.otpCode      = otp
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
      user.otpAttempts  = 0
      await user.save()
      await sendOTPEmail({ toEmail: email, toName: user.name, otp })

      return res.status(403).json({
        success:              false,
        requiresVerification: true,
        email,
        message: 'Please verify your email. A new OTP has been sent.',
      })
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
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    const resetToken  = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    user.resetPasswordToken   = hashedToken
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000
    await user.save()

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    const result   = await sendPasswordResetEmail({
      toEmail: user.email,
      toName:  user.name,
      resetUrl,
    })

    if (!result.success) {
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

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires')

    if (!user) {
      res.status(400)
      return next(new Error('Reset link is invalid or has expired'))
    }

    user.password             = password
    user.resetPasswordToken   = null
    user.resetPasswordExpires = null
    await user.save()

    sendTokenResponse(user, 200, res)
  } catch (error) {
    next(error)
  }
}

// ── Google OAuth Callback ──────────────────────────────────────────────────
const googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id)
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?token=${token}&user=${encodeURIComponent(
        JSON.stringify({
          _id:          req.user._id,
          name:         req.user.name,
          email:        req.user.email,
          role:         req.user.role,
          avatar:       req.user.avatar,
          authProvider: req.user.authProvider,
          isVerified:   true,
        })
      )}`
    )
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`)
  }
}

// ── EXPORTS ────────────────────────────────────────────────────────────────
module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback,
}