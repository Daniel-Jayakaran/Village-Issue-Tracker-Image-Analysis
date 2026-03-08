import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, MapPin, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    village: '',
    district: '',
    state: '',
    address: ''
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    clearError()
    setErrors({ ...errors, [e.target.name]: '' })
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    const { confirmPassword, ...userData } = formData
    const result = await register(userData)
    
    if (result.success) {
      toast.success('Registration successful! Welcome to VITS.')
      navigate('/citizen')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-display font-bold text-white mb-2">
        Create Account
      </h2>
      <p className="text-surface-400 mb-8">
        Register as a citizen to report issues
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="label">Full Name *</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
              placeholder="Your full name"
            />
          </div>
          {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">Email Address *</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="label">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input pl-12"
              placeholder="Your phone number"
            />
          </div>
        </div>

        {/* Password */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="label">Password *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input pl-12 ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-rose-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="village" className="label">Village</label>
            <input
              type="text"
              id="village"
              name="village"
              value={formData.village}
              onChange={handleChange}
              className="input"
              placeholder="Village name"
            />
          </div>
          <div>
            <label htmlFor="district" className="label">District</label>
            <input
              type="text"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="input"
              placeholder="District"
            />
          </div>
          <div>
            <label htmlFor="state" className="label">State</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="input"
              placeholder="State"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="label">Full Address</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-3 w-5 h-5 text-surface-500" />
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="input pl-12 resize-none"
              placeholder="Your complete address"
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
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-surface-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
