require('dotenv').config()
const mongoose = require('mongoose')
const Quiz     = require('../models/Quiz')

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...r] = a.replace('--', '').split('=')
    return [k, r.length ? r.join('=') : true]
  })
)

// node scripts/setDuration.js --exam=UGC_NET --minutes=120 --dryRun
// node scripts/setDuration.js --exam=UGC_NET --minutes=120
// node scripts/setDuration.js --exam=UGC_NET --subject="Commerce" --minutes=180 --force
async function run() {
  if (!args.exam || !args.minutes) {
    console.error('Usage: --exam=UGC_NET --minutes=120 [--subject="..."] [--force] [--dryRun]')
    process.exit(1)
  }
  await mongoose.connect(process.env.MONGO_URI)

  const filter = { exam: args.exam }
  if (args.subject) filter.subject = args.subject
  if (!args.force)  filter.$or = [{ timeLimitMinutes: 0 }, { timeLimitMinutes: { $exists: false } }]

  const quizzes = await Quiz.find(filter).select('title timeLimitMinutes').lean()
  console.log(`\n${quizzes.length} paper(s) match${args.force ? ' (--force: overwriting existing)' : ' (only those with no duration)'}:`)
  quizzes.forEach((q) => console.log(`  • ${q.title}  (currently ${q.timeLimitMinutes || 0} min)`))

  if (args.dryRun) { console.log('\nDry run — nothing changed.'); }
  else {
    const r = await Quiz.updateMany({ _id: { $in: quizzes.map((q) => q._id) } },
                                    { $set: { timeLimitMinutes: parseInt(args.minutes, 10) } })
    console.log(`\n✅ Updated ${r.modifiedCount} paper(s) to ${args.minutes} min`)
  }
  await mongoose.disconnect()
}
run().catch(async (e) => { console.error(e.message); await mongoose.disconnect(); process.exit(1) })