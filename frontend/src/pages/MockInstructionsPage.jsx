import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import Navbar from '@/components/common/Navbar'
import Loader from '@/components/common/Loader'
import Button from '@/components/common/Button'

const Row = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
    <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-sm font-semibold text-slate-800 dark:text-white text-right">{value}</span>
  </div>
)

const MockInstructionsPage = () => {
  const { quizId } = useParams()
  const navigate   = useNavigate()

  const [cfg, setCfg]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/mock/quiz/${quizId}/config`)
        if (!data.data.mockEnabled) {
          toast('Mock exam is not available for this paper')
          navigate(`/quiz/${quizId}`, { replace: true, state: { mode: 'practice' } })
          return
        }
        setCfg(data.data)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load exam details')
        navigate('/dashboard', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId])

  const begin = async () => {
    setStarting(true)
    try {
      const { data } = await api.post(`/mock/quiz/${quizId}/start`)
      navigate(`/mock/attempt/${data.data.attemptId}`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start the exam')
      setStarting(false)
    }
  }

  if (loading) return <Loader text="Loading exam details..." />
  if (!cfg)    return null

  const s = cfg.markingScheme
  const paper = [cfg.subject, cfg.year, cfg.variant].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        <button
          onClick={() => navigate(`/quiz/${quizId}`, { replace: true })}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-500 mb-5 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-400 to-indigo-600" />
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Mock Exam Instructions</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Read carefully before you begin.</p>

            <div className="mb-6">
              <Row label="Examination"     value={cfg.exam?.replace(/_/g, ' ')} />
              <Row label="Paper"           value={paper || cfg.title} />
              <Row label="Duration"        value={cfg.durationMinutes ? `${cfg.durationMinutes} minutes` : 'Not configured'} />
              <Row label="Questions"       value={cfg.questionCount} />
              <Row label="Maximum marks"   value={cfg.maxMarks} />
              <Row label="Correct answer"  value={`+${s.correct} mark${s.correct !== 1 ? 's' : ''}`} />
              <Row
                label="Wrong answer"
                value={cfg.negativeMarking ? `${s.wrong} mark${Math.abs(s.wrong) !== 1 ? 's' : ''} deducted` : 'No negative marking'}
              />
              <Row
                label="Unanswered"
                value={s.unattempted === 0 ? '0 marks' : `${s.unattempted} marks`}
              />
            </div>

            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-6 list-disc pl-5">
              <li>Correct answers and explanations are <b>not shown</b> during the exam. They appear on the results page after you submit.</li>
              <li>The exam is <b>submitted automatically</b> when the timer reaches zero.</li>
              <li>The timer is controlled by our server. It keeps running if you refresh or close this page.</li>
              <li>You can move between questions, change or clear answers, and mark questions for review.</li>
              <li>A submitted attempt cannot be changed.</li>
            </ul>

            {cfg.activeAttemptId && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-3 mb-5 text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                You already have an exam in progress for this paper. Its timer is still running.
              </div>
            )}

            {!cfg.canStart && (
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-3 mb-5 text-sm text-red-600 dark:text-red-300">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                {cfg.issues.join(' ')}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full !bg-indigo-500 hover:!bg-indigo-600"
              disabled={!cfg.canStart}
              loading={starting}
              onClick={begin}
            >
              {cfg.activeAttemptId ? 'Resume Exam' : 'Begin Exam'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MockInstructionsPage