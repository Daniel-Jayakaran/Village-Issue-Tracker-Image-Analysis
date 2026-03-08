import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add correlation ID
    config.headers['X-Correlation-ID'] = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred'
    const status = error.response?.status

    // Handle specific status codes
    if (status === 401) {
      // Token expired or invalid
      localStorage.removeItem('vits-auth')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.')
    } else if (status === 404) {
      toast.error('Resource not found.')
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.')
    }

    return Promise.reject(error)
  }
)

export default api
