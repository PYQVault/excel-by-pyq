import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, BookOpen, Trophy, TrendingUp, Search,
  Shield, Trash2, Eye, EyeOff, ChevronLeft,
  ChevronRight, MoreVertical, CheckCircle2,
  XCircle, RefreshCw, Crown, UserCheck,
  BarChart3, Target, Calendar, Zap,MessageSquare,ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import useAuth from '@/hooks/useAuth'
import Navbar from '@/components/common/Navbar'
import Loader from '@/components/common/Loader'
import Button from '@/components/common/Button'
import clsx from 'clsx'

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
        <Icon size={18} className={color} />
      </div>
    </div>
    <p className="text-2xl font-black text-slate-800 dark:text-white mb-0.5">{value}</p>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
  </div>
)

// ── Tab Button ─────────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={clsx(
      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
      active
        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    )}
  >
    <Icon size={15} />
    {label}
    {count !== undefined && (
      <span className={clsx(
        'px-1.5 py-0.5 rounded-full text-xs font-bold',
        active ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
      )}>
        {count}
      </span>
    )}
  </button>
)

// ── Confirm Modal ──────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, onConfirm, onCancel, danger = true }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden">
      <div className={`h-1.5 w-full ${danger ? 'bg-red-500' : 'bg-blue-500'}`} />
      <div className="p-6">
        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            className="flex-1"
            onClick={onConfirm}
          >
            Confirm
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  </div>
)

// ── Users Table ────────────────────────────────────────────────────────────
const UsersTable = ({ currentUserId }) => {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage]         = useState(1)
  const [pagination, setPagination] = useState({})
  const [confirm, setConfirm]   = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users', {
        params: { page, limit: 10, search, role: roleFilter },
      })
      setUsers(data.data)
      setPagination(data.pagination)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId)
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole })
      toast.success(`Role updated to ${newRole}`)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role')
    } finally {
      setActionLoading(null)
      setConfirm(null)
    }
  }

  const handleDelete = async (userId) => {
    setActionLoading(userId)
    try {
      const { data } = await api.delete(`/admin/users/${userId}`)
      toast.success(data.message)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setActionLoading(null)
      setConfirm(null)
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['', 'student', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1) }}
              className={clsx(
                'px-3 py-2 rounded-xl text-xs font-semibold transition-all border',
                roleFilter === r
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'
              )}
            >
              {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={fetchUsers}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 hover:border-blue-300 transition-all"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                {['User', 'Auth', 'Role', 'Attempts', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className={clsx(
                      'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors',
                      user._id === currentUserId && 'bg-blue-50/50 dark:bg-blue-900/10'
                    )}
                  >
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[140px]">
                              {user.name}
                            </p>
                            {user._id === currentUserId && (
                              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Auth provider */}
                    <td className="px-5 py-4">
                      <span className={clsx(
                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                        user.authProvider === 'google'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      )}>
                        {user.authProvider === 'google' ? '🔴 Google' : '📧 Email'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span className={clsx(
                        'flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full w-fit',
                        user.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      )}>
                        {user.role === 'admin' ? <Crown size={11} /> : <UserCheck size={11} />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>

                    {/* Attempts */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {user.attempts}
                        </p>
                        <p className="text-xs text-slate-400">
                          {user.completed} completed
                        </p>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      {user._id !== currentUserId ? (
                        <div className="flex items-center gap-1">
                          {/* Toggle role */}
                          <button
                            onClick={() => setConfirm({
                              type: 'role',
                              userId: user._id,
                              userName: user.name,
                              newRole: user.role === 'admin' ? 'student' : 'admin',
                            })}
                            disabled={actionLoading === user._id}
                            className={clsx(
                              'p-1.5 rounded-lg text-xs font-medium transition-all',
                              user.role === 'admin'
                                ? 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            )}
                            title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          >
                            <Crown size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setConfirm({
                              type: 'delete',
                              userId: user._id,
                              userName: user.name,
                            })}
                            disabled={actionLoading === user._id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total} users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={clsx(
                    'w-7 h-7 rounded-lg text-xs font-semibold transition-all',
                    page === i + 1
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          title={
            confirm.type === 'delete'
              ? `Delete "${confirm.userName}"?`
              : `Change role to ${confirm.newRole}?`
          }
          message={
            confirm.type === 'delete'
              ? `This will permanently delete the user and all their quiz attempts. This action cannot be undone.`
              : `"${confirm.userName}" will be ${confirm.newRole === 'admin' ? 'given admin privileges' : 'changed back to student'}.`
          }
          danger={confirm.type === 'delete'}
          onConfirm={() =>
            confirm.type === 'delete'
              ? handleDelete(confirm.userId)
              : handleRoleChange(confirm.userId, confirm.newRole)
          }
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

// ── Quizzes Table ──────────────────────────────────────────────────────────
const QuizzesTable = () => {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/quizzes')
      setQuizzes(data.data)
    } catch {
      toast.error('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuizzes() }, [])

  const handleToggle = async (quizId) => {
    setActionLoading(quizId)
    try {
      const { data } = await api.patch(`/admin/quizzes/${quizId}/toggle`)
      toast.success(data.message)
      fetchQuizzes()
    } catch {
      toast.error('Failed to update quiz')
    } finally {
      setActionLoading(null)
      setConfirm(null)
    }
  }

  const handleDelete = async (quizId) => {
    setActionLoading(quizId)
    try {
      const { data } = await api.delete(`/admin/quizzes/${quizId}`)
      toast.success(data.message)
      fetchQuizzes()
    } catch {
      toast.error('Failed to delete quiz')
    } finally {
      setActionLoading(null)
      setConfirm(null)
    }
  }

  const EXAM_COLORS = {
    CUET_UG:  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    CUET_PG:  'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    UGC_NET:  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {quizzes.length} total quiz{quizzes.length !== 1 ? 'zes' : ''}
        </p>
        <button
          onClick={fetchQuizzes}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 hover:border-blue-300 transition-all"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                {['Quiz', 'Exam', 'Questions', 'Attempts', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : quizzes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    No quizzes found
                  </td>
                </tr>
              ) : (
                quizzes.map((quiz) => (
                  <tr key={quiz._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">

                    {/* Quiz info */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white max-w-[200px] truncate">
                        {quiz.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {quiz.subject} · {quiz.year}
                      </p>
                    </td>

                    {/* Exam */}
                    <td className="px-5 py-4">
                      <span className={clsx(
                        'text-xs font-bold px-2.5 py-1 rounded-full',
                        EXAM_COLORS[quiz.exam] || 'bg-slate-100 text-slate-500'
                      )}>
                        {quiz.exam?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Questions */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {quiz.questionCount}
                      </span>
                    </td>

                    {/* Attempts */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {quiz.attempts}
                        </p>
                        <p className="text-xs text-slate-400">{quiz.completed} done</p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={clsx(
                        'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit',
                        quiz.isPublished
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      )}>
                        {quiz.isPublished
                          ? <><CheckCircle2 size={11} /> Published</>
                          : <><XCircle size={11} /> Draft</>
                        }
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setConfirm({
                            type: 'toggle',
                            quizId: quiz._id,
                            quizTitle: quiz.title,
                            isPublished: quiz.isPublished,
                          })}
                          disabled={actionLoading === quiz._id}
                          className={clsx(
                            'p-1.5 rounded-lg transition-all',
                            quiz.isPublished
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          )}
                          title={quiz.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {quiz.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          onClick={() => setConfirm({
                            type: 'delete',
                            quizId: quiz._id,
                            quizTitle: quiz.title,
                          })}
                          disabled={actionLoading === quiz._id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          title="Delete Quiz"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title={
            confirm.type === 'delete'
              ? `Delete "${confirm.quizTitle}"?`
              : confirm.isPublished ? 'Unpublish this quiz?' : 'Publish this quiz?'
          }
          message={
            confirm.type === 'delete'
              ? 'This will permanently delete the quiz, all its questions, and all attempt records. This cannot be undone.'
              : confirm.isPublished
              ? 'Students will no longer be able to see or take this quiz.'
              : 'This quiz will become visible to all students.'
          }
          danger={confirm.type === 'delete'}
          onConfirm={() =>
            confirm.type === 'delete'
              ? handleDelete(confirm.quizId)
              : handleToggle(confirm.quizId)
          }
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
// ── Feedback Table ─────────────────────────────────────────────────────────
const FeedbackTable = () => {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter]     = useState('')

  const TYPE_STYLES = {
    feedback:   'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    bug:        'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    suggestion: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    other:      'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  }

  const TYPE_ICONS = {
    feedback: '💬', bug: '🐛', suggestion: '💡', other: '📌'
  }

  const STATUS_STYLES = {
    new:      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    read:     'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
    resolved: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  }

  const fetchFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/feedback', {
        params: { status: statusFilter, type: typeFilter },
      })
      setItems(data.data)
    } catch {
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter])

  useEffect(() => { fetchFeedback() }, [fetchFeedback])

  const handleStatus = async (id, status) => {
    try {
      await api.patch(`/feedback/${id}/status`, { status })
      fetchFeedback()
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/feedback/${id}`)
      fetchFeedback()
      toast.success('Feedback deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Status filter */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
          {[
            { key: '',         label: 'All' },
            { key: 'new',      label: '🔵 New' },
            { key: 'read',     label: '⚪ Read' },
            { key: 'resolved', label: '🟢 Resolved' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                statusFilter === s.key
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
          {[
            { key: '',           label: 'All Types' },
            { key: 'feedback',   label: '💬 Feedback' },
            { key: 'bug',        label: '🐛 Bug' },
            { key: 'suggestion', label: '💡 Suggestion' },
            { key: 'other',      label: '📌 Other' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                typeFilter === t.key
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchFeedback}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 hover:border-blue-300 transition-all ml-auto"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-32" />
                </div>
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">No feedback yet</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className={clsx(
                'bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 overflow-hidden',
                item.status === 'new'
                  ? 'border-blue-200 dark:border-blue-700/50 shadow-sm'
                  : 'border-slate-100 dark:border-slate-700'
              )}
            >
              {/* Header row */}
              <div
                className="flex items-start gap-3 p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpanded(expanded === item._id ? null : item._id)}
              >
                {/* Type icon */}
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0',
                  TYPE_STYLES[item.type]
                )}>
                  {TYPE_ICONS[item.type]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">
                      {item.subject}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={clsx(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        STATUS_STYLES[item.status]
                      )}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {item.name}
                    </span>
                    <span>·</span>
                    <span>{item.email}</span>
                    <span>·</span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  size={16}
                  className={clsx(
                    'text-slate-400 shrink-0 mt-1 transition-transform duration-200',
                    expanded === item._id && 'rotate-180'
                  )}
                />
              </div>

              {/* Expanded message */}
              {expanded === item._id && (
                <div className="px-5 pb-5 border-t border-slate-50 dark:border-slate-700/50">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mt-4 mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-7 whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-slate-400 mr-2">Mark as:</p>
                    {['new', 'read', 'resolved'].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatus(item._id, s)}
                        disabled={item.status === s}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                          item.status === s
                            ? `${STATUS_STYLES[s]} opacity-100 cursor-default`
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                        )}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Main Admin Page ────────────────────────────────────────────────────────
const AdminPage = () => {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('overview')

  useEffect(() => {
    // Guard — redirect non-admins
    if (user && user.role !== 'admin') {
      toast.error('Admin access required')
      navigate('/dashboard')
      return
    }
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats')
        setStats(data.data)
      } catch {
        toast.error('Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <Loader text="Loading admin panel..." />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                Admin Panel
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage users, quizzes, and monitor platform activity
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
            <Zap size={14} /> Dashboard
          </Button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              icon={Users} label="Total Users" value={stats.totalUsers}
              sub={`+${stats.recentSignups} this week`}
              color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/30"
            />
            <StatCard
              icon={BookOpen} label="Published Quizzes" value={stats.totalQuizzes}
              color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/30"
            />
            <StatCard
              icon={Target} label="Total Questions" value={stats.totalQuestions}
              color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/30"
            />
            <StatCard
              icon={BarChart3} label="Total Attempts" value={stats.totalAttempts}
              sub={`${stats.completedAttempts} completed`}
              color="text-green-500" bg="bg-green-50 dark:bg-green-900/30"
            />
            <StatCard
              icon={Trophy} label="Avg. Score" value={`${stats.avgScore}%`}
              color="text-rose-500" bg="bg-rose-50 dark:bg-rose-900/30"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <TabBtn
  active={tab === 'feedback'}
  onClick={() => setTab('feedback')}
  icon={MessageSquare}
  label="Feedback"
/>
          <TabBtn
            active={tab === 'overview'}
            onClick={() => setTab('overview')}
            icon={BarChart3}
            label="Overview"
          />
          <TabBtn
            active={tab === 'users'}
            onClick={() => setTab('users')}
            icon={Users}
            label="Users"
            count={stats?.totalUsers}
          />
          <TabBtn
            active={tab === 'quizzes'}
            onClick={() => setTab('quizzes')}
            icon={BookOpen}
            label="Quizzes"
            count={stats?.totalQuizzes}
          />
        </div>

        {/* Tab Content */}
        {tab === 'overview' && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* User breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Users size={16} className="text-blue-500" /> User Breakdown
              </h3>
              {[
                { label: 'Email signups',  value: stats.totalUsers - stats.googleUsers, color: 'bg-blue-500'   },
                { label: 'Google signups', value: stats.googleUsers,                    color: 'bg-red-500'    },
                { label: 'Admin users',    value: stats.adminUsers,                     color: 'bg-purple-500' },
                { label: 'Student users',  value: stats.totalUsers - stats.adminUsers,  color: 'bg-green-500'  },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Attempt breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" /> Attempt Breakdown
              </h3>
              {[
                { label: 'Total attempts',    value: stats.totalAttempts,                                     color: 'bg-blue-500'  },
                { label: 'Completed',         value: stats.completedAttempts,                                 color: 'bg-green-500' },
                { label: 'In progress',       value: stats.totalAttempts - stats.completedAttempts,           color: 'bg-amber-500' },
                { label: 'Completion rate',   value: stats.totalAttempts > 0 ? `${Math.round((stats.completedAttempts / stats.totalAttempts) * 100)}%` : '0%', color: 'bg-purple-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Quick info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-purple-500" /> Quick Info
              </h3>
              {[
                { label: 'New users (7 days)',  value: stats.recentSignups   },
                { label: 'Avg. score',          value: `${stats.avgScore}%`  },
                { label: 'Total questions',     value: stats.totalQuestions  },
                { label: 'Questions per quiz',  value: stats.totalQuizzes > 0 ? Math.round(stats.totalQuestions / stats.totalQuizzes) : 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}


        {tab === 'users' && <UsersTable currentUserId={user?._id} />}
        {tab === 'quizzes' && <QuizzesTable />}
        {tab === 'feedback' && <FeedbackTable />}

      </main>
    </div>
  )
}

export default AdminPage