import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, Bug, Lightbulb, MoreHorizontal,
  Send, CheckCircle2, ArrowLeft, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import useAuth from '@/hooks/useAuth'
import Navbar from '@/components/common/Navbar'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import clsx from 'clsx'

// ── Feedback type config ───────────────────────────────────────────────────
const TYPES = [
  {
    key:   'feedback',
    label: 'General Feedback',
    icon:  MessageSquare,
    desc:  'Share your thoughts about the app',
    color: 'text-blue-500',
    bg:    'bg-blue-50 dark:bg-blue-900/30',
    border:'border-blue-200 dark:border-blue-700',
  },
  {
    key:   'other',
    label: 'Other',
    icon:  MoreHorizontal,
    desc:  'Anything else you want to tell us',
    color: 'text-slate-500',
    bg:    'bg-slate-50 dark:bg-slate-800',
    border:'border-slate-200 dark:border-slate-600',
  },
]

// ── Type Card ──────────────────────────────────────────────────────────────
const TypeCard = ({ type, selected, onSelect }) => {
  const Icon = type.icon
  return (
    <button
      type="button"
      onClick={() => onSelect(type.key)}
      className={clsx(
        'flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 w-full',
        selected
          ? `${type.border} ${type.bg} shadow-sm`
          : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
      )}
    >
      <div className={clsx(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
        selected ? type.bg : 'bg-slate-100 dark:bg-slate-700'
      )}>
        <Icon size={17} className={selected ? type.color : 'text-slate-400'} />
      </div>
      <div>
        <p className={clsx(
          'text-sm font-bold mb-0.5',
          selected ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'
        )}>
          {type.label}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          {type.desc}
        </p>
      </div>
      {selected && (
        <CheckCircle2
          size={16}
          className={clsx('ml-auto shrink-0 mt-1', type.color)}
        />
      )}
    </button>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
const FeedbackPage = () => {
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [formData, setFormData] = useState({
    type:    'feedback',
    subject: '',
    message: '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const selectedType = TYPES.find((t) => t.key === formData.type)

  const validate = () => {
    const errs = {}
    if (!formData.subject.trim())
      errs.subject = 'Please enter a subject'
    if (!formData.message.trim())
      errs.message = 'Please write your message'
    else if (formData.message.trim().length < 10)
      errs.message = 'Message must be at least 10 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await api.post('/feedback', formData)
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success Screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">

          {/* Animated success */}
          <div className="relative inline-flex mb-8">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center">
              <CheckCircle2 size={44} className="text-green-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white text-base">✓</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-3">
            Message Sent! 🎉
          </h1>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
            Thanks for reaching out, <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name?.split(' ')[0]}</span>!
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-8 leading-relaxed">
            We've received your {selectedType?.label.toLowerCase()} and sent a confirmation to{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">{user?.email}</span>.
            We'll get back to you within 1–2 business days if needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSubmitted(false)
                setFormData({ type: 'feedback', subject: '', message: '' })
              }}
            >
              Send Another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors mb-5"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
              <MessageSquare size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-1">
                Contact Us
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Have a question, found a bug, or want to suggest something?
                We read every message and genuinely care about your experience.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Pre-filled user info — read only */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
              Your Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Name
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {user?.name}
                  </span>
                  <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold shrink-0">
                    Auto-filled
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Email
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <span className="text-sm text-slate-600 dark:text-slate-300 truncate flex-1">
                    {user?.email}
                  </span>
                  <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold shrink-0">
                    Auto-filled
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Type selector */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
              What is this about?
            </h2>
            {/* Type selector grid — 2 cols → 1 col since only 2 items */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {TYPES.map((type) => (
    <TypeCard
      key={type.key}
      type={type}
      selected={formData.type === type.key}
      onSelect={(key) => setFormData((p) => ({ ...p, type: key }))}
    />
  ))}
</div>
          </div>

          {/* Subject + Message */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Your Message
            </h2>

            {/* Subject */}
            <Input
              label="Subject"
              name="subject"
              type="text"
              placeholder={
                formData.type === 'bug'
                  ? 'e.g. Quiz not loading on mobile'
                  : formData.type === 'suggestion'
                  ? 'e.g. Add a dark mode for results page'
                  : 'Brief summary of your message'
              }
              value={formData.subject}
              onChange={handleChange}
              error={errors.subject}
            />

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Message
              </label>
              <textarea
                name="message"
                rows={6}
                placeholder={
                  formData.type === 'bug'
                    ? 'Please describe:\n1. What you were doing\n2. What happened\n3. What you expected to happen\n4. Your device/browser'
                    : formData.type === 'suggestion'
                    ? 'Describe your idea in detail. How would it work? Why would it be useful?'
                    : 'Write your message here...'
                }
                value={formData.message}
                onChange={handleChange}
                className={clsx(
                  'w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 resize-none',
                  'bg-white dark:bg-slate-800',
                  'text-slate-800 dark:text-slate-100',
                  'placeholder:text-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent',
                  'leading-relaxed',
                  errors.message
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              />
              <div className="flex items-center justify-between">
                {errors.message ? (
                  <p className="text-xs text-red-500">{errors.message}</p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Minimum 10 characters
                  </p>
                )}
                <p className={clsx(
                  'text-xs transition-colors',
                  formData.message.length < 10
                    ? 'text-slate-300 dark:text-slate-600'
                    : 'text-green-500'
                )}>
                  {formData.message.length} chars
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="flex-1 sm:flex-none sm:min-w-[180px]"
            >
              <Send size={15} />
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>

        </form>
      </main>
    </div>
  )
}

export default FeedbackPage