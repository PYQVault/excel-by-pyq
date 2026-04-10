import clsx from 'clsx'

// Base skeleton pulse block
const Skeleton = ({ className = '' }) => (
  <div className={clsx(
    'animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl',
    className
  )} />
)

// Dashboard quiz card skeleton
export const QuizCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
    <div className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-5 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full ml-3" />
      </div>
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  </div>
)

// Exam card skeleton
export const ExamCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
    <Skeleton className="w-12 h-12 rounded-2xl mb-4" />
    <Skeleton className="h-7 w-28 mb-2" />
    <Skeleton className="h-4 w-48 mb-6" />
    <div className="flex gap-2">
      <Skeleton className="h-7 w-20 rounded-lg" />
      <Skeleton className="h-7 w-20 rounded-lg" />
    </div>
  </div>
)

// Stat card skeleton
export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 flex items-center gap-4 border border-slate-100 dark:border-slate-700">
    <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
    <div className="flex-1">
      <Skeleton className="h-7 w-12 mb-1.5" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
)

// Dashboard full skeleton
export const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header */}
    <div className="flex items-center justify-between mb-8">
      <div>
        <Skeleton className="h-7 w-44 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-48 hidden sm:block" />
    </div>
    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    {/* Title */}
    <Skeleton className="h-6 w-40 mb-2" />
    <Skeleton className="h-4 w-64 mb-6" />
    {/* Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <ExamCardSkeleton key={i} />)}
    </div>
  </div>
)

// Quiz page skeleton
export const QuizPageSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {/* Top bar */}
    <div className="flex items-center gap-3 mb-6">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <div>
        <Skeleton className="h-5 w-64 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <div className="flex gap-6">
      {/* Question card */}
      <div className="flex-1">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="px-6 py-6">
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-3/4 mb-8" />
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Palette */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {[...Array(20)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default Skeleton