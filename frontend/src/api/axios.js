import axios from 'axios'

const api = axios.create({
  baseURL: '/api',   // Vite proxy handles → localhost:5000/api
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor ───────────────────────────────────────────
// Automatically attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ──────────────────────────────────────────
// Auto logout if token expires (401 response)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api