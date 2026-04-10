import { Lightbulb, CheckCircle2, XCircle, ImageOff } from 'lucide-react'
import OptionCard from './OptionCard'
import QuestionText from './QuestionText'
import clsx from 'clsx'

// ── Image with fallback ───────────────────────────────────────────────────
const QuestionImage = ({ url, alt = 'Question image' }) => {
  if (!url) return null

  return (
    <div className="mb-5 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
      <img
        src={url}
        alt={alt}
        className="w-full max-h-72 object-contain p-2"
        onError={(e) => {
          // Show fallback if image fails to load
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
      {/* Fallback — hidden by default */}
      <div
        className="hidden flex-col items-center justify-center py-8 text-slate-400 gap-2"
        style={{ display: 'none' }}
      >
        <ImageOff size={28} />
        <p className="text-sm">Image could not be loaded</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline break-all px-4 text-center"
        >
          Open image in new tab
        </a>
      </div>
    </div>
  )
}

const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  correctIndex,
  isRevealed,
  onAnswer,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
          Question {questionNumber} of {totalQuestions}
        </span>
        {isRevealed && (
          <span className={clsx(
            'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full',
            selectedIndex === correctIndex
              ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
          )}>
            {selectedIndex === correctIndex
              ? <><CheckCircle2 size={13} /> Correct!</>
              : <><XCircle size={13} /> Incorrect</>
            }
          </span>
        )}
      </div>

      {/* Question body */}
      <div className="px-6 py-6">

        {/* Question image — renders if questionImageUrl exists */}
        <QuestionImage
          url={question.questionImageUrl}
          alt={`Question ${questionNumber}`}
        />

        {/* Question text — renders if questionText exists */}
        {question.questionText && (
          <div className="mb-6">
            <QuestionText text={question.questionText} />
          </div>
        )}

        {/* If neither text nor image — show placeholder */}
        {!question.questionText && !question.questionImageUrl && (
          <p className="text-slate-400 italic text-sm mb-6">
            No question text provided.
          </p>
        )}

        {/* Options */}
        <div className="flex flex-col gap-3">
          {question.options.map((option, index) => (
            <OptionCard
              key={index}
              option={option}
              index={index}
              isSelected={selectedIndex === index}
              isCorrect={isRevealed && index === correctIndex}
              isWrong={isRevealed && selectedIndex === index && index !== correctIndex}
              isRevealed={isRevealed}
              onClick={onAnswer}
              disabled={isRevealed}
            />
          ))}
        </div>
      </div>

      {/* Explanation */}
      {isRevealed && (
        <div className="mx-5 mb-6">
          <div className={clsx(
            'rounded-2xl border-2 overflow-hidden',
            selectedIndex === correctIndex
              ? 'border-green-200 dark:border-green-700/50'
              : 'border-amber-200 dark:border-amber-700/50'
          )}>
            <div className={clsx(
              'flex items-center gap-2.5 px-5 py-3',
              selectedIndex === correctIndex
                ? 'bg-green-50 dark:bg-green-900/30'
                : 'bg-amber-50 dark:bg-amber-900/30'
            )}>
              <div className={clsx(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                selectedIndex === correctIndex
                  ? 'bg-green-100 dark:bg-green-800/50'
                  : 'bg-amber-100 dark:bg-amber-800/50'
              )}>
                <Lightbulb size={16} className={
                  selectedIndex === correctIndex
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-500'
                } />
              </div>
              <div>
                <p className={clsx(
                  'text-sm font-bold uppercase tracking-wide',
                  selectedIndex === correctIndex
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-amber-700 dark:text-amber-400'
                )}>
                  Explanation
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Correct answer:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {['A','B','C','D'][correctIndex]}.{' '}
                    {question.options[correctIndex]?.text || '(see image above)'}
                  </span>
                </p>
              </div>
            </div>
            <div className="px-5 py-4 bg-white dark:bg-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-7">
                {question.explanation || 'No explanation provided.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionCard