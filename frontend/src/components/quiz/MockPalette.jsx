import { X } from 'lucide-react'
import clsx from 'clsx'

const MockPalette = ({
  questions, answers, marked, currentIndex, onJump, onClose, isMobile = false,
}) => {
  const markedSet       = new Set(marked)
  const answeredCount   = questions.filter((q) => answers[q._id] !== undefined).length
  const markedCount     = questions.filter((q) => markedSet.has(q._id)).length
  const unansweredCount = questions.length - answeredCount

  const legend = [
    { color: 'bg-green-500',  label: 'Answered',       count: answeredCount },
    { color: 'bg-slate-200 dark:bg-slate-600', label: 'Not Answered', count: unansweredCount },
    { color: 'bg-purple-500', label: 'For Review',     count: markedCount },
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">Question Palette</h3>
        {isMobile && (
          <button onClick={onClose}>
            <X size={18} className="text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm shrink-0 ${item.color}`} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {item.label}{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">({item.count})</span>
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 max-h-[50vh] overflow-y-auto">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, index) => {
            const answered = answers[q._id] !== undefined
            const isMarked = markedSet.has(q._id)
            const current  = index === currentIndex

            return (
              <button
                key={q._id}
                onClick={() => onJump(index)}
                className={clsx(
                  'relative w-full aspect-square rounded-lg text-xs font-bold border-2 transition-all duration-150',
                  isMarked
                    ? 'bg-purple-500 text-white border-purple-600'
                    : answered
                      ? 'bg-green-500 text-white border-green-600'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
                  current && 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-800',
                )}
              >
                {index + 1}
                {isMarked && answered && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 border border-white" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-500 dark:text-slate-400">Answered</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((answeredCount / Math.max(1, questions.length)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MockPalette