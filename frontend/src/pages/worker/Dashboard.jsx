import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Play
} from 'lucide-react'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import { STATUS_CONFIG, CATEGORIES } from '../../utils/constants'

export default function WorkerDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/worker-stats')
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
      label: 'Pending', 
      value: stats?.stats?.pending || 0, 
      icon: Clock, 
      gradient: 'from-amber-500 to-orange-500'
    },
    { 
      label: 'In Progress', 
      value: stats?.stats?.inProgress || 0, 
      icon: Play, 
      gradient: 'from-violet-500 to-purple-500'
    },
    { 
      label: 'Resolved', 
      value: stats?.stats?.resolved || 0, 
      icon: CheckCircle, 
      gradient: 'from-cyan-500 to-blue-500'
    },
    { 
      label: 'Completed', 
      value: stats?.stats?.completed || 0, 
      icon: CheckCircle, 
      gradient: 'from-emerald-500 to-green-500'
    }
  ]

  const getCategoryLabel = (value) => {
    return CATEGORIES.find(c => c.value === value)?.label || value
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
            Hello, {user?.name?.split(' ')[0]}! 👷
          </h1>
          <p className="text-surface-400 mb-6">
            Here's an overview of your assigned tasks
          </p>
          {stats?.todayAssigned > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              You have {stats.todayAssigned} new assignment{stats.todayAssigned > 1 ? 's' : ''} today
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* SLA breach warning */}
      {stats?.stats?.slaBreached > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="font-medium text-rose-400">
                {stats.stats.slaBreached} SLA Breach{stats.stats.slaBreached > 1 ? 'es' : ''}
              </p>
              <p className="text-sm text-surface-400">
                You have tickets that have exceeded their SLA deadline
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Urgent tickets */}
      {stats?.urgentTickets?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Urgent Tasks
            </h2>
            <span className="badge bg-amber-500/20 text-amber-400 border-amber-500/30">
              Needs immediate attention
            </span>
          </div>

          <div className="divide-y divide-surface-800">
            {stats.urgentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/worker/tickets/${ticket.id}`}
                className="flex items-center justify-between p-4 hover:bg-surface-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-mono text-sm text-primary-400">{ticket.ticketNumber}</p>
                    <p className="text-sm text-surface-400 capitalize">
                      {getCategoryLabel(ticket.category)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge badge-${ticket.priority?.toLowerCase()}`}>
                    {ticket.priority}
                  </span>
                  <p className="text-xs text-rose-400 mt-1">
                    Due: {new Date(ticket.slaDeadline).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/worker/tickets?status=ASSIGNED" className="btn btn-primary">
            View Pending Tasks
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/worker/tickets?status=IN_PROGRESS" className="btn btn-secondary">
            Continue Work
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card p-6"
      >
        <h3 className="font-semibold text-white mb-4">Work Guidelines</h3>
        <ul className="text-sm text-surface-400 space-y-2">
          <li>• Always take clear before and after photos of your work</li>
          <li>• Update ticket status as you progress</li>
          <li>• Prioritize tickets with critical or high priority</li>
          <li>• Contact admin if you need additional resources</li>
          <li>• Ensure proper resolution notes are added</li>
        </ul>
      </motion.div>
    </div>
  )
}
