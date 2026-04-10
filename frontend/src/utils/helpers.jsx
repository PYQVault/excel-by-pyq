export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Now supports: answered-correct | answered-wrong | current | unvisited
export const getPaletteColor = (status) => {
  const colors = {
    'answered-correct': 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
    'answered-wrong':   'bg-red-100 text-red-600 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
    'current':          'bg-blue-500 text-white border-blue-500 ring-2 ring-blue-300 ring-offset-1 dark:ring-offset-slate-800',
    'unvisited':        'bg-white text-slate-500 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400',
  }
  return colors[status] || colors.unvisited
}

export const truncate = (text, maxLength = 80) =>
  text?.length > maxLength ? `${text.slice(0, maxLength)}...` : text