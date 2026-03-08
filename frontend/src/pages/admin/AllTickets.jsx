import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Filter, 
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  AlertTriangle
} from 'lucide-react'
import api from '../../utils/api'
import { STATUS_CONFIG, CATEGORIES, PRIORITIES } from '../../utils/constants'

export default function AllTickets() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    priority: searchParams.get('priority') || '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(!!searchParams.get('status'))

  const fetchTickets = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)

      const response = await api.get(`/tickets?${params}`)
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
  }, [filters.status, filters.category, filters.priority])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchTickets()
  }

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
            All Issues
          </h1>
          <p className="text-surface-400 mt-1">
            {pagination.total} issue{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input pl-10 w-64"
            />
          </form>
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
          className="card p-4"
        >
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[180px]">
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
            <div className="min-w-[180px]">
              <label className="label">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="label">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="input"
              >
                <option value="">All Priorities</option>
                {PRIORITIES.map((pri) => (
                  <option key={pri.value} value={pri.value}>{pri.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ status: '', category: '', priority: '', search: '' })
                  setSearchParams({})
                }}
                className="btn btn-ghost"
              >
                Clear All
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tickets table */}
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
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      SLA
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {tickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-surface-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link 
                          to={`/admin/tickets/${ticket.id}`}
                          className="font-mono text-sm text-primary-400 hover:text-primary-300"
                        >
                          {ticket.ticketNumber}
                        </Link>
                        <p className="text-xs text-surface-500 mt-1 truncate max-w-[200px]">
                          {ticket.description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-surface-300 capitalize">
                          {getCategoryLabel(ticket.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${STATUS_CONFIG[ticket.status]?.badge}`}>
                          {STATUS_CONFIG[ticket.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {ticket.priority ? (
                          <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                            {ticket.priority}
                          </span>
                        ) : (
                          <span className="text-surface-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.slaStatus?.status && ticket.slaStatus.status !== 'NOT_SET' ? (
                          <span className={`badge ${
                            ticket.slaStatus.status === 'BREACHED' ? 'sla-breached' :
                            ticket.slaStatus.status === 'CRITICAL' ? 'sla-critical' :
                            ticket.slaStatus.status === 'WARNING' ? 'sla-warning' :
                            'sla-on-track'
                          }`}>
                            {ticket.slaStatus.status}
                          </span>
                        ) : (
                          <span className="text-surface-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-surface-300">
                          {ticket.assignedToName || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-400">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="lg:hidden divide-y divide-surface-800">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/admin/tickets/${ticket.id}`}
                  className="block p-4 hover:bg-surface-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-primary-400">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`badge ${STATUS_CONFIG[ticket.status]?.badge}`}>
                      {STATUS_CONFIG[ticket.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm text-surface-300 capitalize mb-2">
                    {getCategoryLabel(ticket.category)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-surface-500">
                    {ticket.priority && (
                      <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                        {ticket.priority}
                      </span>
                    )}
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-surface-800">
            <p className="text-sm text-surface-500">
              Showing {((pagination.page - 1) * 15) + 1} to {Math.min(pagination.page * 15, pagination.total)} of {pagination.total}
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
