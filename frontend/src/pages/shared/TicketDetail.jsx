import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  User, 
  FileText,
  CheckCircle,
  XCircle,
  Play,
  Upload,
  RefreshCcw,
  AlertTriangle,
  Image as ImageIcon,
  Loader2,
  X,
  MessageSquare,
  History,
  UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import { STATUS_CONFIG, CATEGORIES, PRIORITIES, ROLES } from '../../utils/constants'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [ticket, setTicket] = useState(null)
  const [images, setImages] = useState([])
  const [comments, setComments] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [allowedActions, setAllowedActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Modals
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`)
      setTicket(response.data.data.ticket)
      setImages(response.data.data.images || [])
      setComments(response.data.data.comments || [])
      setAuditLogs(response.data.data.auditLogs || [])
      setAllowedActions(response.data.data.allowedActions || [])
    } catch (error) {
      toast.error('Failed to load ticket details')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [id])

  const getCategoryLabel = (value) => {
    return CATEGORIES.find(c => c.value === value)?.label || value
  }

  // Action handlers
  const handleStartWork = async () => {
    setActionLoading(true)
    try {
      await api.post(`/tickets/${id}/start`)
      toast.success('Work started successfully')
      fetchTicket()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start work')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return
    
    setActionLoading(true)
    try {
      await api.post(`/tickets/${id}/close`)
      toast.success('Ticket closed successfully')
      fetchTicket()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close ticket')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-surface-600 mx-auto mb-4" />
        <p className="text-surface-400">Ticket not found</p>
      </div>
    )
  }

  const beforeImages = images.filter(img => img.imageType === 'PROOF_BEFORE')
  const afterImages = images.filter(img => img.imageType === 'PROOF_AFTER')

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-surface-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-bold text-white">
              {ticket.ticketNumber}
            </h1>
            <span className={`badge ${STATUS_CONFIG[ticket.status]?.badge}`}>
              {STATUS_CONFIG[ticket.status]?.label}
            </span>
            {ticket.priority && (
              <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                {ticket.priority}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons based on role and allowed actions */}
        <div className="flex flex-wrap gap-3">
          {/* Citizen actions */}
          {allowedActions.includes('EDIT') && (
            <button className="btn btn-secondary">
              <FileText className="w-4 h-4" />
              Edit
            </button>
          )}
          {allowedActions.includes('REOPEN') && (
            <button 
              onClick={() => setShowReopenModal(true)}
              className="btn btn-warning"
            >
              <RefreshCcw className="w-4 h-4" />
              Reopen
            </button>
          )}

          {/* Admin actions */}
          {allowedActions.includes('VERIFY') && (
            <button 
              onClick={() => setShowVerifyModal(true)}
              className="btn btn-success"
            >
              <CheckCircle className="w-4 h-4" />
              Verify
            </button>
          )}
          {allowedActions.includes('REJECT') && (
            <button 
              onClick={() => setShowVerifyModal(true)}
              className="btn btn-danger"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          )}
          {allowedActions.includes('ASSIGN') && (
            <button 
              onClick={() => setShowAssignModal(true)}
              className="btn btn-primary"
            >
              <UserCheck className="w-4 h-4" />
              Assign Worker
            </button>
          )}
          {allowedActions.includes('APPROVE_RESOLUTION') && (
            <button 
              onClick={() => setShowReviewModal(true)}
              className="btn btn-success"
            >
              <CheckCircle className="w-4 h-4" />
              Review Resolution
            </button>
          )}
          {allowedActions.includes('CLOSE') && (
            <button 
              onClick={handleCloseTicket}
              disabled={actionLoading}
              className="btn btn-success"
            >
              <CheckCircle className="w-4 h-4" />
              Close Ticket
            </button>
          )}

          {/* Worker actions */}
          {allowedActions.includes('START_WORK') && (
            <button 
              onClick={handleStartWork}
              disabled={actionLoading}
              className="btn btn-primary"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Start Work
            </button>
          )}
          {allowedActions.includes('RESOLVE') && (
            <button 
              onClick={() => setShowResolveModal(true)}
              className="btn btn-success"
            >
              <Upload className="w-4 h-4" />
              Upload Proof & Resolve
            </button>
          )}
        </div>
      </motion.div>

      {/* SLA Warning */}
      {ticket.slaStatus?.status && ['BREACHED', 'CRITICAL', 'WARNING'].includes(ticket.slaStatus.status) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 ${
            ticket.slaStatus.status === 'BREACHED' ? 'bg-rose-500/10 border border-rose-500/20' :
            ticket.slaStatus.status === 'CRITICAL' ? 'bg-orange-500/10 border border-orange-500/20' :
            'bg-amber-500/10 border border-amber-500/20'
          }`}
        >
          <AlertTriangle className={`w-5 h-5 ${
            ticket.slaStatus.status === 'BREACHED' ? 'text-rose-400' :
            ticket.slaStatus.status === 'CRITICAL' ? 'text-orange-400' :
            'text-amber-400'
          }`} />
          <div>
            <p className={`font-medium ${
              ticket.slaStatus.status === 'BREACHED' ? 'text-rose-400' :
              ticket.slaStatus.status === 'CRITICAL' ? 'text-orange-400' :
              'text-amber-400'
            }`}>
              {ticket.slaStatus.status === 'BREACHED' ? 'SLA Breached' : 
               ticket.slaStatus.status === 'CRITICAL' ? 'Critical SLA Warning' : 'SLA Warning'}
            </p>
            <p className="text-sm text-surface-400">{ticket.slaStatus.message}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Issue Details</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-surface-500 mb-1">Category</p>
                <p className="text-white capitalize">{getCategoryLabel(ticket.category)}</p>
              </div>
              
              <div>
                <p className="text-sm text-surface-500 mb-1">Description</p>
                <p className="text-surface-300 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-surface-500 mb-1">Severity</p>
                  <p className="text-white">{ticket.severity}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500 mb-1">Location</p>
                  <p className="text-white flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary-400" />
                    {ticket.location}
                  </p>
                </div>
              </div>

              {ticket.landmark && (
                <div>
                  <p className="text-sm text-surface-500 mb-1">Landmark</p>
                  <p className="text-surface-300">{ticket.landmark}</p>
                </div>
              )}

              {ticket.resolutionNotes && (
                <div className="pt-4 border-t border-surface-800">
                  <p className="text-sm text-surface-500 mb-1">Resolution Notes</p>
                  <p className="text-emerald-400">{ticket.resolutionNotes}</p>
                </div>
              )}

              {ticket.rejectionReason && (
                <div className="pt-4 border-t border-surface-800">
                  <p className="text-sm text-surface-500 mb-1">Rejection Reason</p>
                  <p className="text-rose-400">{ticket.rejectionReason}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Photos Section - Side by Side */}
          {(beforeImages.length > 0 || afterImages.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Before Images */}
              {beforeImages.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-400" />
                    Issue Photos
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {beforeImages.map((img) => (
                      <div
                        key={img.id || img._id}
                        onClick={() => setSelectedImage(`/uploads/${img.filePath}`)}
                        className="aspect-video rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-primary-500 transition-all"
                      >
                        <img
                          src={`/uploads/${img.filePath}`}
                          alt="Issue proof"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* After Images (Resolution proof) */}
              {afterImages.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Resolution Photos
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {afterImages.map((img) => (
                      <div
                        key={img.id || img._id}
                        onClick={() => setSelectedImage(`/uploads/${img.filePath}`)}
                        className="aspect-video rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-emerald-500 transition-all"
                      >
                        <img
                          src={`/uploads/${img.filePath}`}
                          alt="Resolution proof"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Audit Log (Admin only) */}
          {user?.role === ROLES.ADMIN && auditLogs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-violet-400" />
                Audit Trail
              </h2>
              <div className="space-y-3">
                {auditLogs.map((log, index) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                      </div>
                      {index < auditLogs.length - 1 && (
                        <div className="w-0.5 flex-1 bg-surface-800 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-white">
                        <span className="font-medium">{log.performedByName}</span>
                        {' '}
                        <span className="text-surface-400">
                          {log.action.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </p>
                      {log.oldStatus && log.newStatus && log.oldStatus !== log.newStatus && (
                        <p className="text-xs text-surface-500 mt-1">
                          {log.oldStatus} → {log.newStatus}
                        </p>
                      )}
                      {log.remarks && (
                        <p className="text-xs text-surface-400 mt-1 italic">
                          "{log.remarks}"
                        </p>
                      )}
                      <p className="text-xs text-surface-600 mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-surface-400" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Reported by</p>
                  <p className="text-sm text-white">{ticket.createdByName}</p>
                </div>
              </div>

              {ticket.assignedToName && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">Assigned to</p>
                    <p className="text-sm text-white">{ticket.assignedToName}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-surface-400" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Created</p>
                  <p className="text-sm text-white">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {ticket.slaDeadline && (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    ticket.slaBreach ? 'bg-rose-500/20' : 'bg-amber-500/20'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      ticket.slaBreach ? 'text-rose-400' : 'text-amber-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">SLA Deadline</p>
                    <p className={`text-sm ${ticket.slaBreach ? 'text-rose-400' : 'text-white'}`}>
                      {new Date(ticket.slaDeadline).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {ticket.closedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">Closed</p>
                    <p className="text-sm text-white">
                      {new Date(ticket.closedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showVerifyModal && (
          <VerifyModal
            ticketId={id}
            onClose={() => setShowVerifyModal(false)}
            onSuccess={() => {
              setShowVerifyModal(false)
              fetchTicket()
            }}
          />
        )}

        {showAssignModal && (
          <AssignModal
            ticketId={id}
            onClose={() => setShowAssignModal(false)}
            onSuccess={() => {
              setShowAssignModal(false)
              fetchTicket()
            }}
          />
        )}

        {showResolveModal && (
          <ResolveModal
            ticketId={id}
            onClose={() => setShowResolveModal(false)}
            onSuccess={() => {
              setShowResolveModal(false)
              fetchTicket()
            }}
          />
        )}

        {showReopenModal && (
          <ReopenModal
            ticketId={id}
            onClose={() => setShowReopenModal(false)}
            onSuccess={() => {
              setShowReopenModal(false)
              fetchTicket()
            }}
          />
        )}

        {showReviewModal && (
          <ReviewModal
            ticketId={id}
            onClose={() => setShowReviewModal(false)}
            onSuccess={() => {
              setShowReviewModal(false)
              fetchTicket()
            }}
          />
        )}

        {selectedImage && (
          <ImageModal
            src={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Verify Modal
function VerifyModal({ ticketId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [decision, setDecision] = useState('VALID')
  const [remarks, setRemarks] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post(`/tickets/${ticketId}/verify`, { decision, remarks })
      toast.success(decision === 'VALID' ? 'Ticket verified' : 'Ticket rejected')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2 className="text-xl font-semibold text-white mb-6">Verify Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Decision</label>
          <div className="flex gap-3">
            {['VALID', 'INVALID', 'DUPLICATE'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDecision(d)}
                className={`flex-1 py-2 px-4 rounded-xl border transition-all ${
                  decision === d
                    ? d === 'VALID' 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-surface-800 border-surface-700 text-surface-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="input resize-none"
            rows={3}
            placeholder="Add verification notes..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// Assign Modal
function AssignModal({ ticketId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [workers, setWorkers] = useState([])
  const [formData, setFormData] = useState({
    workerId: '',
    priority: 'P2',
    remarks: ''
  })

  useEffect(() => {
    api.get('/users/workers').then(res => {
      setWorkers(res.data.data.workers)
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.workerId) {
      toast.error('Please select a worker')
      return
    }

    setLoading(true)
    try {
      await api.post(`/tickets/${ticketId}/assign`, formData)
      toast.success('Worker assigned successfully')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign worker')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2 className="text-xl font-semibold text-white mb-6">Assign Worker</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Select Worker</label>
          <select
            value={formData.workerId}
            onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
            className="input"
            required
          >
            <option value="">Choose a worker...</option>
            {workers.map((w) => (
              <option key={w.id || w._id} value={w.id || w._id}>
                {w.name} ({w.activeTickets} active tasks)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Priority</label>
          <div className="flex gap-3">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setFormData({ ...formData, priority: p.value })}
                className={`flex-1 py-2 px-4 rounded-xl border transition-all ${
                  formData.priority === p.value
                    ? `bg-${p.color}-500/20 border-${p.color}-500 text-${p.color}-400`
                    : 'bg-surface-800 border-surface-700 text-surface-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Remarks</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            className="input resize-none"
            rows={2}
            placeholder="Instructions for worker..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// Resolve Modal
function ResolveModal({ ticketId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [images, setImages] = useState([])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setImages([...images, ...newImages])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (images.length === 0) {
      toast.error('Please upload at least one proof image')
      return
    }
    if (resolutionNotes.length < 10) {
      toast.error('Resolution notes must be at least 10 characters')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('resolutionNotes', resolutionNotes)
      images.forEach(img => formData.append('proofImages', img.file))

      await api.post(`/tickets/${ticketId}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Ticket resolved successfully')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resolve')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2 className="text-xl font-semibold text-white mb-6">Resolve Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Resolution Notes *</label>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            className="input resize-none"
            rows={3}
            placeholder="Describe what was done to resolve the issue..."
            required
          />
        </div>

        <div>
          <label className="label">Proof Images *</label>
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-surface-700 rounded-xl hover:border-primary-500/50 cursor-pointer transition-colors">
            <Upload className="w-6 h-6 text-surface-500 mb-2" />
            <p className="text-sm text-surface-400">Click to upload proof images</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((img, i) => (
                <img key={i} src={img.preview} className="w-full h-20 object-cover rounded-lg" />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-success flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Resolution'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// Reopen Modal
function ReopenModal({ ticketId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post(`/tickets/${ticketId}/reopen`, { reason })
      toast.success('Ticket reopened successfully')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reopen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2 className="text-xl font-semibold text-white mb-6">Reopen Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Reason for Reopening *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input resize-none"
            rows={4}
            placeholder="Explain why this ticket needs to be reopened..."
            required
            minLength={10}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-warning flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reopen Ticket'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// Review Modal
function ReviewModal({ ticketId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [decision, setDecision] = useState('APPROVE')
  const [remarks, setRemarks] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post(`/tickets/${ticketId}/review`, { decision, remarks })
      toast.success(decision === 'APPROVE' ? 'Resolution approved' : 'Resolution rejected')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2 className="text-xl font-semibold text-white mb-6">Review Resolution</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Decision</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDecision('APPROVE')}
              className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                decision === 'APPROVE'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-surface-800 border-surface-700 text-surface-400'
              }`}
            >
              <CheckCircle className="w-5 h-5 mx-auto mb-1" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => setDecision('REJECT')}
              className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                decision === 'REJECT'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-surface-800 border-surface-700 text-surface-400'
              }`}
            >
              <XCircle className="w-5 h-5 mx-auto mb-1" />
              Reject
            </button>
          </div>
        </div>

        <div>
          <label className="label">Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="input resize-none"
            rows={3}
            placeholder={decision === 'REJECT' ? 'Reason for rejection...' : 'Any additional notes...'}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className={`btn flex-1 ${decision === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : decision === 'APPROVE' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// Modal Wrapper
function ModalWrapper({ children, onClose }) {
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
        className="w-full max-w-md card p-6"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// Image Modal
function ImageModal({ src, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
      >
        <X className="w-6 h-6" />
      </button>
      <motion.img
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        src={src}
        alt="Full size"
        className="max-w-full max-h-[90vh] rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  )
}
