import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Loader2,
  Shield,
  Calendar,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import { ROLE_LABELS } from '../../utils/constants'

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
    district: '',
    state: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        village: user.village || '',
        district: user.district || '',
        state: user.state || ''
      })
    }
  }, [user])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.put('/auth/profile', formData)
      setUser({ ...user, ...response.data.data.user })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      toast.success('Password changed successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-white">My Profile</h1>
        <p className="text-surface-400 mt-1">Manage your account settings</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-surface-800">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-500/25">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-surface-400">
                <Mail className="w-4 h-4" />
                {user?.email}
              </span>
              <span className={`badge ${
                user?.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                user?.role === 'WORKER' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' :
                'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                <Shield className="w-3 h-3" />
                {ROLE_LABELS[user?.role]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-surface-500">
                <Calendar className="w-3 h-3" />
                Joined {new Date(user?.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                Account Active
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileUpdate} className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input pl-12"
                  placeholder="Your phone number"
                />
              </div>
            </div>

            <div>
              <label className="label">Village/Town</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="input pl-12"
                  placeholder="Your village or town"
                />
              </div>
            </div>

            <div>
              <label className="label">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="input"
                placeholder="Your district"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="input"
                placeholder="Your state"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Change Password Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Change Password</h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="input"
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="input"
                placeholder="Enter new password"
                required
              />
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="input"
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="btn btn-secondary"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
