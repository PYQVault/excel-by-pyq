import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, Sun, Moon, RefreshCw, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import useAuth from '@/hooks/useAuth'
import useTheme from '@/hooks/useTheme'
import Button from '@/components/common/Button'

const VerifyOTPPage = () => {
  const navigate             = useNavigate()
  const location             = useLocation()
  const { login }            = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const email = location.state?.email || ''

  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const [loading, setLoading]     = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [verified, setVerified]   = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    if (!email) navigate('/register')
  }, [email])

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const timer = setTimeout(() => setCountdown((p) => p - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleChange = (index, value) => {
    const digit  = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (digit && index === 5) {
      const full = newOtp.join('')
      if (full.length === 6) handleVerify(full)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pasted.split('').forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit
    })
    setOtp(newOtp)
    const lastIndex = Math.min(pasted.length - 1, 5)
    inputRefs.current[lastIndex]?.focus()
    if (pasted.length === 6) handleVerify(pasted)
  }

  const handleVerify = async (otpValue) => {
    const code = otpValue || otp.join('')
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code })
      setVerified(true)
      login(data.token, data.user)
      toast.success('Email verified! Welcome 🎉')
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await api.post('/auth/resend-otp', { email })
      toast.success('New OTP sent!')
      setOtp(['', '', '', '', '', ''])
      setCountdown(60)
      setCanResend(false)
      inputRefs.current[0]?.focus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Email Verified!
          </h2>
          <p className="text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">

      {/* Top bar */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-black text-slate-800 dark:text-white">
            Excel <span className="text-blue-500">By PYQ</span>
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="p-8">

              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                  📧
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Verify your email
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  We sent a 6-digit code to
                </p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm mt-1">
                  {email}
                </p>
              </div>

              {/* OTP boxes */}
              <div className="flex gap-2 sm:gap-3 justify-center mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`
                      w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold
                      rounded-xl border-2 transition-all duration-200
                      bg-white dark:bg-slate-700
                      text-slate-800 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800
                      ${digit
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-slate-200 dark:border-slate-600 focus:border-blue-500'
                      }
                    `}
                  />
                ))}
              </div>

              {/* Verify button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full mb-5"
                loading={loading}
                onClick={() => handleVerify()}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>

              {/* Resend */}
              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-semibold mx-auto transition-colors"
                  >
                    <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Sending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <p className="text-sm text-slate-400">
                    Resend code in{' '}
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      {countdown}s
                    </span>
                  </p>
                )}
              </div>

            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Wrong email?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-500 hover:underline font-medium"
            >
              Go back
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}

export default VerifyOTPPage