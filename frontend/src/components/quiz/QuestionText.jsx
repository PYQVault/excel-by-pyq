// Detects if a cell value is an image URL
const isImageUrl = (str) => {
  if (!str) return false
  const lower = str.toLowerCase().trim()
  return (
    (lower.startsWith('http://') || lower.startsWith('https://')) &&
    (
      lower.includes('.png')  ||
      lower.includes('.jpg')  ||
      lower.includes('.jpeg') ||
      lower.includes('.webp') ||
      lower.includes('.gif')  ||
      lower.includes('cloudinary.com') ||
      lower.includes('imgur.com')
    )
  )
}

// Renders a cell — could be text, image, or text + image
const CellContent = ({ value }) => {
  if (!value) return <span className="text-slate-400">—</span>

  // Split by newline — some cells have text on line 1 and URL on line 2
  const lines = value.split('\n').map((l) => l.trim()).filter(Boolean)

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (isImageUrl(line)) {
          return (
            <img
              key={i}
              src={line}
              alt="content"
              className="max-h-24 max-w-full object-contain rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling && (e.target.nextSibling.style.display = 'block')
              }}
            />
          )
        }
        return (
          <span key={i} className="block text-sm leading-snug">
            {line}
          </span>
        )
      })}
    </div>
  )
}

const QuestionText = ({ text }) => {
  if (!text) return null

  const lines = text.split('\n').filter((line) => line.trim() !== '')

  const segments = []
  let tableBuffer = []

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      segments.push({ type: 'table', rows: [...tableBuffer] })
      tableBuffer = []
    }
  }

  lines.forEach((line) => {
    if (line.includes('|')) {
      const parts = line.split('|').map((s) => s.trim())
      tableBuffer.push({ left: parts[0], right: parts[1] || '' })
    } else {
      flushTable()
      segments.push({ type: 'text', content: line.trim() })
    }
  })
  flushTable()

  return (
    <div className="space-y-3">
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          // Check if the entire line is an image URL
          if (isImageUrl(segment.content)) {
            return (
              <div key={i} className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <img
                  src={segment.content}
                  alt="Question"
                  className="w-full max-h-72 object-contain p-2"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            )
          }
          return (
            <p
              key={i}
              className="text-slate-800 dark:text-slate-100 font-medium text-base leading-relaxed"
            >
              {segment.content}
            </p>
          )
        }

        // Table segment
        return (
          <div
            key={i}
            className="rounded-xl border border-blue-100 dark:border-slate-600 overflow-hidden my-2"
          >
            {segment.rows.map((row, j) => {
              const isHeader = j === 0
              return (
                <div
                  key={j}
                  className={`
                    grid grid-cols-2 divide-x divide-blue-100 dark:divide-slate-600
                    ${isHeader
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : j % 2 === 0
                        ? 'bg-white dark:bg-slate-800'
                        : 'bg-slate-50/50 dark:bg-slate-700/30'
                    }
                  `}
                >
                  {/* Left cell */}
                  <div className={`px-4 py-3 text-sm ${
                    isHeader
                      ? 'text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    <CellContent value={row.left} />
                  </div>

                  {/* Right cell */}
                  <div className={`px-4 py-3 text-sm ${
                    isHeader
                      ? 'text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    <CellContent value={row.right} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default QuestionText