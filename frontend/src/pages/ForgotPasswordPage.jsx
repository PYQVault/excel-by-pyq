import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Zap, ArrowLeft, Sun, Moon, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import useTheme from '@/hooks/useTheme'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Logo from '../components/common/Logo'

const ForgotPasswordPage = () => {
  const navigate             = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [email, setEmail]    = useState('')
  const [error, setError]    = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]      = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">

      {/* Top bar */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>
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

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-full h-10  rounded-lg flex items-center justify-center  ">
              <Logo size="lg"  />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-linear-to-r from-blue-400 to-blue-600" />
            <div className="p-8">

              {!sent ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Mail size={24} className="text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                      Forgot your password?
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      No worries! Enter your email and we'll send you a reset link valid for 15 minutes.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-[41px] text-slate-400 pointer-events-none z-10" />
                      <Input
                        label="Email address"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                        error={error}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={loading}
                      className="w-full"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>
                </>
              ) : (
                // Success state
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 size={30} className="text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                    Check your inbox!
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                    We sent a password reset link to{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>.
                    <br />Check your spam folder if you don't see it.
                  </p>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    Back to Login
                  </Button>
                </div>
              )}

            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage