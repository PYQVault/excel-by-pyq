const Loader = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900" />
      <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{text}</p>
  </div>
)

export default Loader