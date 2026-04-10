import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, Mail, Lock, Sun, Moon, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import useAuth from '@/hooks/useAuth'
import useTheme from '@/hooks/useTheme'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Logo from '@/components/common/Logo'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!formData.email)    errs.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email))
                            errs.email    = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 6)
                            errs.password = 'Minimum 6 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error on type
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', formData)
      login(data.token, data.user)
      toast.success(`Welcome back, ${data.user.name}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

    {/* Left Panel — hidden on mobile */}
    <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex-col items-center justify-center p-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-800/30 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="relative z-10 text-center text-white max-w-md">
        <div className="w-20 h-20 bg-white backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
          <Logo size="lg" showText="" />
        </div>
        <h1 className="text-4xl font-bold mb-4 leading-tight">
          Test Your Knowledge
        </h1>
        <p className="text-blue-100 text-lg mb-10 leading-relaxed">
          Challenge yourself with real previous year papers and resume anytime.
        </p>
        {[
          '✅  Resume quizzes from where you left',
          '📊  Detailed score breakdown',
          '🎯  Question palette for easy navigation',
        ].map((feat) => (
          <div key={feat} className="flex items-center gap-3 bg-white/15 backdrop-blur rounded-xl px-4 py-3 mb-3 text-left text-sm">
            {feat}
          </div>
        ))}
      </div>
    </div>

    {/* Right Panel */}
    <div className="w-full lg:w-1/2 flex flex-col min-h-screen">

     {/* Top bar */}
<div className="flex items-center justify-between p-4 sm:p-6">

  {/* Back to home button — always visible */}
  <button
    onClick={() => navigate('/')}
    className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
  >
    <ChevronLeft size={16} />
    Back to Home
  </button>

  {/* Theme toggle */}
  <button
    onClick={toggleTheme}
    className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
  >
    {isDark ? <Sun size={16} /> : <Moon size={16} />}
  </button>
</div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-8">
        <div className="w-full max-w-md">

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Welcome back 👋
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Sign in to continue your learning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-[41px] text-slate-400 pointer-events-none z-10" />
              <Input
                label="Email address"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                className="pl-10"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-[41px] text-slate-400 pointer-events-none z-10" />
              <Input
                label="Password"
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3.5 top-[41px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
{/* Submit button */}
<Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
  {loading ? 'Signing in...' : 'Sign In'}
</Button>
          </form>

{/* Forgot password link */}
<div className="flex justify-end">
  <Link
    to="/forgot-password"
    className="text-xs text-blue-500 hover:text-blue-600 font-medium hover:underline transition-colors"
  >
    Forgot password?
  </Link>
</div>

          {/* Divider */}
<div className="flex items-center gap-4 my-2">
  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
  <span className="text-xs text-slate-400">OR</span>
  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
</div>
 
 {/* Google Sign In */}

  <a href="http://localhost:5000/api/auth/google"
  className="w-full flex items-center justify-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
>
  {/* Google SVG icon */}
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
    Continue with Google
  </span>
</a>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold hover:underline transition-colors">
              Create one free
            </Link>
          </p>

        </div>
      </div>
    </div>
  </div>
)
}

export default LoginPage