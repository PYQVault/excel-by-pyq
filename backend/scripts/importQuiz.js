/**
 * Usage examples:
 *
 * Regular subject:
 * node scripts/importQuiz.js \
 *   --file="CUET_PG_2022_Chemistry.xlsx" \
 *   --exam="CUET_PG" \
 *   --stream="Main Subject" \
 *   --subject="Chemistry" \
 *   --year=2022 \
 *   --title="CUET PG 2022 - Chemistry"
 *
 * General Aptitude (no subject):
 * node scripts/importQuiz.js \
 *   --file="CUET_PG_2022_General.xlsx" \
 *   --exam="CUET_PG" \
 *   --stream="General Aptitude" \
 *   --year=2022 \
 *   --title="CUET PG 2022 - General Aptitude"
 */

require("dotenv").config();
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");

const Question = require("../models/Question");
const Quiz = require("../models/Quiz");

// ── Parse CLI args ─────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace("--", "").split("=");
    return [key, rest.join("=")];
  }),
);

// subject is now OPTIONAL (General Aptitude papers don't have a subject)
const REQUIRED = ["file", "exam", "stream", "year", "title"];
const missing = REQUIRED.filter((k) => !args[k]);
if (missing.length) {
  console.error(`❌ Missing required args: ${missing.join(", ")}`);
  console.error(`\nUsage:`);
  console.error(
    `node scripts/importQuiz.js --file="file.xlsx" --exam="CUET_PG" --stream="General Aptitude" --year=2022 --title="CUET PG 2022 - General Aptitude"`,
  );
  console.error(
    `node scripts/importQuiz.js --file="file.xlsx" --exam="CUET_PG" --stream="Main Subject" --subject="Chemistry" --year=2022 --title="CUET PG 2022 - Chemistry"\n`,
  );
  process.exit(1);
}

const VALID_EXAMS = ["CUET_UG", "CUET_PG", "UGC_NET"];
if (!VALID_EXAMS.includes(args.exam)) {
  console.error(`❌ Invalid exam. Valid: ${VALID_EXAMS.join(", ")}`);
  process.exit(1);
}

// ── Detect image URL ───────────────────────────────────────────────────────
function isImageUrl(str) {
  if (!str) return false;
  const lower = str.toLowerCase().trim();
  return (
    (lower.startsWith("http://") || lower.startsWith("https://")) &&
    (lower.includes(".png") ||
      lower.includes(".jpg") ||
      lower.includes(".jpeg") ||
      lower.includes(".webp") ||
      lower.includes(".gif") ||
      lower.includes("cloudinary.com") ||
      lower.includes("imgur.com"))
  );
}

// ── Build option — auto detects text vs image ──────────────────────────────
function buildOption(val) {
  const trimmed = (val || '').trim()
  if (!trimmed) return { text: '', imageUrl: '' }

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  let textParts = []
  let imageUrl  = ''

  lines.forEach((line) => {
    if (isImageUrl(line)) {
      imageUrl = line
    } else {
      textParts.push(line)
    }
  })

  return {
    text:     textParts.join('\n'),
    imageUrl: imageUrl,
  }
}

// ── Map correct answer → index ─────────────────────────────────────────────
function parseCorrectIndex(raw) {
  if (!raw && raw !== 0) throw new Error("Correct answer is empty");
  const val = String(raw).trim().toUpperCase();
  const map = { 1: 0, A: 0, 2: 1, B: 1, 3: 2, C: 2, 4: 3, D: 3 };
  if (map[val] !== undefined) return map[val];
  throw new Error(`Cannot map "${raw}" to A/B/C/D or 1/2/3/4`);
}

// ── Match answer text to option index ─────────────────────────────────────
function findCorrectIndex(correctRaw, options) {
  if (!correctRaw && correctRaw !== 0)
    throw new Error("Correct answer is empty");

  const val = String(correctRaw).trim();

  // Direct letter/number
  try {
    return parseCorrectIndex(val);
  } catch {}

  // Text match
  const normalize = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  const normCorrect = normalize(val);

  // Exact match
  const exact = options.findIndex((o) => normalize(o) === normCorrect);
  if (exact !== -1) return exact;

  // Partial match
  const partial = options.findIndex(
    (o) =>
      normalize(o).includes(normCorrect) || normCorrect.includes(normalize(o)),
  );
  if (partial !== -1) {
    console.warn(
      `   ⚠️  Partial match: "${val}" → Option ${partial + 1}: "${options[partial]}"`,
    );
    return partial;
  }

  throw new Error(
    `Cannot match "${val}" to options:\n` +
      options.map((o, i) => `      ${i + 1}: "${o}"`).join("\n"),
  );
}

function cellStr(row, key) {
  const val = row[key] ?? row[key?.trim()] ?? "";
  return String(val).trim();
}

// ── Main ───────────────────────────────────────────────────────────────────
async function importQuiz() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  const filePath = path.resolve(args.file);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
  });

  console.log(`📄 Found ${rows.length} rows in "${sheetName}"`);

  // Normalize headers
  const normalizedRows = rows.map((row) => {
    const clean = {};
    Object.keys(row).forEach((k) => {
      clean[k.trim()] = String(row[k] || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();
    });
    return clean;
  });

  // Print detected columns
  if (normalizedRows.length > 0) {
    console.log("📋 Columns:", Object.keys(normalizedRows[0]).join(" | "));
    console.log("");
  }

  // ── Subject handling ─────────────────────────────────────────────────────
  // General Aptitude streams don't need a subject
  const isGeneralAptitude = args.stream === "General Aptitude" || !args.subject;
  const subject = args.subject || "";

  console.log(`📝 Exam    : ${args.exam}`);
  console.log(`📝 Stream  : ${args.stream}`);
  console.log(`📝 Subject : ${subject || "(none — General Aptitude)"}`);
  console.log(`📝 Year    : ${args.year}`);
  console.log("");

  const questionDocs = [];
  const errors = [];

  normalizedRows.forEach((row, i) => {
    const rowNum = i + 2;

    const qRaw = cellStr(row, "Question");
    const opt1Raw = cellStr(row, "Option_A");
    const opt2Raw = cellStr(row, "Option_B");
    const opt3Raw = cellStr(row, "Option_C");
    const opt4Raw = cellStr(row, "Option_D");
    const correct = cellStr(row, "correct answer");
    const explain = cellStr(row, "Explanation");  

    if (!qRaw) {
      errors.push(`Row ${rowNum}: Empty question — skipped`);
      return;
    }
    if (!opt1Raw || !opt2Raw || !opt3Raw || !opt4Raw) {
      errors.push(`Row ${rowNum}: Missing option(s) — skipped`);
      return;
    }
    if (!correct) {
      errors.push(`Row ${rowNum}: Empty correct answer — skipped`);
      return;
    }

    // ── Smart question parsing ───────────────────────────────────────────
    let questionText = "";
    let questionImageUrl = "";

    // Check if entire question is an image URL
    if (isImageUrl(qRaw)) {
      questionImageUrl = qRaw;
    } else {
      // Could be multiline with embedded URL
      const qLines = qRaw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const textLines = [];
      qLines.forEach((line) => {
        if (isImageUrl(line)) questionImageUrl = line;
        else textLines.push(line);
      });
      questionText = textLines.join("\n");
    }

    // ── Smart option parsing ─────────────────────────────────────────────
    const opt1 = buildOption(opt1Raw);
    const opt2 = buildOption(opt2Raw);
    const opt3 = buildOption(opt3Raw);
    const opt4 = buildOption(opt4Raw);

    // For text matching, use the text part of each option
    const optTexts = [opt1Raw, opt2Raw, opt3Raw, opt4Raw];

    let correctOptionIndex;
    try {
      correctOptionIndex = findCorrectIndex(correct, optTexts);
    } catch (e) {
      errors.push(`Row ${rowNum}: ${e.message} — skipped`);
      return;
    }

    const tags = [args.exam, args.stream];
    if (subject) tags.push(subject);
    tags.push(String(args.year));

    questionDocs.push({
      questionText,
      questionImageUrl,
      options: [opt1, opt2, opt3, opt4],
      correctOptionIndex,
      explanation: explain,
      tags,
    });
  });

  // Report errors
  if (errors.length) {
    console.warn(`⚠️  Skipped ${errors.length} rows:`);
    errors.forEach((e) => console.warn(`   ${e}`));
    console.log("");
  }

  if (!questionDocs.length) {
    console.error("❌ No valid questions found. Aborting.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`✅ ${questionDocs.length} valid questions ready\n`);

  // Check duplicate
  const existing = await Quiz.findOne({ title: args.title });
  if (existing) {
    console.error(
      `❌ Quiz "${args.title}" already exists (ID: ${existing._id})`,
    );
    console.error("   Delete it first or use a different --title");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Insert questions
  console.log("⏳ Inserting questions...");
  const inserted = await Question.insertMany(questionDocs, { ordered: true });
  console.log(`✅ Inserted ${inserted.length} questions\n`);

  // Create quiz
  const quiz = await Quiz.create({
    title: args.title,
    exam: args.exam,
    stream: args.stream,
    subject: subject, // empty string for General Aptitude
    year: parseInt(args.year),
    description: `${args.exam.replace(/_/g, " ")} ${args.year}${subject ? ` - ${subject}` : ` - ${args.stream}`}`,
    questions: inserted.map((q) => q._id),
    timeLimitMinutes: 0,
    isPublished: true,
  });

  console.log("🎉 Quiz created successfully!");
  console.log(`   Title    : ${quiz.title}`);
  console.log(`   Exam     : ${quiz.exam}`);
  console.log(`   Stream   : ${quiz.stream}`);
  console.log(`   Subject  : ${quiz.subject || "(none)"}`);
  console.log(`   Year     : ${quiz.year}`);
  console.log(`   Quiz ID  : ${quiz._id}`);
  console.log(`   Questions: ${quiz.questions.length}\n`);

  await mongoose.disconnect();
  console.log("👋 Disconnected");
}

importQuiz().catch(async (err) => {
  console.error("❌ Import failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
