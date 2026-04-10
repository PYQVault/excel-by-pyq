require('dotenv').config()
const mongoose = require('mongoose')
const Question = require('../models/Question')

function isImageUrl(str) {
  if (!str) return false
  const lower = str.toLowerCase().trim()
  return (
    (lower.startsWith('http://') || lower.startsWith('https://')) &&
    (
      lower.includes('.png')  ||
      lower.includes('.jpg')  ||
      lower.includes('.jpeg') ||
      lower.includes('.webp') ||
      lower.includes('.gif')  ||
      lower.includes('cloudinary.com') ||
      lower.includes('imgur.com')
    )
  )
}

async function fixImageUrls() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected\n')

  const questions = await Question.find({})
  console.log(`📄 Found ${questions.length} questions\n`)

  let fixed = 0

  for (const q of questions) {
    let changed = false

    // Fix questionText that is actually an image URL
    if (isImageUrl(q.questionText)) {
      console.log(`  Row: Moving question URL to questionImageUrl`)
      q.questionImageUrl = q.questionText.trim()
      q.questionText     = ''
      changed = true
    }

    // Fix options that are image URLs stored as text
    q.options.forEach((opt, i) => {
      if (isImageUrl(opt.text)) {
        console.log(`  Option ${i + 1}: Moving option URL to imageUrl`)
        q.options[i].imageUrl = opt.text.trim()
        q.options[i].text     = ''
        changed = true
      }
    })

    if (changed) {
      await q.save()
      fixed++
    }
  }

  console.log(`\n✅ Fixed ${fixed} questions`)
  await mongoose.disconnect()
  console.log('👋 Done!')
}

fixImageUrls().catch(console.error)