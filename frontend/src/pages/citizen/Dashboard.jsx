import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import { STATUS_CONFIG } from '../../utils/constants'

export default function CitizenDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/citizen-stats')
        setStats(response.data.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { 
      label: 'Total Issues', 
      value: stats?.stats?.total || 0, 
      icon: FileText, 
      color: 'primary',
      gradient: 'from-primary-500 to-primary-600'
    },
    { 
      label: 'Pending', 
      value: stats?.stats?.pending || 0, 
      icon: Clock, 
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500'
    },
    { 
      label: 'In Progress', 
      value: stats?.stats?.inProgress || 0, 
      icon: TrendingUp, 
      color: 'violet',
      gradient: 'from-violet-500 to-purple-500'
    },
    { 
      label: 'Resolved', 
      value: stats?.stats?.resolved || 0, 
      icon: CheckCircle, 
      color: 'emerald',
      gradient: 'from-emerald-500 to-green-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 to-violet-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-surface-400 mb-6">
            Track your reported issues and submit new grievances
          </p>
          <Link to="/citizen/submit" className="btn btn-primary">
            <PlusCircle className="w-5 h-5" />
            Report New Issue
          </Link>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card card-hover p-6"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-display font-bold text-white mb-1">
              {loading ? '-' : stat.value}
            </p>
            <p className="text-sm text-surface-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent tickets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-white">Recent Issues</h2>
          <Link 
            to="/citizen/tickets"
            className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-surface-500">
            Loading...
          </div>
        ) : stats?.recentTickets?.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <p className="text-surface-400 mb-4">No issues reported yet</p>
            <Link to="/citizen/submit" className="btn btn-primary">
              <PlusCircle className="w-5 h-5" />
              Report Your First Issue
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-800">
            {stats?.recentTickets?.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/citizen/tickets/${ticket.id}`}
                className="flex items-center justify-between p-4 hover:bg-surface-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-surface-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{ticket.ticketNumber}</p>
                    <p className="text-sm text-surface-400 capitalize">
                      {ticket.category.replace(/_/g, ' ').toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${STATUS_CONFIG[ticket.status]?.badge}`}>
                    {STATUS_CONFIG[ticket.status]?.label}
                  </span>
                  <p className="text-xs text-surface-500 mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h3 className="font-semibold text-white mb-4">Need Help?</h3>
          <p className="text-sm text-surface-400 mb-4">
            If you face any issues with the system, contact the village administration office during working hours.
          </p>
          <div className="text-sm text-surface-300">
            <p>📞 Help Desk: 1800-XXX-XXXX</p>
            <p>📧 Email: support@village.gov.in</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h3 className="font-semibold text-white mb-4">Important Notice</h3>
          <ul className="text-sm text-surface-400 space-y-2">
            <li>• Always provide accurate location details</li>
            <li>• Upload clear photos of the issue</li>
            <li>• Check your ticket status regularly</li>
            <li>• Provide feedback after resolution</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
