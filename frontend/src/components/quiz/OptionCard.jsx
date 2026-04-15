import { CheckCircle2, XCircle, ImageOff } from 'lucide-react'
import clsx from 'clsx'

const OptionImage = ({ url, label }) => {
  if (!url) return null
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30">
      <img
        src={url}
        alt={`Option ${label}`}
        className="max-h-40 w-full object-contain p-2"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
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
  isPending,
  onClick,
  disabled,
}) => {
  const labels   = ['A', 'B', 'C', 'D']
  const hasText  = !!option?.text?.trim()
  const hasImage = !!option?.imageUrl?.trim()

  return (
    <button
      onClick={() => !disabled && onClick(index)}
      disabled={disabled}
      className={clsx(
        'w-full text-left flex items-start gap-4 px-5 py-4 rounded-2xl border-2',
        'transition-all duration-200 group',
        disabled && 'cursor-default',

        isPending && isSelected &&
          'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500',

        !isRevealed && !isSelected && !isPending &&
          'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer',

        !isRevealed && isSelected && !isPending &&
          'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500 shadow-sm',

        isRevealed && isCorrect &&
          'border-green-500 bg-green-50 dark:bg-green-900/20',

        isRevealed && isWrong &&
          'border-red-400 bg-red-50 dark:bg-red-900/20',

        isRevealed && !isCorrect && !isWrong && !isPending &&
          'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-50',
      )}
    >
      {/* Label bubble */}
      <div className={clsx(
        'w-8 h-8 rounded-xl flex items-center justify-center',
        'text-sm font-bold flex-shrink-0 mt-0.5',
        'transition-all duration-200',

        isPending && isSelected &&
          'bg-blue-500 text-white',

        !isRevealed && !isSelected && !isPending &&
          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/50 dark:group-hover:text-blue-300',

        !isRevealed && isSelected && !isPending &&
          'bg-blue-500 text-white',

        isRevealed && isCorrect &&
          'bg-green-500 text-white',

        isRevealed && isWrong &&
          'bg-red-400 text-white',

        isRevealed && !isCorrect && !isWrong && !isPending &&
          'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500',
      )}>
        {labels[index]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {hasText && (
          <span className={clsx(
            'text-sm font-medium leading-snug whitespace-pre-wrap',
            'transition-colors duration-200',

            isPending && isSelected &&
              'text-blue-700 dark:text-blue-300',

            !isRevealed && !isSelected && !isPending &&
              'text-slate-700 dark:text-slate-200',

            !isRevealed && isSelected && !isPending &&
              'text-blue-700 dark:text-blue-200',

            isRevealed && isCorrect &&
              'text-green-700 dark:text-green-300',

            isRevealed && isWrong &&
              'text-red-600 dark:text-red-300',

            isRevealed && !isCorrect && !isWrong && !isPending &&
              'text-slate-500 dark:text-slate-400',
          )}>
            {option.text}
          </span>
        )}

        {hasImage && (
          <OptionImage url={option.imageUrl} label={labels[index]} />
        )}

        {!hasText && !hasImage && (
          <span className="text-slate-400 dark:text-slate-500 text-sm italic">
            —
          </span>
        )}
      </div>

      {/* Result icons */}
      {isRevealed && isCorrect && (
        <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-1" />
      )}
      {isRevealed && isWrong && (
        <XCircle size={20} className="text-red-400 flex-shrink-0 mt-1" />
      )}
    </button>
  )
}

export default OptionCard