import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Send, LayoutGrid, Flag, Eraser, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import api from '@/api/axios'
import Loader from '@/components/common/Loader'
import Button from '@/components/common/Button'
import QuestionText from '@/components/quiz/QuestionText'
import OptionCard from '@/components/quiz/OptionCard'
import MockPalette from '@/components/quiz/MockPalette'

const pad = (n) => String(n).padStart(2, '0')

const formatTime = (ms) => {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

const warnLabel = (t) =>
  t >= 60 ? `${Math.round(t / 60)} minute${t >= 120 ? 's' : ''} remaining` : `${t} seconds remaining`

// ── Submit confirmation ────────────────────────────────────────────────────
const SubmitModal = ({ answered, unanswered, marked, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 to-indigo-600" />
      <div className="p-6">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-indigo-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Submit Exam?</h2>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl py-3">
            <p className="text-xl font-black text-green-600 dark:text-green-400">{answered}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Answered</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl py-3">
            <p className="text-xl font-black text-slate-600 dark:text-slate-300">{unanswered}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Unanswered</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl py-3">
            <p className="text-xl font-black text-purple-600 dark:text-purple-400">{marked}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">For review</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Submitting will <b>end your attempt</b>. You will not be able to change your answers afterwards.
        </p>

        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" onClick={onConfirm} loading={loading}>
            Submit Exam
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={loading}>
            Back to Exam
          </Button>
        </div>
      </div>
    </div>
  </div>
)

// ── Main page ──────────────────────────────────────────────────────────────
const MockExamPage = () => {
  const { attemptId } = useParams()
  const navigate      = useNavigate()

  const [data, setData]                 = useState(null)
  const [loading, setLoading]           = useState(true)
  const [answers, setAnswers]           = useState({})
  const [marked, setMarked]             = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remainingMs, setRemainingMs]   = useState(null)
  const [showPalette, setShowPalette]   = useState(false)
  const [showSubmit, setShowSubmit]     = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [timeUp, setTimeUp]             = useState(false)
  const [saveState, setSaveState]       = useState('saved')   // saved | saving | error

  // Refs = source of truth for logic that runs in timers/async (no stale closures)
  const answersRef     = useRef({})
  const markedRef      = useRef([])
  const indexRef       = useRef(0)
  const questionsRef   = useRef([])
  const dirtyRef       = useRef({})       // { qid: 0-3 | null } not yet saved
  const markDirtyRef   = useRef(false)
  const posDirtyRef    = useRef(false)
  const flushTimerRef  = useRef(null)
  const flushingRef    = useRef(false)
  const lockedRef      = useRef(false)    // true once submit starts → no more edits
  const submitLockRef  = useRef(false)    // prevents duplicate submit calls
  const autoFiredRef   = useRef(false)
  const offsetRef      = useRef(0)        // serverTime - deviceTime (ms)
  const deadlineRef    = useRef(0)
  const warnedRef      = useRef(new Set())
  const flushRef       = useRef(null)
  const submitRef      = useRef(null)

  // ── Clock sync: corrects a wrong device clock using the server's time ───
  const syncClock = (serverISO, t0, t1) => {
    const serverMs = new Date(serverISO).getTime()
    if (Number.isNaN(serverMs)) return
    offsetRef.current = serverMs - (t0 + (t1 - t0) / 2)
  }

  const goToResults = () => {
    lockedRef.current = true
    navigate(`/results/${attemptId}`, { replace: true })
  }

  // ── Load attempt ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const t0 = Date.now()
        const { data: res } = await api.get(`/mock/attempts/${attemptId}`)
        const t1 = Date.now()
        const d  = res.data
        if (cancelled) return

        if (d.finalized) {
          navigate(`/results/${attemptId}`, { replace: true })
          return
        }

        syncClock(d.serverNow, t0, t1)
        deadlineRef.current  = new Date(d.deadlineAt).getTime()
        questionsRef.current = d.questions
        answersRef.current   = d.answers || {}
        markedRef.current    = d.markedForReview || []
        indexRef.current     = Math.min(d.currentQuestionIndex || 0, d.questions.length - 1)

        // Warning thresholds already passed at load time are not re-announced
        const remainingS = (deadlineRef.current - (Date.now() + offsetRef.current)) / 1000
        ;(d.warningThresholdsSeconds || []).forEach((t) => {
          if (remainingS <= t) warnedRef.current.add(t)
        })

        setAnswers(answersRef.current)
        setMarked(markedRef.current)
        setCurrentIndex(indexRef.current)
        setData(d)
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || 'Could not load the exam')
          navigate('/dashboard', { replace: true })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [attemptId])

  // ── Countdown (always recalculated from the server deadline) ────────────
  useEffect(() => {
    if (!data) return

    const tick = () => {
      const remaining = Math.max(0, deadlineRef.current - (Date.now() + offsetRef.current))
      setRemainingMs(remaining)

      const s = remaining / 1000
      ;(data.warningThresholdsSeconds || []).forEach((t) => {
        if (s <= t && s > 0 && !warnedRef.current.has(t)) {
          warnedRef.current.add(t)
          toast(warnLabel(t), { icon: '⏰', duration: 5000 })
        }
      })

      if (remaining <= 0 && !autoFiredRef.current) {
        autoFiredRef.current = true
        setTimeUp(true)
        submitRef.current?.(true)
      }
    }

    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [data])

  // ── Batched saving ──────────────────────────────────────────────────────
  const hasDirty = () =>
    Object.keys(dirtyRef.current).length > 0 || markDirtyRef.current || posDirtyRef.current

  const scheduleFlush = (delay = 2000) => {
    clearTimeout(flushTimerRef.current)
    flushTimerRef.current = setTimeout(() => flushRef.current?.(), delay)
  }

  const flush = async () => {
    clearTimeout(flushTimerRef.current)
    if (lockedRef.current || flushingRef.current || !hasDirty()) return

    const answersSnap = dirtyRef.current
    const hadMarks    = markDirtyRef.current
    const hadPos      = posDirtyRef.current

    const batch = {}
    if (Object.keys(answersSnap).length) batch.answers = answersSnap
    if (hadMarks) batch.markedForReview = markedRef.current
    if (hadPos)   batch.currentQuestionIndex = indexRef.current

    dirtyRef.current = {}
    markDirtyRef.current = false
    posDirtyRef.current = false
    flushingRef.current = true
    setSaveState('saving')

    let nextDelay = 1500
    try {
      const t0 = Date.now()
      const { data: res } = await api.put(`/mock/attempts/${attemptId}/answers`, batch)
      syncClock(res.data.savedAt, t0, Date.now())
      setSaveState(hasDirty() ? 'saving' : 'saved')
    } catch (err) {
      const code   = err.response?.data?.code
      const status = err.response?.status

      if (code === 'ATTEMPT_EXPIRED' || code === 'ATTEMPT_FINALIZED') {
        flushingRef.current = false
        goToResults()
        return
      }

      const retryable = !status || status >= 500 || status === 429
      if (retryable) {
        // Put the changes back; newer edits to the same question win
        dirtyRef.current = { ...answersSnap, ...dirtyRef.current }
        if (hadMarks) markDirtyRef.current = true
        if (hadPos)   posDirtyRef.current = true
        nextDelay = 5000
      }
      setSaveState('error')
    }

    flushingRef.current = false
    if (hasDirty() && !lockedRef.current) scheduleFlush(nextDelay)
  }
  flushRef.current = flush

  // Save when the tab is hidden or the page is left
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushRef.current?.() }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      clearTimeout(flushTimerRef.current)
      flushRef.current?.()
    }
  }, [])

  // Warn before closing the tab mid-exam
  useEffect(() => {
    const handler = (e) => {
      if (lockedRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ── Interactions ────────────────────────────────────────────────────────
  const currentQid = () => questionsRef.current[indexRef.current]._id

  const selectOption = (idx) => {
    if (lockedRef.current) return
    const qid  = currentQid()
    const next = { ...answersRef.current, [qid]: idx }
    answersRef.current = next
    setAnswers(next)
    dirtyRef.current[qid] = idx
    setSaveState('saving')
    scheduleFlush()
  }

  const clearAnswer = () => {
    if (lockedRef.current) return
    const qid = currentQid()
    if (answersRef.current[qid] === undefined) return
    const next = { ...answersRef.current }
    delete next[qid]
    answersRef.current = next
    setAnswers(next)
    dirtyRef.current[qid] = null
    setSaveState('saving')
    scheduleFlush()
  }

  const toggleMark = () => {
    if (lockedRef.current) return
    const qid  = currentQid()
    const next = markedRef.current.includes(qid)
      ? markedRef.current.filter((id) => id !== qid)
      : [...markedRef.current, qid]
    markedRef.current = next
    setMarked(next)
    markDirtyRef.current = true
    setSaveState('saving')
    scheduleFlush()
  }

  const goTo = (i) => {
    if (i < 0 || i >= questionsRef.current.length) return
    indexRef.current = i
    setCurrentIndex(i)
    posDirtyRef.current = true
    setShowPalette(false)
    scheduleFlush()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Submit (manual or automatic) ────────────────────────────────────────
  const submitExam = async (auto = false) => {
    if (submitLockRef.current) return          // never two submits at once
    submitLockRef.current = true
    lockedRef.current = true                   // freeze edits
    clearTimeout(flushTimerRef.current)
    setShowSubmit(false)
    setSubmitting(true)

    // Let an in-flight save finish so it can't land after our final state
    for (let i = 0; i < 60 && flushingRef.current; i++) {
      await new Promise((r) => setTimeout(r, 50))
    }

    // Full latest state → submit is correct even if earlier saves failed
    const fullAnswers = {}
    questionsRef.current.forEach((q) => {
      fullAnswers[q._id] = answersRef.current[q._id] ?? null
    })

    try {
      await api.post(`/mock/attempts/${attemptId}/submit`, {
        answers:         fullAnswers,
        markedForReview: markedRef.current,
      })
      navigate(`/results/${attemptId}`, { replace: true })
    } catch (err) {
      submitLockRef.current = false
      if (auto) {
        // Time is up: keep retrying. The server also finalizes at the deadline by itself.
        setTimeout(() => submitRef.current?.(true), 3000)
      } else {
        lockedRef.current = false
        setSubmitting(false)
        toast.error(err.response?.data?.message || 'Could not submit. Check your connection and try again.')
      }
    }
  }
  submitRef.current = submitExam

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) return <Loader text="Loading your exam..." />
  if (!data)   return null

  const questions     = data.questions
  const q             = questions[currentIndex]
  const selected      = answers[q._id]
  const isMarked      = marked.includes(q._id)
  const answeredCount = Object.keys(answers).length
  const unanswered    = questions.length - answeredCount
  const inputsLocked  = submitting || timeUp
  const lastQuestion  = currentIndex === questions.length - 1

  const urgent  = remainingMs !== null && remainingMs <= 60 * 1000
  const warning = remainingMs !== null && remainingMs <= 5 * 60 * 1000

  const subtitle = [data.subject, data.year, data.variant].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      {/* Top bar (no site navigation during the exam) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 dark:text-white truncate text-sm sm:text-base">{data.title}</h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
              {data.markingScheme && ` · +${data.markingScheme.correct}/${data.markingScheme.wrong}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={clsx(
              'hidden sm:block text-xs',
              saveState === 'error' ? 'text-red-500' : 'text-slate-400',
            )}>
              {saveState === 'saved' && 'Saved'}
              {saveState === 'saving' && 'Saving…'}
              {saveState === 'error' && 'Offline, retrying…'}
            </span>

            <div className={clsx(
              'font-mono tabular-nums font-bold text-sm sm:text-base px-3 py-1.5 rounded-xl border',
              urgent
                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 animate-pulse'
                : warning
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
            )}>
              {remainingMs === null ? '--:--' : formatTime(remainingMs)}
            </div>

            <button
              onClick={() => setShowPalette(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
            >
              <LayoutGrid size={15} className="text-slate-600 dark:text-slate-300" />
            </button>

            <Button variant="primary" size="sm" disabled={inputsLocked} onClick={() => setShowSubmit(true)}>
              <Send size={13} />
              <span className="hidden sm:inline text-xs">Submit</span>
            </Button>
          </div>
        </div>
      </header>

      {showSubmit && (
        <SubmitModal
          answered={answeredCount}
          unanswered={unanswered}
          marked={marked.length}
          loading={submitting}
          onConfirm={() => submitExam(false)}
          onCancel={() => setShowSubmit(false)}
        />
      )}

      {timeUp && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center max-w-sm">
            <div className="text-4xl mb-3">⏰</div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Time's up!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Submitting your exam…</p>
          </div>
        </div>
      )}

      {showPalette && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowPalette(false)} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">

          {/* Question area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                {isMarked && (
                  <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                    <Flag size={12} /> For review
                  </span>
                )}
              </div>

              <div className="px-6 py-6">
                {q.questionImageUrl && (
                  <div className="mb-5 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <img
                      src={q.questionImageUrl}
                      alt={`Question ${currentIndex + 1}`}
                      className="w-full max-h-72 object-contain p-2"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                )}

                {q.questionText && (
                  <div className="mb-6">
                    <QuestionText text={q.questionText} />
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {q.options?.map((opt, i) => (
                    <OptionCard
                      key={i}
                      option={opt}
                      index={i}
                      isSelected={selected === i}
                      isCorrect={false}
                      isWrong={false}
                      isRevealed={false}
                      isPending={false}
                      onClick={selectOption}
                      disabled={inputsLocked}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  <Button variant="secondary" size="sm" onClick={toggleMark} disabled={inputsLocked}>
                    <Flag size={14} /> {isMarked ? 'Unmark review' : 'Mark for review'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAnswer} disabled={inputsLocked || selected === undefined}>
                    <Eraser size={14} /> Clear response
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4 sm:mt-5 gap-2">
              <Button variant="secondary" size="md" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <span className="sm:hidden text-xs font-semibold text-slate-500 dark:text-slate-400">
                {currentIndex + 1} / {questions.length}
              </span>

              {lastQuestion ? (
                <Button variant="primary" size="md" disabled={inputsLocked} onClick={() => setShowSubmit(true)}>
                  <span>Submit</span>
                  <Send size={14} />
                </Button>
              ) : (
                <Button variant="secondary" size="md" onClick={() => goTo(currentIndex + 1)}>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop palette */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <MockPalette
                questions={questions}
                answers={answers}
                marked={marked}
                currentIndex={currentIndex}
                onJump={goTo}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile palette drawer */}
      <div className={clsx(
        'fixed top-0 right-0 h-full w-72 z-50 transform transition-transform duration-300 bg-white dark:bg-slate-800 shadow-2xl lg:hidden',
        showPalette ? 'translate-x-0' : 'translate-x-full',
      )}>
        <div className="h-full overflow-y-auto p-4 pt-6">
          <MockPalette
            questions={questions}
            answers={answers}
            marked={marked}
            currentIndex={currentIndex}
            onJump={goTo}
            onClose={() => setShowPalette(false)}
            isMobile
          />
        </div>
      </div>
    </div>
  )
}

export default MockExamPage