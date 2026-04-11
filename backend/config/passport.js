const passport       = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User           = require('../models/User')

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    proxy: true,   // ← Add this for Render (handles HTTPS proxy correctly)
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email    = profile.emails[0].value
      const name     = profile.displayName
      const avatar   = profile.photos[0]?.value
      const googleId = profile.id

      let user = await User.findOne({ email })

      if (user) {
        if (!user.googleId) {
          user.googleId     = googleId
          user.avatar       = avatar
          user.authProvider = 'google'
          await user.save()
        }
        return done(null, user)
      }

      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        authProvider: 'google',
      })

      return done(null, user)
    } catch (err) {
      return done(err, null)
    }
  }
))

module.exports = passport