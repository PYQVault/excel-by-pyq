import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Trophy, CheckCircle2, XCircle, MinusCircle,
  RotateCcw, LayoutDashboard, ChevronDown, ChevronUp,
  Target, Clock, BookOpen, TrendingUp, Award, Lightbulb
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import Navbar from '@/components/common/Navbar'
import Loader from '@/components/common/Loader'
import Button from '@/components/common/Button'
import QuestionText from '@/components/quiz/QuestionText'
import clsx from 'clsx'

// ── Score Ring ─────────────────────────────────────────────────────────────
const ScoreRing = ({ percentage }) => {
  const radius      = 54
  const stroke      = 8
  const circumference = 2 * Math.PI * radius
  const offset      = circumference - (percentage / 100) * circumference

  const color =
    percentage >= 80 ? '#22c55e' :
    percentage >= 60 ? '#3b82f6' :
    percentage >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        {/* Background ring */}
        <circle
          cx="72" cy="72" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-100 dark:text-slate-700"
        />
        {/* Progress ring */}
        <circle
          cx="72" cy="72" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-in-out' }}
        />
      </svg>
      <div className="relative text-center">
        <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">
          {percentage}%
        </p>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">Score</p>
      </div>
    </div>
  )
}

// ── Stat Pill ──────────────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, color, bg }) => (
  <div className={`flex items-center gap-3 ${bg} rounded-2xl px-5 py-4`}>
    <div className={`w-10 h-10 bg-white/60 dark:bg-black/20 rounded-xl flex items-center justify-center shrink-0`}>
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  </div>
)

// ── Question Review Card ───────────────────────────────────────────────────
const ReviewCard = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false)
  const labels = ['A', 'B', 'C', 'D']

  const statusConfig = {
    correct:     { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700/50', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    wrong:       { icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-700/50',     badge: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' },
    unattempted: { icon: MinusCircle,  color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800',    border: 'border-slate-200 dark:border-slate-700',    badge: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
  }

  const status = !result.isAttempted ? 'unattempted' : result.isCorrect ? 'correct' : 'wrong'
  const cfg    = statusConfig[status]
  const Icon   = cfg.icon

  return (
    <div className={clsx(
      'rounded-2xl border-2 overflow-hidden transition-all duration-200',
      cfg.border,
      expanded ? 'shadow-md' : 'hover:shadow-sm'
    )}>
      {/* Question row — always visible */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className={clsx(
          'w-full text-left flex items-start gap-4 px-5 py-4',
          cfg.bg
        )}
      >
        {/* Number */}
        <div className={clsx(
          'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
          cfg.badge
        )}>
          {index + 1}
        </div>

        {/* Question text */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
  <QuestionText text={result.questionText} />
</div>
          {!expanded && (
            <p className={clsx('text-xs mt-1 font-medium', cfg.color)}>
              {status === 'correct'     && '✓ Correct'}
              {status === 'wrong'       && '✗ Wrong'}
              {status === 'unattempted' && '— Not Attempted'}
            </p>
          )}
        </div>

        {/* Status icon + expand */}
        <div className="flex items-center gap-2 shrink-0">
          <Icon size={18} className={cfg.color} />
          {expanded
            ? <ChevronUp size={15} className="text-slate-400" />
            : <ChevronDown size={15} className="text-slate-400" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-white dark:bg-slate-800 px-5 py-5">

          {/* Question image */}
          {result.questionImageUrl && (
            <img
              src={result.questionImageUrl}
              alt="Question"
              className="mb-4 max-h-48 rounded-xl object-contain border border-slate-100 dark:border-slate-700"
            />
          )}

          {/* Options */}
          <div className="flex flex-col gap-2 mb-5">
            {result.options.map((opt, i) => {
              const isCorrectOpt  = i === result.correctOptionIndex
              const isSelectedOpt = i === result.selectedOptionIndex
              const isWrongPick   = isSelectedOpt && !isCorrectOpt

              return (
                <div
                  key={i}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm transition-all',
                    isCorrectOpt  && 'border-green-400 bg-green-50 dark:bg-green-900/20',
                    isWrongPick   && 'border-red-400 bg-red-50 dark:bg-red-900/20',
                    !isCorrectOpt && !isWrongPick && 'border-slate-100 dark:border-slate-700 opacity-60'
                  )}
                >
                  {/* Label */}
                  <span className={clsx(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    isCorrectOpt  && 'bg-green-500 text-white',
                    isWrongPick   && 'bg-red-400 text-white',
                    !isCorrectOpt && !isWrongPick && 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                  )}>
                    {labels[i]}
                  </span>

                  <span className={clsx(
                    'flex-1 font-medium',
                    isCorrectOpt  && 'text-green-700 dark:text-green-300',
                    isWrongPick   && 'text-red-600 dark:text-red-300',
                    !isCorrectOpt && !isWrongPick && 'text-slate-400 dark:text-slate-500'
                  )}>
                    {opt.text}
                  </span>

                  {/* Tick / Cross */}
                  {isCorrectOpt && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                  {isWrongPick  && <XCircle      size={16} className="text-red-400 shrink-0" />}
                </div>
              )
            })}
          </div>

          {/* Explanation */}
          <div className={clsx(
            'rounded-2xl border-2 overflow-hidden',
            result.isCorrect
              ? 'border-green-200 dark:border-green-700/50'
              : 'border-amber-200 dark:border-amber-700/50'
          )}>
            <div className={clsx(
              'flex items-center gap-3 px-5 py-3',
              result.isCorrect
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-amber-50 dark:bg-amber-900/20'
            )}>
              <div className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                result.isCorrect
                  ? 'bg-green-100 dark:bg-green-800/50'
                  : 'bg-amber-100 dark:bg-amber-800/50'
              )}>
                <Lightbulb size={14} className={
                  result.isCorrect
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-500'
                } />
              </div>
              <div>
                <p className={clsx(
                  'text-xs font-bold uppercase tracking-wide',
                  result.isCorrect
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-amber-700 dark:text-amber-400'
                )}>
                  Explanation
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Correct answer:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {labels[result.correctOptionIndex]}. {result.options[result.correctOptionIndex]?.text}
                  </span>
                </p>
              </div>
            </div>
            <div className="px-5 py-4 bg-white dark:bg-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-7">
                {result.explanation || 'No explanation provided.'}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Performance message ────────────────────────────────────────────────────
const getPerformance = (pct) => {
  if (pct >= 90) return { emoji: '🏆', label: 'Outstanding!',     sub: 'You absolutely nailed it!',          color: 'text-yellow-500' }
  if (pct >= 80) return { emoji: '🌟', label: 'Excellent!',       sub: 'Great performance, keep it up!',     color: 'text-green-500'  }
  if (pct >= 60) return { emoji: '👍', label: 'Good Job!',        sub: 'Solid effort, review the misses.',   color: 'text-blue-500'   }
  if (pct >= 40) return { emoji: '📚', label: 'Keep Practicing!', sub: 'Review the answers below carefully.',color: 'text-amber-500'  }
  return           { emoji: '💪', label: 'Don\'t Give Up!',       sub: 'Go through each answer and retry.',  color: 'text-red-500'    }
}

// ── Main Results Page ──────────────────────────────────────────────────────
const ResultsPage = () => {
  const { attemptId } = useParams()
  const navigate      = useNavigate()
  const location      = useLocation()

  const [results, setResults]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all') // all | correct | wrong | unattempted
  const [animating, setAnimating] = useState(true)

  // ── Load results ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      // Use state passed from QuizPage if available (no extra API call)
      if (location.state?.results) {
        setResults(location.state.results)
        setLoading(false)
        return
      }
      // Otherwise fetch from backend
      try {
        const { data } = await api.get(`/attempts/${attemptId}/results`)
        setResults(data.data)
      } catch {
        toast.error('Could not load results')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [attemptId])

  // Animate ring after mount
  useEffect(() => {
    const t = setTimeout(() => setAnimating(false), 100)
    return () => clearTimeout(t)
  }, [])

  if (loading) return <Loader text="Loading your results..." />
  if (!results) return null

  const { score, totalQuestions, scorePercentage, timeTaken } = results
  const unattempted = results.results.filter((r) => !r.isAttempted).length
  const wrong       = results.results.filter((r) => r.isAttempted && !r.isCorrect).length
  const perf        = getPerformance(scorePercentage)

  // Format time
  const mins = Math.floor((timeTaken || 0) / 60)
  const secs = ((timeTaken || 0) % 60).toString().padStart(2, '0')
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  // Filtered questions
  const filtered = results.results.filter((r) => {
    if (filter === 'correct')     return r.isCorrect
    if (filter === 'wrong')       return r.isAttempted && !r.isCorrect
    if (filter === 'unattempted') return !r.isAttempted
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/95 transition-colors duration-300">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Score Card ───────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden mb-6">

          {/* Top gradient bar */}
          <div className={clsx(
            'h-2 w-full',
            scorePercentage >= 80 ? 'bg-linear-to-r from-green-400 to-emerald-500' :
            scorePercentage >= 60 ? 'bg-linear-to-r from-blue-400 to-blue-600'     :
            scorePercentage >= 40 ? 'bg-linear-to-r from-amber-400 to-orange-500'  :
                                    'bg-linear-to-r from-red-400 to-red-500'
          )} />

          <div className="p-5 sm:p-8">
  <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-10">

    {/* Score Ring — centered on mobile */}
    <div className="shrink-0 mx-auto sm:mx-0">
      {!animating && <ScoreRing percentage={scorePercentage} />}
    </div>

    {/* Performance */}
    <div className="flex-1 text-center sm:text-left">
      <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
        <span className="text-2xl sm:text-3xl">{perf.emoji}</span>
        <h1 className={clsx('text-xl sm:text-2xl font-black', perf.color)}>
          {perf.label}
        </h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 sm:mb-5">
        {perf.sub}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        You scored{' '}
        <span className="font-bold text-slate-800 dark:text-white">
          {score} out of {totalQuestions}
        </span>{' '}
        correctly.
      </p>

      {/* Action buttons — inside card on mobile */}
      <div className="flex gap-2 mt-5 sm:hidden justify-center">
        <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
          <LayoutDashboard size={14} /> Dashboard
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          <RotateCcw size={14} /> Retry
        </Button>
      </div>
    </div>

    {/* Action buttons — desktop only */}
    <div className="hidden sm:flex sm:flex-col gap-3 shrink-0">
      <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>
        <LayoutDashboard size={15} /> Dashboard
      </Button>
      <Button variant="secondary" size="md" onClick={() => navigate(-1)}>
        <RotateCcw size={15} /> Retry
      </Button>
    </div>
  </div>
</div>

{/* Stats — 2 cols on mobile */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 sm:px-8 pb-5 sm:pb-8">
  <StatPill icon={CheckCircle2} label="Correct" value={score}
    color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-900/20" />
  <StatPill icon={XCircle} label="Wrong" value={wrong}
    color="text-red-500 dark:text-red-400" bg="bg-red-50 dark:bg-red-900/20" />
  <StatPill icon={MinusCircle} label="Skipped" value={unattempted}
    color="text-slate-500 dark:text-slate-400" bg="bg-slate-100 dark:bg-slate-700/50" />
  <StatPill icon={Clock} label="Time" value={timeStr}
    color="text-blue-500 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
</div>
        </div>

        {/* ── Accuracy Bar ─────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
              <TrendingUp size={15} className="text-blue-500" />
              Answer Breakdown
            </h2>
            <span className="text-xs text-slate-400">
              {totalQuestions} total questions
            </span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden gap-px bg-slate-100 dark:bg-slate-700 mb-3">
            {score > 0 && (
              <div
                className="bg-green-400 rounded-l-full transition-all duration-1000"
                style={{ width: `${(score / totalQuestions) * 100}%` }}
              />
            )}
            {wrong > 0 && (
              <div
                className="bg-red-400 transition-all duration-1000"
                style={{ width: `${(wrong / totalQuestions) * 100}%` }}
              />
            )}
            {unattempted > 0 && (
              <div
                className="bg-slate-300 dark:bg-slate-600 rounded-r-full transition-all duration-1000"
                style={{ width: `${(unattempted / totalQuestions) * 100}%` }}
              />
            )}
          </div>

          <div className="flex items-center gap-5 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              Correct {Math.round((score / totalQuestions) * 100)}%
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              Wrong {Math.round((wrong / totalQuestions) * 100)}%
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              Skipped {Math.round((unattempted / totalQuestions) * 100)}%
            </span>
          </div>
        </div>

        {/* ── Question Review ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

          {/* Review header */}
         {/* Filter tabs — scrollable on mobile */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm sm:text-base">
    <BookOpen size={16} className="text-blue-500" />
    Question Review
    <span className="text-xs font-normal text-slate-400">
      ({filtered.length} shown)
    </span>
  </h2>

  {/* Scrollable filter row on mobile */}
  <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-1 scrollbar-hide">
    {[
      { key: 'all',         label: `All (${totalQuestions})` },
      { key: 'correct',     label: `✓ Correct (${score})` },
      { key: 'wrong',       label: `✗ Wrong (${wrong})` },
      { key: 'unattempted', label: `— Skipped (${unattempted})` },
    ].map((tab) => (
      <button
        key={tab.key}
        onClick={() => setFilter(tab.key)}
        className={clsx(
          'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0',
          filter === tab.key
            ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
</div>

          {/* Review list */}
          <div className="p-4 sm:p-6 flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm">No questions in this category</p>
              </div>
            ) : (
              filtered.map((result, i) => (
                <ReviewCard
                  key={result.questionNumber}
                  result={result}
                  index={result.questionNumber - 1}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default ResultsPage