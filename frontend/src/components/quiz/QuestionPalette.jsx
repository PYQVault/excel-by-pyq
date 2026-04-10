import { getPaletteColor } from '@/utils/helpers'
import { X } from 'lucide-react'

const QuestionPalette = ({
  questions,
  answers,
  currentIndex,
  onJump,
  onClose,
  isMobile = false,
}) => {
  const getStatus = (index) => {
    const q = questions[index]
    if (!q) return 'unvisited'
    if (index === currentIndex) return 'current'
    const ans = answers[q._id]
    if (ans !== undefined && ans !== null) {
      return ans.isCorrect ? 'answered-correct' : 'answered-wrong'
    }
    return 'unvisited'
  }

  const answeredCount   = Object.keys(answers).length
  const correctCount    = Object.values(answers).filter((a) => a?.isCorrect).length
  const wrongCount      = answeredCount - correctCount
  const unansweredCount = questions.length - answeredCount

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">
          Question Palette
        </h3>
        {isMobile && (
          <button onClick={onClose}>
            <X size={18} className="text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
          {[
            { color: 'bg-green-400',  label: 'Correct',     count: correctCount },
            { color: 'bg-red-400',    label: 'Wrong',       count: wrongCount },
            { color: 'bg-blue-500',   label: 'Current',     count: 1 },
            { color: 'bg-slate-300 dark:bg-slate-600', label: 'Not Visited', count: unansweredCount },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm shrink-0 ${item.color}`} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {item.label}{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  ({item.count})
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, index) => {
            const status = getStatus(index)
            return (
              <button
                key={q._id}
                onClick={() => onJump(index)}
                className={`
                  w-full aspect-square rounded-lg text-xs font-bold
                  border-2 transition-all duration-200
                  hover:scale-110 hover:shadow-md
                  ${getPaletteColor(status)}
                `}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pb-4">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-500 dark:text-slate-400">Progress</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((answeredCount / questions.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionPalette