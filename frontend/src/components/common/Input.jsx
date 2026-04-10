import clsx from 'clsx'

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-200',
          'bg-white dark:bg-slate-800',
          'text-slate-800 dark:text-slate-100',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
          error
            ? 'border-red-400 focus:ring-red-300'
            : 'border-slate-200 dark:border-slate-700',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default Input