import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Timer, CheckCircle2, ChevronLeft, PlayCircle, AlertTriangle } from 'lucide-react'
import api from '@/api/axios'
import Navbar from '@/components/common/Navbar'
import Loader from '@/components/common/Loader'
import Button from '@/components/common/Button'
import QuizPage from '@/pages/QuizPage'

const Feature = ({ children }) => (
  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
    <CheckCircle2 size={15} className="text-green-500 shrink-0 mt-0.5" />
    <span>{children}</span>
  </li>
)

const QuizEntryPage = () => {
  const { quizId } = useParams()
  const navigate   = useNavigate()
  const location   = useLocation()

  // Dashboard "Continue" passes mode:'practice' → skip the selector entirely
  const forcePractice = location.state?.mode === 'practice'

  const [cfg, setCfg]           = useState(null)
  const [checking, setChecking] = useState(!forcePractice)

  useEffect(() => {
    if (forcePractice) return
    let cancelled = false
    const check = async () => {
      try {
        const { data } = await api.get(`/mock/quiz/${quizId}/config`)
        if (!cancelled) setCfg(data.data)
      } catch {
        // Any failure → safest fallback is the normal practice quiz
        if (!cancelled) setCfg({ mockEnabled: false })
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [quizId, forcePractice])

  if (forcePractice)      return <QuizPage />
  if (checking)           return <Loader text="Loading..." />
  if (!cfg?.mockEnabled)  return <QuizPage />

  const startPractice = () => {
    // Same URL, now flagged as practice. Keeps `fresh` from a dashboard restart.
    navigate(location.pathname, {
      replace: true,
      state:   { ...(location.state || {}), mode: 'practice' },
    })
  }

  const subtitle = [cfg.subject, cfg.year, cfg.variant].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-colors shadow-sm"
          >
            <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate">{cfg.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {subtitle} · Choose how you want to attempt this paper
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Practice */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <BookOpen size={20} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Practice Mode</h2>
            <p className="text-sm text-blue-500 font-medium mb-4">Learn at Your Own Pace</p>
            <ul className="space-y-2 mb-6 flex-1">
              <Feature>No timer, no time limit</Feature>
              <Feature>Instant correct / incorrect feedback</Feature>
              <Feature>Explanation after every answer</Feature>
              <Feature>Resume anytime</Feature>
            </ul>
            <Button variant="primary" className="w-full" onClick={startPractice}>
              <PlayCircle size={16} /> Start Practice
            </Button>
          </div>

          {/* Mock */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700 p-6 flex flex-col">
            <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
              <Timer size={20} className="text-indigo-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Mock Exam Mode</h2>
            <p className="text-sm text-indigo-500 font-medium mb-4">Test Yourself Under Exam Conditions</p>
            <ul className="space-y-2 mb-6 flex-1">
              <Feature>
                {cfg.durationMinutes
                  ? `${cfg.durationMinutes}-minute countdown timer`
                  : 'Countdown timer (duration not configured yet)'}
              </Feature>
              <Feature>Answers and explanations hidden until you submit</Feature>
              <Feature>Question palette and mark for review</Feature>
              <Feature>Auto-submits when time is up</Feature>
            </ul>

            {!cfg.canStart && (
              <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-3">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                {cfg.issues?.[0] || 'Mock exam is not available for this paper yet.'}
              </p>
            )}

            <Button
              variant="primary"
              className="w-full !bg-indigo-500 hover:!bg-indigo-600"
              disabled={!cfg.canStart}
              onClick={() => navigate(`/mock/${quizId}`)}
            >
              <Timer size={16} />
              {cfg.activeAttemptId ? 'Resume Mock Exam' : 'Start Mock Exam'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizEntryPage