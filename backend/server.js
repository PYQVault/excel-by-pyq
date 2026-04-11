const dotenv   = require('dotenv')
dotenv.config()

const connectDB = require('./config/db')
connectDB()

require('./models/User')
require('./models/Question')
require('./models/Quiz')
require('./models/QuizAttempt')

const express  = require('express')
const cors     = require('cors')
const passport = require('./config/passport')   
const { notFound, errorHandler } = require('./middleware/errorMiddleware')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize())                 

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://excelbypyq.com',
        'https://www.excelbypyq.com',
        'https://excelbypyq.vercel.app',
      ]
    : 'http://localhost:3000',
  credentials: true,
}))

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running ✅' })
})

app.use('/api/auth',     require('./routes/authRoutes'))
app.use('/api/quizzes',  require('./routes/quizRoutes'))
app.use('/api/attempts', require('./routes/attemptRoutes'))
app.use('/api/admin', require('./routes/adminRoutes'))
app.use('/api/feedback', require('./routes/feedbackRoutes'))

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})