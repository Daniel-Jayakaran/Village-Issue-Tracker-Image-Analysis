import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowRight,
  XCircle,
  Activity
} from 'lucide-react'
import api from '../../utils/api'
import { STATUS_CONFIG } from '../../utils/constants'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats')
        setStats(response.data.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const overviewCards = [
    { 
      label: 'Total Issues', 
      value: stats?.overview?.total || 0, 
      icon: FileText, 
      gradient: 'from-primary-500 to-primary-600',
      subtext: `${stats?.today?.created || 0} today`
    },
    { 
      label: 'Pending Review', 
      value: stats?.overview?.pending || 0, 
      icon: Clock, 
      gradient: 'from-amber-500 to-orange-500',
      subtext: 'Awaiting verification'
    },
    { 
      label: 'In Progress', 
      value: stats?.overview?.inProgress || 0, 
      icon: Activity, 
      gradient: 'from-violet-500 to-purple-500',
      subtext: 'Being processed'
    },
    { 
      label: 'Resolved', 
      value: stats?.overview?.closed || 0, 
      icon: CheckCircle, 
      gradient: 'from-emerald-500 to-green-500',
      subtext: `${stats?.today?.closed || 0} closed today`
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-surface-400">
          Overview of all village issues and system performance
        </p>
      </motion.div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card card-hover p-6"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-display font-bold text-white mb-1">
              {loading ? '-' : card.value}
            </p>
            <p className="text-sm font-medium text-surface-300">{card.label}</p>
            <p className="text-xs text-surface-500 mt-1">{card.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* SLA & Worker stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            SLA Overview
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-2xl font-bold text-rose-400">
                {loading ? '-' : stats?.slaMetrics?.breached || 0}
              </p>
              <p className="text-sm text-surface-400">SLA Breached</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-2xl font-bold text-orange-400">
                {loading ? '-' : stats?.slaMetrics?.critical || 0}
              </p>
              <p className="text-sm text-surface-400">Critical</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-2xl font-bold text-amber-400">
                {loading ? '-' : stats?.slaMetrics?.warning || 0}
              </p>
              <p className="text-sm text-surface-400">Warning</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-2xl font-bold text-emerald-400">
                {loading ? '-' : stats?.slaMetrics?.onTrack || 0}
              </p>
              <p className="text-sm text-surface-400">On Track</p>
            </div>
          </div>
        </motion.div>

        {/* Worker Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              Worker Performance
            </h2>
            <Link 
              to="/admin/users?role=WORKER"
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              View all
            </Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <p className="text-surface-500">Loading...</p>
            ) : stats?.workerStats?.length === 0 ? (
              <p className="text-surface-500">No workers found</p>
            ) : (
              stats?.workerStats?.slice(0, 4).map((worker) => (
                <div key={worker.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {worker.name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-white">{worker.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-amber-400">{worker.activeCount} active</span>
                    <span className="text-emerald-400">{worker.completedCount} done</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Category breakdown & Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Issues by Category</h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-surface-500">Loading...</p>
            ) : (
              stats?.byCategory?.map((cat, index) => {
                const total = stats.overview?.total || 1
                const percentage = ((cat.count / total) * 100).toFixed(0)
                
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-surface-300 capitalize">
                        {cat.category.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span className="text-surface-400">{cat.count}</span>
                    </div>
                    <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link 
              to="/admin/tickets"
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              View all
            </Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <p className="text-surface-500">Loading...</p>
            ) : stats?.recentActivity?.length === 0 ? (
              <p className="text-surface-500">No recent activity</p>
            ) : (
              stats?.recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    activity.action.includes('CREATE') ? 'bg-blue-500/20 text-blue-400' :
                    activity.action.includes('CLOSE') ? 'bg-emerald-500/20 text-emerald-400' :
                    activity.action.includes('ASSIGN') ? 'bg-violet-500/20 text-violet-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-medium">{activity.performedByName}</span>
                      {' '}
                      <span className="text-surface-400">
                        {activity.action.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      {' '}
                      <span className="text-primary-400 font-mono">
                        {activity.ticketNumber}
                      </span>
                    </p>
                    <p className="text-xs text-surface-500 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap gap-4"
      >
        <Link to="/admin/tickets?status=NEW" className="btn btn-primary">
          Review New Issues
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/admin/tickets?status=RESOLVED" className="btn btn-secondary">
          Review Resolutions
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/admin/users" className="btn btn-secondary">
          Manage Users
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  )
}
