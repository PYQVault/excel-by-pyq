// ── Single place to enable mock mode for an exam ──────────────────────────
// Add 'CUET_UG' or 'FSL_PSC' here later. No other backend change needed.
const MOCK_ENABLED_EXAMS = ['UGC_NET']

// Warn at these remaining-seconds marks, but only if the exam is long enough
// for the warning to be meaningful (duration >= threshold * 4).
const WARNING_THRESHOLDS_SECONDS = [300, 60]

const isMockEnabled = (exam) => MOCK_ENABLED_EXAMS.includes(exam)

const warningsFor = (durationSeconds) =>
  WARNING_THRESHOLDS_SECONDS.filter((t) => durationSeconds >= t * 4)

module.exports = { MOCK_ENABLED_EXAMS, isMockEnabled, warningsFor }