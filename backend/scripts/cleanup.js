/**
 * Cleanup Script — safely delete quizzes and their questions
 *
 * COMMANDS:
 *
 * List all quizzes:
 *   node scripts/cleanup.js --list
 *
 * Delete one quiz by title:
 *   node scripts/cleanup.js --deleteTitle="CUET UG 2022 - Accountancy"
 *
 * Delete one quiz by ID:
 *   node scripts/cleanup.js --deleteId="64f3a1b2c3d4e5f6a7b8c9d0"
 *
 * Delete ALL quizzes for a subject:
 *   node scripts/cleanup.js --deleteSubject="Accountancy"
 *
 * Delete ALL quizzes for an exam:
 *   node scripts/cleanup.js --deleteExam="CUET_UG"
 *
 * Fix image URLs (move URLs from questionText to questionImageUrl):
 *   node scripts/cleanup.js --fixImages
 *
 * Fix line breaks in all questions:
 *   node scripts/cleanup.js --fixLineBreaks
 */

require('dotenv').config()
const mongoose = require('mongoose')
const Question = require('../models/Question')
const Quiz     = require('../models/Quiz')

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace('--', '').split('=')
    return [key, rest.join('=')]
  })
)

function isImageUrl(str) {
  if (!str) return false
  const lower = str.toLowerCase().trim()
  return (
    (lower.startsWith('http://') || lower.startsWith('https://')) &&
    (
      lower.includes('.png')           ||
      lower.includes('.jpg')           ||
      lower.includes('.jpeg')          ||
      lower.includes('.webp')          ||
      lower.includes('.gif')           ||
      lower.includes('cloudinary.com') ||
      lower.includes('imgur.com')
    )
  )
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('\n✅ Connected to MongoDB\n')

  // ── LIST all quizzes ───────────────────────────────────────────────
  if (args.list !== undefined) {
    const quizzes = await Quiz.find()
      .select('title exam stream subject year variant questions isPublished _id')
      .sort({ exam: 1, subject: 1, year: 1, variant: 1 })
      .lean()

    if (quizzes.length === 0) {
      console.log('No quizzes found.')
    } else {
      console.log(`Found ${quizzes.length} quizzes:\n`)
      quizzes.forEach((q, i) => {
        const variant = q.variant ? ` (${q.variant})` : ''
        const status  = q.isPublished ? '✅' : '⛔'
        console.log(
          `${String(i + 1).padStart(3)}. ${status} [${q.exam}] ` +
          `${q.subject || 'General Aptitude'} ${q.year}${variant} ` +
          `— ${q.questions.length} Qs — ID: ${q._id}`
        )
        console.log(`      "${q.title}"`)
      })
    }
    await mongoose.disconnect()
    return
  }

  // ── DELETE by title ────────────────────────────────────────────────
  if (args.deleteTitle) {
    const quiz = await Quiz.findOne({ title: args.deleteTitle })
    if (!quiz) {
      console.error(`❌ No quiz found with title: "${args.deleteTitle}"`)
      await mongoose.disconnect()
      return
    }
    await deleteQuizAndQuestions(quiz)
    await mongoose.disconnect()
    return
  }

  // ── DELETE by ID ───────────────────────────────────────────────────
  if (args.deleteId) {
    const quiz = await Quiz.findById(args.deleteId)
    if (!quiz) {
      console.error(`❌ No quiz found with ID: "${args.deleteId}"`)
      await mongoose.disconnect()
      return
    }
    await deleteQuizAndQuestions(quiz)
    await mongoose.disconnect()
    return
  }

  // ── DELETE by subject ──────────────────────────────────────────────
  if (args.deleteSubject) {
    const quizzes = await Quiz.find({ subject: new RegExp(args.deleteSubject, 'i') })
    if (!quizzes.length) {
      console.error(`❌ No quizzes found for subject: "${args.deleteSubject}"`)
      await mongoose.disconnect()
      return
    }
    console.log(`Found ${quizzes.length} quizzes for subject "${args.deleteSubject}":\n`)
    for (const quiz of quizzes) {
      await deleteQuizAndQuestions(quiz)
    }
    await mongoose.disconnect()
    return
  }

  // ── DELETE by exam ─────────────────────────────────────────────────
  if (args.deleteExam) {
    const quizzes = await Quiz.find({ exam: args.deleteExam })
    if (!quizzes.length) {
      console.error(`❌ No quizzes found for exam: "${args.deleteExam}"`)
      await mongoose.disconnect()
      return
    }
    console.log(`Found ${quizzes.length} quizzes for exam "${args.deleteExam}":\n`)
    for (const quiz of quizzes) {
      await deleteQuizAndQuestions(quiz)
    }
    await mongoose.disconnect()
    return
  }

  // ── FIX image URLs ─────────────────────────────────────────────────
  if (args.fixImages !== undefined) {
    const questions = await Question.find({})
    console.log(`📄 Found ${questions.length} questions\n`)
    let fixed = 0

    for (const q of questions) {
      let changed = false

      if (isImageUrl(q.questionText)) {
        q.questionImageUrl = q.questionText.trim()
        q.questionText     = ''
        changed = true
      }

      q.options.forEach((opt, i) => {
        if (isImageUrl(opt.text)) {
          q.options[i].imageUrl = opt.text.trim()
          q.options[i].text     = ''
          changed = true
        }
      })

      if (changed) { await q.save(); fixed++ }
    }
    console.log(`✅ Fixed image URLs in ${fixed} questions`)
    await mongoose.disconnect()
    return
  }

  // ── FIX line breaks ────────────────────────────────────────────────
  if (args.fixLineBreaks !== undefined) {
    const questions = await Question.find({})
    console.log(`📄 Found ${questions.length} questions\n`)
    let fixed = 0

    for (const q of questions) {
      let changed = false
      const fix = (str) => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

      const fixedText = fix(q.questionText)
      if (fixedText !== q.questionText) { q.questionText = fixedText; changed = true }

      q.options.forEach((opt, i) => {
        const fixedOpt = fix(opt.text)
        if (fixedOpt !== opt.text) { q.options[i].text = fixedOpt; changed = true }
      })

      const fixedExp = fix(q.explanation)
      if (fixedExp !== q.explanation) { q.explanation = fixedExp; changed = true }

      if (changed) { await q.save(); fixed++ }
    }
    console.log(`✅ Fixed line breaks in ${fixed} questions`)
    await mongoose.disconnect()
    return
  }

  console.log('No command given. Run with --list to see available commands.')
  await mongoose.disconnect()
}

async function deleteQuizAndQuestions(quiz) {
  const variant = quiz.variant ? ` (${quiz.variant})` : ''
  console.log(`🗑️  Deleting: "${quiz.title}"`)

  const deletedQs = await Question.deleteMany({
    _id: { $in: quiz.questions }
  })
  await Quiz.findByIdAndDelete(quiz._id)

  console.log(`   ✅ Deleted ${deletedQs.deletedCount} questions + quiz\n`)
}

run().catch(async (err) => {
  console.error('\n❌ Error:', err.message)
  await mongoose.disconnect()
  process.exit(1)
})