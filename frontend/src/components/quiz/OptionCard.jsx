import { CheckCircle2, XCircle, ImageOff } from 'lucide-react'
import clsx from 'clsx'

// ── Option image ───────────────────────────────────────────────────────────
const OptionImage = ({ url, label }) => {
  if (!url) return null
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
      <img
        src={url}
        alt={`Option ${label}`}
        className="max-h-32 w-full object-contain p-1.5"
        onError={(e) => {
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
      <div
        className="hidden items-center justify-center py-3 text-slate-400 gap-1.5 text-xs"
        style={{ display: 'none' }}
      >
        <ImageOff size={14} />
        <span>Image unavailable</span>
      </div>
    </div>
  )
}

const OptionCard = ({
  option,
  index,
  isSelected,
  isCorrect,
  isWrong,
  isRevealed,
  onClick,
  disabled,
}) => {
  const labels = ['A', 'B', 'C', 'D']

  // Determine if this option has content
  const hasText  = !!option.text
  const hasImage = !!option.imageUrl

  return (
    <button
      onClick={() => !disabled && onClick(index)}
      disabled={disabled}
      className={clsx(
        'w-full text-left flex items-start gap-4 px-5 py-4 rounded-2xl border-2',
        'transition-all duration-300 group',
        !isRevealed && !isSelected &&
          'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        !isRevealed && isSelected &&
          'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500 shadow-sm',
        isRevealed && isCorrect &&
          'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500',
        isRevealed && isWrong &&
          'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-400',
        isRevealed && !isCorrect && !isWrong &&
          'border-slate-100 dark:border-slate-700 opacity-50',
        disabled && 'cursor-default',
      )}
    >
      {/* Label bubble */}
      <div className={clsx(
        'w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 mt-0.5',
        !isRevealed && !isSelected && 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600',
        !isRevealed && isSelected  && 'bg-blue-500 text-white',
        isRevealed  && isCorrect   && 'bg-green-500 text-white',
        isRevealed  && isWrong     && 'bg-red-400 text-white',
        isRevealed  && !isCorrect  && !isWrong && 'bg-slate-100 dark:bg-slate-700 text-slate-400',
      )}>
        {labels[index]}
      </div>

      {/* Option content — text + optional image */}
      <div className="flex-1 min-w-0">
        {hasText && (
          <span className={clsx(
            'text-sm font-medium leading-snug whitespace-pre-wrap transition-colors duration-300',
            !isRevealed && !isSelected && 'text-slate-700 dark:text-slate-300',
            !isRevealed && isSelected  && 'text-blue-700 dark:text-blue-300',
            isRevealed  && isCorrect   && 'text-green-700 dark:text-green-300',
            isRevealed  && isWrong     && 'text-red-600 dark:text-red-300',
            isRevealed  && !isCorrect  && !isWrong && 'text-slate-400',
          )}>
            {option.text}
          </span>
        )}

        {/* Option image */}
        {hasImage && (
          <OptionImage url={option.imageUrl} label={labels[index]} />
        )}

        {/* Fallback if neither */}
        {!hasText && !hasImage && (
          <span className="text-slate-400 text-sm italic">—</span>
        )}
      </div>

      {/* Result icon */}
      {isRevealed && isCorrect && (
        <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-1" />
      )}
      {isRevealed && isWrong && (
        <XCircle size={20} className="text-red-400 shrink-0 mt-1" />
      )}
    </button>
  )
}

export default OptionCard