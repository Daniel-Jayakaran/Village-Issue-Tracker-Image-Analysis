import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Users, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  ClipboardList,
  Settings,
  ChevronDown,
  User as UserIcon
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import { ROLE_LABELS } from '../utils/constants'

// Navigation configurations per role
const NAV_CONFIG = {
  CITIZEN: [
    { path: '/citizen', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/citizen/submit', icon: PlusCircle, label: 'Report Issue' },
    { path: '/citizen/tickets', icon: FileText, label: 'My Tickets' }
  ],
  ADMIN: [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/tickets', icon: ClipboardList, label: 'All Tickets' },
    { path: '/admin/users', icon: Users, label: 'Manage Users' }
  ],
  WORKER: [
    { path: '/worker', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/worker/tickets', icon: ClipboardList, label: 'My Assignments' }
  ]
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems = NAV_CONFIG[user?.role] || []

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications?limit=5')
        setNotifications(response.data.data.notifications)
        setUnreadCount(response.data.data.unreadCount)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // Poll every minute

    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setUnreadCount(0)
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notif) => {
    // Mark as read
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif.id}/read`)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(notifications.map(n => 
          n.id === notif.id ? { ...n, isRead: true } : n
        ))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }

    // Navigate to ticket if ticketId exists
    if (notif.ticketId) {
      const rolePath = {
        CITIZEN: '/citizen',
        ADMIN: '/admin',
        WORKER: '/worker'
      }
      const basePath = rolePath[user?.role] || '/citizen'
      navigate(`${basePath}/tickets/${notif.ticketId}`)
      setShowNotifications(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 
        bg-surface-900/95 backdrop-blur-xl border-r border-surface-800
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-display font-bold text-white">VITS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-surface-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                transition-all duration-200
                ${isActive 
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                  : 'text-surface-400 hover:text-white hover:bg-surface-800/50'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-800">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-800/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-surface-400">{ROLE_LABELS[user?.role]}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800">
          <div className="h-full flex items-center justify-between px-4 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-surface-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page title placeholder */}
            <div className="hidden lg:block" />

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-surface-900 border border-surface-800 rounded-2xl shadow-xl overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 border-b border-surface-800">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-primary-400 hover:text-primary-300"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-center text-surface-500 text-sm">
                            No notifications
                          </p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-4 border-b border-surface-800 last:border-0 cursor-pointer hover:bg-surface-800/50 transition-colors ${
                                !notif.isRead ? 'bg-primary-500/5' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-white">{notif.title}</p>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-surface-400 mt-1">{notif.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-surface-500">
                                  {new Date(notif.createdAt).toLocaleString()}
                                </p>
                                {notif.ticketNumber && (
                                  <span className="text-xs text-primary-400">
                                    {notif.ticketNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-surface-900 border border-surface-800 rounded-2xl shadow-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-surface-800">
                        <p className="font-medium text-white">{user?.name}</p>
                        <p className="text-sm text-surface-400">{user?.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            const rolePath = { CITIZEN: '/citizen', ADMIN: '/admin', WORKER: '/worker' }
                            navigate(`${rolePath[user?.role]}/profile`)
                            setShowUserMenu(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-surface-300 hover:text-white hover:bg-surface-800 rounded-xl transition-colors"
                        >
                          <UserIcon className="w-4 h-4" />
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Click outside handlers */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowNotifications(false)
            setShowUserMenu(false)
          }}
        />
      )}
    </div>
  )
}
