import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    clearError()
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`)
      
      // Navigate based on role
      const dashboardPaths = {
        CITIZEN: '/citizen',
        ADMIN: '/admin',
        WORKER: '/worker'
      }
      navigate(dashboardPaths[result.user.role] || '/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-display font-bold text-white mb-2">
        Welcome Back
      </h2>
      <p className="text-surface-400 mb-8">
        Sign in to your account to continue
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input pl-12"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input pl-12"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2"
          >
            {error}
          </motion.p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-surface-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
          Register as Citizen
        </Link>
      </p>

      {/* Demo credentials */}
      <div className="mt-8 p-4 bg-surface-800/50 rounded-xl border border-surface-700">
        <p className="text-xs font-medium text-surface-400 mb-3">Demo Credentials</p>
        <div className="space-y-2 text-xs text-surface-500">
          <p><span className="text-surface-300">Admin:</span> admin@village.gov.in / password123</p>
          <p><span className="text-surface-300">Worker:</span> worker1@village.gov.in / password123</p>
          <p><span className="text-surface-300">Citizen:</span> citizen1@example.com / password123</p>
        </div>
      </div>
    </div>
  )
}
