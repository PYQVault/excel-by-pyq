const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
    select: false,
    // Not required — Google users won't have a password
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },

  // ── Google OAuth ───────────────────────────────────────────────────
  googleId: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: null,   // Google profile picture URL
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },

  // ── Password Reset ─────────────────────────────────────────────────
  resetPasswordToken: {
    type: String,
    default: null,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
    select: false,
  },

}, { timestamps: true })

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return
  this.password = await bcrypt.hash(this.password, 12)
})

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', UserSchema)