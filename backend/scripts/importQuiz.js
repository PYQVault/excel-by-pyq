/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           Excel By PYQ — Quiz Import Script                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * USAGE EXAMPLES:
 *
 * Single paper per year:
 *   node scripts/importQuiz.js \
 *     --file="ACCOUNTANCY_2022.xlsx" \
 *     --exam="CUET_UG" \
 *     --stream="Domain Specific Subject" \
 *     --subject="Accountancy" \
 *     --year=2022 \
 *     --title="CUET UG 2022 - Accountancy"
 *
 * Multiple papers same year (A/B sets):
 *   node scripts/importQuiz.js \
 *     --file="ACCOUNTANCY_2024_A.xlsx" \
 *     --exam="CUET_UG" \
 *     --stream="Domain Specific Subject" \
 *     --subject="Accountancy" \
 *     --year=2024 \
 *     --variant="A" \
 *     --title="CUET UG 2024 - Accountancy (Set A)"
 *
 *   node scripts/importQuiz.js \
 *     --file="ACCOUNTANCY_2024_B.xlsx" \
 *     --exam="CUET_UG" \
 *     --stream="Domain Specific Subject" \
 *     --subject="Accountancy" \
 *     --year=2024 \
 *     --variant="B" \
 *     --title="CUET UG 2024 - Accountancy (Set B)"
 *
 * General Aptitude (no subject):
 *   node scripts/importQuiz.js \
 *     --file="GENERAL_APTITUDE_2023.xlsx" \
 *     --exam="CUET_PG" \
 *     --stream="General Aptitude" \
 *     --year=2023 \
 *     --title="CUET PG 2023 - General Aptitude Test"
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

// Required args (subject and variant are optional)
const REQUIRED = ['file', 'exam', 'stream', 'year', 'title']
const missing  = REQUIRED.filter((k) => !args[k])
if (missing.length) {
  console.error(`\n❌ Missing required args: ${missing.join(', ')}`)
  console.error(`\nUsage:`)
  console.error(`  node scripts/importQuiz.js \\`)
  console.error(`    --file="FILE.xlsx" \\`)
  console.error(`    --exam="CUET_UG" \\`)
  console.error(`    --stream="Domain Specific Subject" \\`)
  console.error(`    --subject="Accountancy" \\`)
  console.error(`    --year=2024 \\`)
  console.error(`    --variant="A" \\`)
  console.error(`    --title="CUET UG 2024 - Accountancy (Set A)"\n`)
  process.exit(1)
}

const VALID_EXAMS = ['CUET_UG', 'CUET_PG', 'UGC_NET']
if (!VALID_EXAMS.includes(args.exam)) {
  console.error(`❌ Invalid exam "${args.exam}". Valid: ${VALID_EXAMS.join(', ')}`)
  process.exit(1)
}

// ── Detect image URL ───────────────────────────────────────────────────────
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

// ── Build option — handles text, image, or both ───────────────────────────
function buildOption(val) {
  const trimmed = (val || '').trim()
  if (!trimmed) return { text: '', imageUrl: '' }

  const lines    = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  let textParts  = []
  let imageUrl   = ''

  lines.forEach((line) => {
    if (isImageUrl(line)) imageUrl = line
    else textParts.push(line)
  })

  return { text: textParts.join('\n'), imageUrl }
}

// ── Normalize text ────────────────────────────────────────────────────────
const normalize = (s) =>
  String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()

// ── Find correct option index ─────────────────────────────────────────────
function findCorrectIndex(correctRaw, options) {
  if (!correctRaw && correctRaw !== 0) throw new Error('Correct answer is empty')

  const val = String(correctRaw).trim()

  // Direct letter/number mapping
  const map = { '1': 0, 'A': 0, '2': 1, 'B': 1, '3': 2, 'C': 2, '4': 3, 'D': 3 }
  if (map[val.toUpperCase()] !== undefined) return map[val.toUpperCase()]

  // Text match — exact
  const normCorrect = normalize(val)
  const exact = options.findIndex((o) => normalize(o) === normCorrect)
  if (exact !== -1) return exact

  // Text match — partial
  const partial = options.findIndex(
    (o) => normalize(o).includes(normCorrect) || normCorrect.includes(normalize(o))
  )
  if (partial !== -1) {
    console.warn(`   ⚠️  Partial match: "${val}" → Option ${partial + 1}: "${options[partial]}"`)
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
    defval: '',
    raw:    false,
  })

  console.log(`📄 File    : ${args.file}`)
  console.log(`📋 Sheet   : ${sheetName} (${rows.length} rows)`)
  console.log(`📝 Exam    : ${args.exam}`)
  console.log(`📝 Stream  : ${args.stream}`)
  console.log(`📝 Subject : ${args.subject || '(none — General Aptitude)'}`)
  console.log(`📝 Year    : ${args.year}`)
  console.log(`📝 Variant : ${args.variant || '(none)'}`)
  console.log(`📝 Title   : ${args.title}\n`)

  // Normalize all headers and line endings
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

  // Print detected columns for debugging
  if (normalizedRows.length > 0) {
    console.log('📋 Columns:', Object.keys(normalizedRows[0]).join(' | '), '\n')
  }

  const questionDocs = []
  const errors       = []

  normalizedRows.forEach((row, i) => {
    const rowNum  = i + 2
    const qRaw    = cellStr(row, 'Question')
    const opt1Raw = cellStr(row, 'Option_A')
    const opt2Raw = cellStr(row, 'Option_B')
    const opt3Raw = cellStr(row, 'Option_C')
    const opt4Raw = cellStr(row, 'Option_D')
    const correct = cellStr(row, 'correct answer')
    const explain = cellStr(row, 'Explanation')

    // Validate
    if (!qRaw)    { errors.push(`Row ${rowNum}: Empty question — skipped`);    return }
    if (!opt1Raw) { errors.push(`Row ${rowNum}: Empty Option_A — skipped`);    return }
    if (!opt2Raw) { errors.push(`Row ${rowNum}: Empty Option_B — skipped`);    return }
    if (!opt3Raw) { errors.push(`Row ${rowNum}: Empty Option_C — skipped`);    return }
    if (!opt4Raw) { errors.push(`Row ${rowNum}: Empty Option_D — skipped`);    return }
    if (!correct) { errors.push(`Row ${rowNum}: Empty correct answer — skipped`); return }

    // Parse question (text or image)
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

    // Find correct index
    let correctOptionIndex
    try {
      correctOptionIndex = findCorrectIndex(correct, [opt1Raw, opt2Raw, opt3Raw, opt4Raw])
    } catch (e) {
      errors.push(`Row ${rowNum}: ${e.message} — skipped`)
      return
    }

    // Build tags
    const tags = [args.exam, args.stream]
    if (args.subject) tags.push(args.subject)
    if (args.variant) tags.push(args.variant)
    tags.push(String(args.year))

    questionDocs.push({
      questionText,
      questionImageUrl,
      options:            [opt1, opt2, opt3, opt4],
      correctOptionIndex,
      explanation:        explain,
      tags,
    })
  })

  // Report
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
    console.error(`❌ Quiz titled "${args.title}" already exists`)
    console.error(`   ID: ${existing._id}`)
    console.error(`   Delete it first or use a different --title\n`)
    await mongoose.disconnect()
    process.exit(1)
  }

  // Insert questions
  console.log('⏳ Inserting questions...')
  const inserted = await Question.insertMany(questionDocs, { ordered: true })
  console.log(`✅ Inserted ${inserted.length} questions\n`)

  // Create quiz
  const quiz = await Quiz.create({
    title:            args.title,
    exam:             args.exam,
    stream:           args.stream,
    subject:          args.subject   || '',
    year:             parseInt(args.year),
    variant:          args.variant   || '',
    description:      buildDescription(),
    questions:        inserted.map((q) => q._id),
    timeLimitMinutes: 0,
    isPublished:      true,
  })

  function buildDescription() {
    const parts = [args.exam.replace(/_/g, ' '), args.year]
    if (args.subject) parts.push(args.subject)
    if (args.variant) parts.push(`Set ${args.variant}`)
    return parts.join(' - ')
  }

  console.log('🎉 Quiz created successfully!')
  console.log(`   Title    : ${quiz.title}`)
  console.log(`   Exam     : ${quiz.exam}`)
  console.log(`   Stream   : ${quiz.stream}`)
  console.log(`   Subject  : ${quiz.subject || '(none)'}`)
  console.log(`   Year     : ${quiz.year}`)
  console.log(`   Variant  : ${quiz.variant || '(none)'}`)
  console.log(`   Quiz ID  : ${quiz._id}`)
  console.log(`   Questions: ${quiz.questions.length}\n`)

  await mongoose.disconnect()
  console.log('👋 Disconnected. Import complete!\n')
}

importQuiz().catch(async (err) => {
  console.error('\n❌ Import failed:', err.message)
  await mongoose.disconnect()
  process.exit(1)
})