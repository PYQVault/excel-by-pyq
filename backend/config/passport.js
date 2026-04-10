const passport      = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User          = require('../models/User')

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email  = profile.emails[0].value
      const name   = profile.displayName
      const avatar = profile.photos[0]?.value
      const googleId = profile.id

      // Check if user already exists with this email
      let user = await User.findOne({ email })

      if (user) {
        // Update googleId if they previously registered locally
        if (!user.googleId) {
          user.googleId     = googleId
          user.avatar       = avatar
          user.authProvider = 'google'
          await user.save()
        }
        return done(null, user)
      }

      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        authProvider: 'google',
        // No password for Google users
      })

      return done(null, user)
    } catch (err) {
      return done(err, null)
    }
  }
))

module.exports = passport