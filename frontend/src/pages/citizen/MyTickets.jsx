import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Filter, 
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin
} from 'lucide-react'
import api from '../../utils/api'
import { STATUS_CONFIG, CATEGORIES, STATUSES } from '../../utils/constants'

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchTickets = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (filters.status) params.append('status', filters.status)

      const response = await api.get(`/tickets/my?${params}`)
      setTickets(response.data.data.tickets)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [filters.status])

  const getCategoryLabel = (value) => {
    return CATEGORIES.find(c => c.value === value)?.label || value
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
            My Issues
          </h1>
          <p className="text-surface-400 mt-1">
            {pagination.total} issue{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card p-4"
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input"
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tickets list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center text-surface-500">
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <p className="text-surface-400">No issues found</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-800">
            {tickets.map((ticket, index) => (
              <Link
                key={ticket.id}
                to={`/citizen/tickets/${ticket.id}`}
                className="block p-4 lg:p-6 hover:bg-surface-800/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Ticket info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-primary-400">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`badge ${STATUS_CONFIG[ticket.status]?.badge}`}>
                        {STATUS_CONFIG[ticket.status]?.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-white mb-1 capitalize">
                      {getCategoryLabel(ticket.category)}
                    </h3>
                    <p className="text-sm text-surface-400 line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 lg:gap-1 text-sm text-surface-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate max-w-[150px]">{ticket.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* SLA indicator */}
                {ticket.slaStatus && ticket.slaStatus.status !== 'NOT_SET' && (
                  <div className="mt-3 pt-3 border-t border-surface-800">
                    <span className={`badge ${
                      ticket.slaStatus.status === 'BREACHED' ? 'sla-breached' :
                      ticket.slaStatus.status === 'CRITICAL' ? 'sla-critical' :
                      ticket.slaStatus.status === 'WARNING' ? 'sla-warning' :
                      'sla-on-track'
                    }`}>
                      {ticket.slaStatus.message}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-surface-800">
            <p className="text-sm text-surface-500">
              Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTickets(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-secondary p-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-surface-400 px-3">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => fetchTickets(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn btn-secondary p-2 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
