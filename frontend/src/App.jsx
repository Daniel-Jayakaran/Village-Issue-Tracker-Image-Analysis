import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Dashboard Pages
import CitizenDashboard from './pages/citizen/Dashboard'
import SubmitIssue from './pages/citizen/SubmitIssue'
import MyTickets from './pages/citizen/MyTickets'
import TicketDetail from './pages/shared/TicketDetail'
import Profile from './pages/shared/Profile'

import AdminDashboard from './pages/admin/Dashboard'
import AllTickets from './pages/admin/AllTickets'
import ManageUsers from './pages/admin/ManageUsers'

import WorkerDashboard from './pages/worker/Dashboard'
import AssignedTickets from './pages/worker/AssignedTickets'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardPaths = {
      CITIZEN: '/citizen',
      ADMIN: '/admin',
      WORKER: '/worker'
    }
    return <Navigate to={dashboardPaths[user?.role] || '/login'} replace />
  }

  return children
}

// Public Route (redirect if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated) {
    const dashboardPaths = {
      CITIZEN: '/citizen',
      ADMIN: '/admin',
      WORKER: '/worker'
    }
    return <Navigate to={dashboardPaths[user?.role] || '/'} replace />
  }

  return children
}

function App() {
  const { restoreSession } = useAuthStore()

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route element={<AuthLayout />}>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
      </Route>

      {/* Citizen Routes */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute allowedRoles={['CITIZEN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CitizenDashboard />} />
        <Route path="submit" element={<SubmitIssue />} />
        <Route path="tickets" element={<MyTickets />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="tickets" element={<AllTickets />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Worker Routes */}
      <Route
        path="/worker"
        element={
          <ProtectedRoute allowedRoles={['WORKER']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<WorkerDashboard />} />
        <Route path="tickets" element={<AssignedTickets />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
