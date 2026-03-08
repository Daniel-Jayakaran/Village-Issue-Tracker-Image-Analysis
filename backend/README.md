# VITS Backend - Village Issue Tracking System

Enterprise-grade REST API backend for the Village Issue Tracking System built with Node.js, Express, and MongoDB.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)

## 🎯 Overview

The VITS Backend provides a robust REST API that handles:
- User authentication and authorization (JWT-based)
- Role-based access control (RBAC) for Citizens, Admins, and Workers
- Ticket lifecycle management with strict status workflows
- File upload handling for issue photos and resolution proofs
- Real-time notifications system
- Audit logging for compliance and tracking
- SLA enforcement and breach detection

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM (Object Document Mapper) |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Multer** | File upload handling |
| **express-validator** | Request validation |
| **UUID** | Unique identifier generation |

## 🏗 Architecture

```
backend/
├── src/
│   ├── config/
│   │   └── index.js          # Configuration & environment variables
│   ├── database/
│   │   ├── connection.js     # MongoDB connection handler
│   │   └── seed.js           # Database seeding script
│   ├── middleware/
│   │   └── auth.js           # Authentication & authorization middleware
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Ticket.js         # Ticket model
│   │   ├── TicketImage.js    # Ticket images model
│   │   ├── TicketComment.js  # Comments model
│   │   ├── Notification.js   # Notifications model
│   │   ├── AuditLog.js       # Audit logging model
│   │   ├── Counter.js        # Auto-increment counter
│   │   └── index.js          # Model exports
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── tickets.js        # Ticket management routes
│   │   ├── users.js          # User management routes
│   │   ├── dashboard.js      # Dashboard analytics routes
│   │   └── notifications.js  # Notification routes
│   ├── utils/
│   │   ├── auditLog.js       # Audit logging utility
│   │   ├── errorHandler.js   # Centralized error handling
│   │   ├── fileUpload.js     # File upload configuration
│   │   ├── notifications.js  # Notification helpers
│   │   ├── sla.js            # SLA calculation utilities
│   │   └── ticketGenerator.js # Ticket number generator
│   └── server.js             # Application entry point
├── uploads/                   # File upload directory
│   ├── tickets/              # Issue photos
│   ├── proofs/               # Resolution proofs
│   └── temp/                 # Temporary uploads
└── package.json
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new citizen | Public |
| POST | `/login` | User login | Public |
| GET | `/me` | Get current user | Authenticated |
| PUT | `/profile` | Update profile | Authenticated |
| PUT | `/change-password` | Change password | Authenticated |

### Tickets (`/api/tickets`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Create new ticket | Citizen |
| GET | `/` | Get all tickets | Admin |
| GET | `/my` | Get user's tickets | Citizen |
| GET | `/:id` | Get ticket details | Owner/Admin/Assigned Worker |
| PUT | `/:id` | Update ticket | Owner (NEW status only) |
| POST | `/:id/verify` | Verify/Reject ticket | Admin |
| POST | `/:id/assign` | Assign worker | Admin |
| POST | `/:id/start` | Start work | Assigned Worker |
| POST | `/:id/resolve` | Submit resolution | Assigned Worker |
| POST | `/:id/review` | Approve/Reject resolution | Admin |
| POST | `/:id/close` | Close ticket | Admin |
| POST | `/:id/reopen` | Reopen ticket | Citizen |

### Users (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all users | Admin |
| GET | `/workers` | Get available workers | Admin |
| POST | `/` | Create new user | Admin |
| PUT | `/:id` | Update user | Admin |
| PUT | `/:id/toggle-status` | Activate/Deactivate user | Admin |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/stats` | Admin dashboard stats | Admin |
| GET | `/citizen-stats` | Citizen dashboard stats | Citizen |
| GET | `/worker-stats` | Worker dashboard stats | Worker |

### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get user notifications | Authenticated |
| GET | `/unread-count` | Get unread count | Authenticated |
| PUT | `/:id/read` | Mark as read | Authenticated |
| PUT | `/read-all` | Mark all as read | Authenticated |

## 📊 Database Schema

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed),
  name: String (required),
  role: Enum ['CITIZEN', 'ADMIN', 'WORKER'],
  phone: String,
  village: String,
  district: String,
  state: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Ticket Model
```javascript
{
  ticketNumber: String (unique, auto-generated),
  description: String (required),
  category: Enum ['ROAD', 'WATER', 'ELECTRICITY', ...],
  severity: Enum ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  status: Enum ['NEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'UNDER_REVIEW', 'CLOSED', 'REOPENED'],
  location: String,
  landmark: String,
  priority: Enum ['P1', 'P2', 'P3'],
  createdBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User),
  verifiedBy: ObjectId (ref: User),
  slaDeadline: Date,
  slaBreach: Boolean,
  resolutionNotes: String,
  rejectionReason: String,
  closedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  userId: ObjectId,
  role: String,
  iat: Number,
  exp: Number
}
```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **CITIZEN** | Create tickets, view own tickets, reopen closed tickets |
| **ADMIN** | Verify tickets, assign workers, manage users, view all data |
| **WORKER** | View assigned tickets, start work, submit resolution |

## 📦 Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

## ⚙️ Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/vits

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
```

## 🚀 Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start

# Seed database with demo data
npm run seed
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "message": "Error description",
  "correlationId": "unique-request-id"
}
```

## 🔍 Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Account deactivated |
| `AUTH_003` | Invalid current password |
| `VALIDATION_ERR` | Request validation failed |
| `TICKET_001` | Ticket not found |
| `TICKET_002` | Unauthorized access |
| `USER_001` | User already exists |
| `USER_002` | User not found |

## 📄 License

This project is part of the Village Issue Tracking System - Final Year Project.
