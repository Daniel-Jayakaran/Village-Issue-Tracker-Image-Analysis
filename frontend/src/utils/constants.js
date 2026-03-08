// Ticket statuses
export const STATUSES = {
  NEW: 'NEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED'
}

// Status display configuration
export const STATUS_CONFIG = {
  NEW: { label: 'New', color: 'blue', badge: 'badge-new' },
  VERIFIED: { label: 'Verified', color: 'cyan', badge: 'badge-verified' },
  REJECTED: { label: 'Rejected', color: 'rose', badge: 'badge-rejected' },
  ASSIGNED: { label: 'Assigned', color: 'violet', badge: 'badge-assigned' },
  IN_PROGRESS: { label: 'In Progress', color: 'amber', badge: 'badge-in-progress' },
  RESOLVED: { label: 'Resolved', color: 'emerald', badge: 'badge-resolved' },
  UNDER_REVIEW: { label: 'Under Review', color: 'violet', badge: 'badge-assigned' },
  CLOSED: { label: 'Closed', color: 'surface', badge: 'badge-closed' },
  REOPENED: { label: 'Reopened', color: 'orange', badge: 'badge-reopened' }
}

// Categories
export const CATEGORIES = [
  { value: 'ROAD_DAMAGE', label: 'Road Damage', icon: '🛤️' },
  { value: 'WATER_SUPPLY', label: 'Water Supply', icon: '💧' },
  { value: 'ELECTRICITY', label: 'Electricity', icon: '⚡' },
  { value: 'SANITATION', label: 'Sanitation', icon: '🧹' },
  { value: 'STREET_LIGHTS', label: 'Street Lights', icon: '💡' },
  { value: 'DRAINAGE', label: 'Drainage', icon: '🌊' },
  { value: 'PUBLIC_PROPERTY', label: 'Public Property', icon: '🏛️' },
  { value: 'ENVIRONMENTAL', label: 'Environmental', icon: '🌳' },
  { value: 'OTHER', label: 'Other', icon: '📋' }
]

// Severities
export const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'emerald' },
  { value: 'MEDIUM', label: 'Medium', color: 'amber' },
  { value: 'HIGH', label: 'High', color: 'orange' },
  { value: 'CRITICAL', label: 'Critical', color: 'rose' }
]

// Priorities
export const PRIORITIES = [
  { value: 'P1', label: 'P1 - Critical', color: 'rose', hours: 24 },
  { value: 'P2', label: 'P2 - High', color: 'amber', hours: 48 },
  { value: 'P3', label: 'P3 - Normal', color: 'emerald', hours: 72 }
]

// User roles
export const ROLES = {
  CITIZEN: 'CITIZEN',
  ADMIN: 'ADMIN',
  WORKER: 'WORKER'
}

// Role display names
export const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  ADMIN: 'Administrator',
  WORKER: 'Field Worker'
}

// SLA Status configurations
export const SLA_STATUS_CONFIG = {
  BREACHED: { label: 'SLA Breached', class: 'sla-breached' },
  CRITICAL: { label: 'Critical', class: 'sla-critical' },
  WARNING: { label: 'Warning', class: 'sla-warning' },
  ON_TRACK: { label: 'On Track', class: 'sla-on-track' },
  NOT_SET: { label: 'Not Set', class: 'badge-closed' }
}
