import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Edit,
  Loader2,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { ROLES, ROLE_LABELS } from '../../utils/constants'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({ role: '', isActive: '' })
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)

  const fetchUsers = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      if (filters.role) params.append('role', filters.role)
      if (filters.isActive) params.append('isActive', filters.isActive)

      const response = await api.get(`/users?${params}`)
      setUsers(response.data.data.users)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const toggleUserStatus = async (userId) => {
    try {
      await api.put(`/users/${userId}/toggle-status`)
      toast.success('User status updated')
      fetchUsers(pagination.page)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            Manage Users
          </h1>
          <p className="text-surface-400 mt-1">
            {pagination.total} user{pagination.total !== 1 ? 's' : ''} in system
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditUser(null)
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-4"
      >
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[180px]">
            <label className="label">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="input"
            >
              <option value="">All Roles</option>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="label">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="input"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Users table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center text-surface-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <p className="text-surface-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {users.map((user) => (
                    <tr key={user.id || user._id} className="hover:bg-surface-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.name}</p>
                            <p className="text-xs text-surface-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          user.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          user.role === 'WORKER' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-400">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-400">
                        {user.village ? `${user.village}, ${user.district || ''}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          user.isActive 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : 'bg-surface-500/20 text-surface-300 border-surface-500/30'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditUser(user)
                              setShowModal(true)
                            }}
                            className="p-2 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id || user._id)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isActive 
                                ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' 
                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                            }`}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-surface-800">
                <p className="text-sm text-surface-500">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchUsers(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn btn-secondary p-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => fetchUsers(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn btn-secondary p-2 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Create/Edit User Modal */}
      <AnimatePresence>
        {showModal && (
          <UserModal
            user={editUser}
            onClose={() => {
              setShowModal(false)
              setEditUser(null)
            }}
            onSuccess={() => {
              setShowModal(false)
              setEditUser(null)
              fetchUsers(pagination.page)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function UserModal({ user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role || 'CITIZEN',
    village: user?.village || '',
    district: user?.district || '',
    state: user?.state || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (user) {
        // Update existing user
        const { password, email, ...updateData } = formData
        await api.put(`/users/${user.id || user._id}`, updateData)
        toast.success('User updated successfully')
      } else {
        // Create new user
        if (!formData.password) {
          toast.error('Password is required for new users')
          setLoading(false)
          return
        }
        await api.post('/users', formData)
        toast.success('User created successfully')
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
                required
              >
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
              disabled={!!user}
            />
          </div>

          {!user && (
            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="Minimum 6 characters"
                required
              />
            </div>
          )}

          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Village</label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                user ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
