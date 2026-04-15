// Only runs in production to prevent Render free tier sleep
const keepAlive = () => {
  if (process.env.NODE_ENV !== 'production') return

  const url = `${process.env.BACKEND_URL}/api/health`
  const interval = 14 * 60 * 1000  // 14 minutes

  setInterval(async () => {
    try {
      const res = await fetch(url)
      console.log(`🔄 Keep-alive ping: ${res.status}`)
    } catch (err) {
      console.error('Keep-alive failed:', err.message)
    }
  }, interval)

  console.log('🔄 Keep-alive started')
}

module.exports = keepAlive