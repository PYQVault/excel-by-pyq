/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           Excel By PYQ — Quiz Import Script                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * CUET UG — Domain Specific Subject (with negative marking):
 *   node scripts/importQuiz.js \
 *     --file="CHEMISTRY_2024.xlsx" \
 *     --exam="CUET_UG" \
 *     --stream="Domain Specific Subject" \
 *     --subject="Chemistry" \
 *     --year=2024 \
 *     --title="CUET UG 2024 - Chemistry"
 *
 * CUET UG — Set A/B:
 *   node scripts/importQuiz.js \
 *     --file="CHEMISTRY_2024_A.xlsx" \
 *     --exam="CUET_UG" \
 *     --stream="Domain Specific Subject" \
 *     --subject="Chemistry" \
 *     --year=2024 \
 *     --variant="A" \
 *     --title="CUET UG 2024 - Chemistry (Set A)"
 *
 * CUET UG — General Aptitude (no subject):
 *   node scripts/importQuiz.js \
 *     --file="GENERAL_2024.xlsx" \
 *     --exam="CUET_UG" \
 *     --stream="General Aptitude" \
 *     --year=2024 \
 *     --title="CUET UG 2024 - General Aptitude Test"
 *
 * UGC NET — Forensic Science (no negative marking):
 *   node scripts/importQuiz.js \
 *     --file="FORENSIC_2025_JUNE.xlsx" \
 *     --exam="UGC_NET" \
 *     --subject="Forensic Science" \
 *     --year=2025 \
 *     --variant="June" \
 *     --markingCorrect=2 \
 *     --markingWrong=0 \
 *     --title="UGC NET 2025 June - Forensic Science"
 *
 *   node scripts/importQuiz.js \
 *     --file="FORENSIC_2025_DEC.xlsx" \
 *     --exam="UGC_NET" \
 *     --subject="Forensic Science" \
 *     --year=2025 \
 *     --variant="December" \
 *     --markingCorrect=2 \
 *     --markingWrong=0 \
 *     --title="UGC NET 2025 December - Forensic Science"
 */

require('dotenv').config()
const mongoose = require('mongoose')
const XLSX     = require('xlsx')
const path     = require('path')

const Question = require('../models/Question')
const Quiz     = require('../models/Quiz')

// ── Parse CLI args ─────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace('--', '').split('=')
    return [key, rest.join('=')]
  })
)

const REQUIRED = ['file', 'exam', 'year', 'title']
const missing  = REQUIRED.filter((k) => !args[k])
if (missing.length) {
  console.error(`\n❌ Missing required args: ${missing.join(', ')}`)
  console.error(`\nRequired: --file --exam --year --title`)
  console.error(`Optional: --stream --subject --variant --markingCorrect --markingWrong\n`)
  process.exit(1)
}

const VALID_EXAMS = ['CUET_UG', 'CUET_PG', 'UGC_NET']
if (!VALID_EXAMS.includes(args.exam)) {
  console.error(`❌ Invalid exam. Valid: ${VALID_EXAMS.join(', ')}`)
  process.exit(1)
}

// ── Marking scheme defaults per exam ──────────────────────────────────────
const DEFAULT_MARKING = {
  CUET_UG:  { correct: 5,  wrong: -1, unattempted: 0 },
  CUET_PG:  { correct: 5,  wrong: -1, unattempted: 0 },
  UGC_NET:  { correct: 2,  wrong:  0, unattempted: 0 },
}

const markingScheme = {
  correct: args.markingCorrect
    ? parseFloat(args.markingCorrect)
    : DEFAULT_MARKING[args.exam].correct,
  wrong: args.markingWrong !== undefined
    ? parseFloat(args.markingWrong)
    : DEFAULT_MARKING[args.exam].wrong,
  unattempted: 0,
}

// ── Helpers ────────────────────────────────────────────────────────────────
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

function buildOption(val) {
  const trimmed = (val || '').trim()
  if (!trimmed) return { text: '', imageUrl: '' }

  const lines   = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  let textParts = []
  let imageUrl  = ''

  lines.forEach((line) => {
    if (isImageUrl(line)) imageUrl = line
    else textParts.push(line)
  })

  return { text: textParts.join('\n'), imageUrl }
}

function findCorrectIndex(correctRaw, options) {
  if (!correctRaw && correctRaw !== 0) throw new Error('Correct answer is empty')

  const val = String(correctRaw).trim()
  const map = { '1': 0, 'A': 0, '2': 1, 'B': 1, '3': 2, 'C': 2, '4': 3, 'D': 3 }
  if (map[val.toUpperCase()] !== undefined) return map[val.toUpperCase()]

  const normalize  = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
  const normCorrect = normalize(val)

  const exact = options.findIndex((o) => normalize(o) === normCorrect)
  if (exact !== -1) return exact

  const partial = options.findIndex(
    (o) => normalize(o).includes(normCorrect) || normCorrect.includes(normalize(o))
  )
  if (partial !== -1) {
    console.warn(`   ⚠️  Partial match: "${val}" → Option ${partial + 1}`)
    return partial
  }

  throw new Error(
    `Cannot match "${val}" to:\n` +
    options.map((o, i) => `      ${i + 1}: "${o}"`).join('\n')
  )
}

function cellStr(row, key) {
  return String(row[key] ?? row[key?.trim()] ?? '').trim()
}

// ── Main ───────────────────────────────────────────────────────────────────
async function importQuiz() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('\n✅ Connected to MongoDB\n')

  const filePath  = path.resolve(args.file)
  const workbook  = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const rows      = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: '', raw: false,
  })

  console.log(`📄 File    : ${args.file}`)
  console.log(`📋 Sheet   : ${sheetName} (${rows.length} rows)`)
  console.log(`📝 Exam    : ${args.exam}`)
  console.log(`📝 Stream  : ${args.stream  || '(none)'}`)
  console.log(`📝 Subject : ${args.subject || '(none)'}`)
  console.log(`📝 Year    : ${args.year}`)
  console.log(`📝 Variant : ${args.variant || '(none)'}`)
  console.log(`📝 Marking : +${markingScheme.correct} correct | ${markingScheme.wrong} wrong | 0 unattempted`)
  console.log(`📝 Title   : ${args.title}\n`)

  // Normalize rows
  const normalizedRows = rows.map((row) => {
    const clean = {}
    Object.keys(row).forEach((k) => {
      clean[k.trim()] = String(row[k] || '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()
    })
    return clean
  })

  if (normalizedRows.length > 0) {
    console.log('📋 Columns:', Object.keys(normalizedRows[0]).join(' | '), '\n')
  }

  const questionDocs = []
  const errors       = []

  normalizedRows.forEach((row, i) => {
    const rowNum = i + 2
    const keys   = Object.keys(row)

    // ── Auto-detect column names ───────────────────────────────────
    const findCol = (patterns) => {
      const key = keys.find((k) =>
        patterns.some((p) =>
          k.toLowerCase() === p.toLowerCase() ||
          k.toLowerCase().replace(/[^a-z0-9]/g, '') === p.toLowerCase().replace(/[^a-z0-9]/g, '')
        )
      )
      return key ? cellStr(row, key) : ''
    }

    const qRaw    = findCol(['Question', 'question'])
    const opt1Raw = findCol(['Option_A', 'option_a', 'Option A', 'option a', 'option_1', 'option 1'])
    const opt2Raw = findCol(['Option_B', 'option_b', 'Option B', 'option b', 'option_2', 'option 2'])
    const opt3Raw = findCol(['Option_C', 'option_c', 'Option C', 'option c', 'option_3', 'option 3'])
    const opt4Raw = findCol(['Option_D', 'option_d', 'Option D', 'option d', 'option_4', 'option 4'])
    const correct = findCol(['correct answer', 'correct_answer', 'correct', 'answer', 'ans'])
    const explain = findCol(['Explanation', 'explanation', 'explain'])

    if (!qRaw)    { errors.push(`Row ${rowNum}: Empty question — skipped`);      return }
    if (!opt1Raw) { errors.push(`Row ${rowNum}: Empty option A/1 — skipped`);    return }
    if (!opt2Raw) { errors.push(`Row ${rowNum}: Empty option B/2 — skipped`);    return }
    if (!opt3Raw) { errors.push(`Row ${rowNum}: Empty option C/3 — skipped`);    return }
    if (!opt4Raw) { errors.push(`Row ${rowNum}: Empty option D/4 — skipped`);    return }
    if (!correct) { errors.push(`Row ${rowNum}: Empty correct answer — skipped`); return }

    // Parse question
    let questionText     = ''
    let questionImageUrl = ''
    const qLines = qRaw.split('\n').map((l) => l.trim()).filter(Boolean)
    qLines.forEach((line) => {
      if (isImageUrl(line)) questionImageUrl = line
      else questionText = questionText ? `${questionText}\n${line}` : line
    })

    // Parse options
    const opt1 = buildOption(opt1Raw)
    const opt2 = buildOption(opt2Raw)
    const opt3 = buildOption(opt3Raw)
    const opt4 = buildOption(opt4Raw)

    // Handle DROP (grace) questions
    const isGrace = correct.toString().trim().toUpperCase() === 'DROP'

    let correctOptionIndex = null
    if (!isGrace) {
      try {
        correctOptionIndex = findCorrectIndex(
          correct,
          [opt1Raw, opt2Raw, opt3Raw, opt4Raw]
        )
      } catch (e) {
        errors.push(`Row ${rowNum}: ${e.message} — skipped`)
        return
      }
    } else {
      console.log(`   🎁 Row ${rowNum}: Grace question (DROP)`)
    }

    // Build tags
    const tags = [args.exam]
    if (args.stream)  tags.push(args.stream)
    if (args.subject) tags.push(args.subject)
    if (args.variant) tags.push(args.variant)
    tags.push(String(args.year))
    if (isGrace) tags.push('grace')

    questionDocs.push({
      questionText,
      questionImageUrl,
      options:            [opt1, opt2, opt3, opt4],
      correctOptionIndex,
      isGrace,
      explanation:        explain || (isGrace
        ? 'This question was dropped. Full marks awarded to all candidates.'
        : ''),
      tags,
    })
  })

  // Report skipped rows
  if (errors.length) {
    console.warn(`⚠️  Skipped ${errors.length} rows:`)
    errors.forEach((e) => console.warn(`   ${e}`))
    console.log('')
  }

  if (!questionDocs.length) {
    console.error('❌ No valid questions found. Aborting.')
    await mongoose.disconnect()
    process.exit(1)
  }

  console.log(`✅ ${questionDocs.length} valid questions ready\n`)

  // Check duplicate title
  const existing = await Quiz.findOne({ title: args.title })
  if (existing) {
    console.error(`❌ Quiz titled "${args.title}" already exists (ID: ${existing._id})`)
    console.error(`   Delete it first: node scripts/cleanup.js --deleteTitle="${args.title}"`)
    await mongoose.disconnect()
    process.exit(1)
  }

  // Insert questions
  console.log('⏳ Inserting questions...')
  const inserted = await Question.insertMany(questionDocs, { ordered: true })
  console.log(`✅ Inserted ${inserted.length} questions\n`)

  // Create quiz
  const quiz = await Quiz.create({
    title:         args.title,
    exam:          args.exam,
    stream:        args.stream  || '',
    subject:       args.subject || '',
    year:          parseInt(args.year),
    variant:       args.variant || '',
    description:   args.title,
    markingScheme,
    questions:     inserted.map((q) => q._id),
    timeLimitMinutes: 0,
    isPublished:   true,
  })

  console.log('🎉 Quiz created successfully!')
  console.log(`   Title    : ${quiz.title}`)
  console.log(`   Exam     : ${quiz.exam}`)
  console.log(`   Subject  : ${quiz.subject || '(none)'}`)
  console.log(`   Year     : ${quiz.year}`)
  console.log(`   Variant  : ${quiz.variant || '(none)'}`)
  console.log(`   Marking  : +${quiz.markingScheme.correct} / ${quiz.markingScheme.wrong}`)
  console.log(`   Quiz ID  : ${quiz._id}`)
  console.log(`   Questions: ${quiz.questions.length}\n`)

  await mongoose.disconnect()
  console.log('👋 Disconnected. Done!\n')
}

importQuiz().catch(async (err) => {
  console.error('\n❌ Import failed:', err.message)
  await mongoose.disconnect()
  process.exit(1)
})