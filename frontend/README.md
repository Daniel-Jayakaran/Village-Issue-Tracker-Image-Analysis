# VITS Frontend - Village Issue Tracking System

Modern, responsive React frontend for the Village Issue Tracking System built with Vite, React, and Tailwind CSS.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Routing](#routing)
- [Installation](#installation)
- [Development](#development)
- [Build](#build)

## 🎯 Overview

The VITS Frontend provides an intuitive, role-based user interface for:
- **Citizens**: Report issues, track ticket status, view resolution
- **Admins**: Verify tickets, assign workers, manage users, view analytics
- **Workers**: View assignments, update progress, submit resolution proofs

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **React Router v6** | Client-side routing |
| **Zustand** | State management |
| **Framer Motion** | Animations |
| **Axios** | HTTP client |
| **React Hot Toast** | Toast notifications |
| **Lucide React** | Icon library |

## 📁 Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── layouts/
│   │   ├── AuthLayout.jsx       # Layout for login/register pages
│   │   └── DashboardLayout.jsx  # Layout for authenticated pages
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx        # Login page
│   │   │   └── Register.jsx     # Registration page
│   │   ├── citizen/
│   │   │   ├── Dashboard.jsx    # Citizen dashboard
│   │   │   ├── SubmitIssue.jsx  # Issue submission form
│   │   │   └── MyTickets.jsx    # Citizen's ticket list
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx    # Admin dashboard with analytics
│   │   │   ├── AllTickets.jsx   # All tickets management
│   │   │   └── ManageUsers.jsx  # User management
│   │   ├── worker/
│   │   │   ├── Dashboard.jsx    # Worker dashboard
│   │   │   └── AssignedTickets.jsx # Worker's assignments
│   │   └── shared/
│   │       ├── TicketDetail.jsx # Ticket detail view
│   │       └── Profile.jsx      # User profile page
│   ├── store/
│   │   └── authStore.js         # Authentication state
│   ├── utils/
│   │   ├── api.js               # Axios instance configuration
│   │   └── constants.js         # App constants
│   ├── App.jsx                  # Root component with routing
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Global styles & Tailwind imports
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## ✨ Features

### For Citizens
- 📝 Submit new issues with photos
- 📊 Track ticket status in real-time
- 🔔 Receive notifications on updates
- 🔄 Reopen resolved tickets if unsatisfied
- 👤 Manage profile settings

### For Admins
- ✅ Verify/Reject submitted tickets
- 👷 Assign workers to tickets
- 📈 View dashboard analytics
- 👥 Manage all users
- 📋 Review resolution submissions

### For Workers
- 📋 View assigned tickets
- ▶️ Start work on assignments
- 📸 Upload resolution proof photos
- ✅ Submit resolution notes

## 🧩 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.jsx                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    React Router                        │  │
│  │  ┌─────────────┐  ┌─────────────────────────────────┐ │  │
│  │  │ AuthLayout  │  │      DashboardLayout            │ │  │
│  │  │  - Login    │  │  ┌───────────┐ ┌─────────────┐  │ │  │
│  │  │  - Register │  │  │  Sidebar  │ │   Content   │  │ │  │
│  │  └─────────────┘  │  │  - Nav    │ │  - Outlet   │  │ │  │
│  │                   │  │  - User   │ │  (Pages)    │  │ │  │
│  │                   │  └───────────┘ └─────────────┘  │ │  │
│  │                   │  ┌─────────────────────────────┐ │ │  │
│  │                   │  │         Top Bar             │ │ │  │
│  │                   │  │  - Notifications - Profile  │ │ │  │
│  │                   │  └─────────────────────────────┘ │ │  │
│  │                   └─────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🗄 State Management

Using **Zustand** for lightweight, scalable state management:

```javascript
// authStore.js
{
  user: Object | null,
  token: String | null,
  isAuthenticated: Boolean,
  isLoading: Boolean,
  error: String | null,
  
  // Actions
  login: (email, password) => Promise,
  register: (userData) => Promise,
  logout: () => void,
  setUser: (userData) => void,
  restoreSession: () => void,
  hasRole: (role) => Boolean
}
```

### Persistence
Auth state is persisted to `localStorage` using Zustand's persist middleware:
```javascript
{
  name: 'vits-auth',
  partialize: (state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated
  })
}
```

## 🛤 Routing

### Route Structure

```
/                       → Redirect to /login
├── /login             → Login page (Public)
├── /register          → Registration page (Public)
│
├── /citizen           → Citizen routes (Protected)
│   ├── /              → Citizen Dashboard
│   ├── /submit        → Submit Issue
│   ├── /tickets       → My Tickets
│   ├── /tickets/:id   → Ticket Detail
│   └── /profile       → User Profile
│
├── /admin             → Admin routes (Protected)
│   ├── /              → Admin Dashboard
│   ├── /tickets       → All Tickets
│   ├── /tickets/:id   → Ticket Detail
│   ├── /users         → Manage Users
│   └── /profile       → User Profile
│
└── /worker            → Worker routes (Protected)
    ├── /              → Worker Dashboard
    ├── /tickets       → Assigned Tickets
    ├── /tickets/:id   → Ticket Detail
    └── /profile       → User Profile
```

### Protected Routes
```jsx
<ProtectedRoute allowedRoles={['CITIZEN']}>
  <DashboardLayout />
</ProtectedRoute>
```

## 🎨 Styling

### Tailwind Configuration

Custom color palette with dark theme:

```javascript
colors: {
  primary: {
    50: '#eef9ff',
    500: '#0ea5e9',  // Main brand color
    600: '#0284c7',
    // ...
  },
  surface: {
    50: '#f8fafc',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',  // Background
  }
}
```

### Custom Components

```css
/* Buttons */
.btn { @apply inline-flex items-center justify-center gap-2 ... }
.btn-primary { @apply bg-primary-500 hover:bg-primary-600 ... }
.btn-secondary { @apply bg-surface-800 hover:bg-surface-700 ... }

/* Forms */
.input { @apply w-full px-4 py-3 bg-surface-800 border ... }
.label { @apply block text-sm font-medium text-surface-300 ... }

/* Cards */
.card { @apply bg-surface-900/50 backdrop-blur-xl border ... }
.badge { @apply inline-flex items-center gap-1 px-2.5 py-1 ... }
```

## 📦 Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Server runs at http://localhost:5173
```

### Hot Module Replacement (HMR)
Vite provides instant HMR for rapid development. Changes reflect immediately without full page reload.

## 🏗 Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Build Output
```
dist/
├── assets/
│   ├── index-[hash].css
│   └── index-[hash].js
└── index.html
```

## 🔧 Configuration Files

### vite.config.js
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000'
    }
  }
})
```

### tailwind.config.js
- Custom color palette
- Font families (DM Sans, Space Grotesk)
- Extended animations
- Custom backdrop blur

## 📱 Responsive Design

The application is fully responsive:
- **Mobile**: Collapsible sidebar, stacked layouts
- **Tablet**: Adaptive grid layouts
- **Desktop**: Full sidebar, multi-column layouts

## 🎭 Animations

Using Framer Motion for smooth animations:
- Page transitions
- Modal animations
- List item animations
- Hover effects

## 📄 License

This project is part of the Village Issue Tracking System - Final Year Project.
