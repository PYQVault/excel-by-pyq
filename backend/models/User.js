const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true,
  },
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
    trim:      true,
  },
  password: {
    type:      String,
    minlength: 6,
    select:    false,
  },
  role: {
    type:    String,
    enum:    ['student', 'admin'],
    default: 'student',
  },
  googleId:     { type: String,  default: null },
  avatar:       { type: String,  default: null },
  authProvider: {
    type:    String,
    enum:    ['local', 'google'],
    default: 'local',
  },

  // ── Email Verification ─────────────────────────────────────────────
  isVerified:   { type: Boolean, default: false },
  otpCode:      { type: String,  default: null, select: false },
  otpExpiresAt: { type: Date,    default: null, select: false },
  otpAttempts:  { type: Number,  default: 0,    select: false },

  // ── Password Reset ─────────────────────────────────────────────────
  resetPasswordToken:   { type: String, default: null, select: false },
  resetPasswordExpires: { type: Date,   default: null, select: false },

}, { timestamps: true })

// Hash password before save
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return
  this.password = await bcrypt.hash(this.password, 12)
})

// Compare password method
UserSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', UserSchema)