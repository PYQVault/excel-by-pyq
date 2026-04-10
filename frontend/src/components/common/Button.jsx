import clsx from 'clsx'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900'

  const variants = {
    primary:
      'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400 shadow-sm hover:shadow-md',

    secondary:
      // ← Key fix: explicit text colors for both modes
      'bg-blue-50 hover:bg-blue-100 text-blue-700 focus:ring-blue-300 ' +
      'dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 ' +
      'border border-blue-100 dark:border-slate-600',

    danger:
      'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',

    ghost:
      // ← Key fix: explicit text for dark mode
      'bg-transparent hover:bg-slate-100 text-slate-600 ' +
      'dark:hover:bg-slate-700 dark:text-slate-300 ' +
      'focus:ring-slate-300',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  }

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button