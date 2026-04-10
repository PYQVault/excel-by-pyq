import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Zap, Sun, Moon, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import useTheme from '@/hooks/useTheme'
import useAuth from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Logo from '../components/common/Logo'

const ResetPasswordPage = () => {
  const { token }            = useParams()
  const navigate             = useNavigate()
  const { login }            = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone]         = useState(false)

  const getStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 6)          score++
    if (pw.length >= 10)         score++
    if (/[A-Z]/.test(pw))        score++
    if (/[0-9]/.test(pw))        score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    const levels = [
      { score: 0, label: '',           color: '' },
      { score: 1, label: 'Weak',       color: 'bg-red-400' },
      { score: 2, label: 'Fair',       color: 'bg-orange-400' },
      { score: 3, label: 'Good',       color: 'bg-yellow-400' },
      { score: 4, label: 'Strong',     color: 'bg-blue-500' },
      { score: 5, label: 'Very Strong',color: 'bg-green-500' },
    ]
    return levels[Math.min(score, 5)]
  }

  const strength = getStrength(formData.password)

  const validate = () => {
    const errs = {}
    if (!formData.password)            errs.password = 'Password is required'
    else if (formData.password.length < 6) errs.password = 'Minimum 6 characters'
    if (!formData.confirmPassword)     errs.confirmPassword = 'Please confirm'
    else if (formData.password !== formData.confirmPassword)
                                       errs.confirmPassword = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      })
      // Auto login after reset
      login(data.token, data.user)
      setDone(true)
      toast.success('Password reset successfully! 🎉')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. Link may have expired.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">

      {/* Top bar */}
      <div className="flex items-center justify-end p-4 sm:p-6">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

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

              {!done ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Lock size={24} className="text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                      Create new password
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Choose a strong password for your account.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Password */}
                    <div>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-[41px] text-slate-400 pointer-events-none z-10" />
                        <Input
                          label="New Password"
                          name="password"
                          type={showPass ? 'text' : 'password'}
                          placeholder="Min. 6 characters"
                          value={formData.password}
                          onChange={(e) => {
                            setFormData((p) => ({ ...p, password: e.target.value }))
                            if (errors.password) setErrors((p) => ({ ...p, password: '' }))
                          }}
                          error={errors.password}
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((p) => !p)}
                          className="absolute right-3.5 top-[41px] text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      {/* Strength bar */}
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1,2,3,4,5].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                              }`} />
                            ))}
                          </div>
                          <p className="text-xs text-slate-400">
                            Strength: <span className="font-semibold text-slate-600 dark:text-slate-300">{strength.label}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-[41px] text-slate-400 pointer-events-none z-10" />
                      <Input
                        label="Confirm Password"
                        name="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData((p) => ({ ...p, confirmPassword: e.target.value }))
                          if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' }))
                        }}
                        error={errors.confirmPassword}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3.5 top-[41px] text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={loading}
                      className="w-full"
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={30} className="text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    Password Reset!
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Redirecting you to dashboard...
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage