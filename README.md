# IntAI - Financial Data & Consultation Platform

> **Professional full-stack TypeScript application** for insurance & pension data aggregation with integrated video consultation booking system.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://reactjs.org/)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-1.91-red.svg)](https://tanstack.com/router)
[![Remult](https://img.shields.io/badge/Remult-3.0-green.svg)](https://remult.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)

## 🏗️ Architecture & Design

**IntAI** implements a modern **Single Source of Truth (SSOT)** architecture using **Remult** for seamless frontend-backend integration, combined with **TanStack Router** for type-safe routing and state management.

### Tech Stack Decision

```
🎯 Design Philosophy: Full-Stack TypeScript with SSOT Entities
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Frontend            │ API Layer           │ Backend             │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ React 19.1          │ Remult 3.0          │ Express.js          │
│ TanStack Router     │ TypeScript Entities │ PostgreSQL 17       │
│ TanStack Query      │ Auto-generated API  │ Cookie Sessions     │
│ Mantine UI          │ Type-safe Client    │ Docker Compose      │
│ TypeScript 5.8      │ Real-time Queries   │ Migrations          │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

### **Why TanStack + Remult?**

- **🔄 TanStack Router**: File-based routing with full TypeScript safety, automatic code-splitting, and layout nesting
- **🔄 TanStack Query**: Declarative data fetching with caching, background updates, and optimistic updates  
- **🎯 Remult**: Single source of truth - define entities once, use everywhere (frontend, backend, database)
- **📡 Real-time**: Live queries and automatic UI updates with minimal code
- **🔒 Security**: Code-based authorization rules at entity and field level

## 📁 Project Structure

```
intai/
├── 📁 src/
│   ├── 📁 shared/                    # 🎯 SSOT: Shared between frontend & backend
│   │   └── 📁 entities/              # Remult entity definitions
│   │       ├── User.ts               # User authentication & profiles
│   │       ├── Staff.ts              # Consultant/Manager/Admin roles
│   │       ├── Appointment.ts        # Meeting scheduling & management
│   │       ├── FinanceSnapshot.ts    # External data aggregation
│   │       ├── Note.ts               # Rich-text consultation notes
│   │       ├── Tag.ts                # Categorization & analytics
│   │       └── AuditEvent.ts         # Security & compliance logging
│   │
│   ├── 📁 routes/                    # 🔄 TanStack Router file-based routing
│   │   ├── __root.tsx                # Root layout & providers
│   │   ├── index.tsx                 # Landing page
│   │   ├── login/                    # Authentication flows
│   │   └── dashboard/                # Role-based dashboards
│   │
│   ├── 📁 server/                    # 🎯 Remult backend
│   │   ├── 📁 config/                # Server configuration
│   │   │   ├── database.ts           # PostgreSQL connection & entities
│   │   │   └── session.ts            # Cookie-session authentication
│   │   ├── 📁 controllers/           # Remult backend methods
│   │   │   └── AuthController.ts     # Authentication logic
│   │   ├── 📁 database/              # Database management
│   │   │   ├── migrations.ts         # Auto-generated schema migrations
│   │   │   ├── migrate.ts            # Migration runner
│   │   │   └── generate-migrations.ts # Migration generator
│   │   ├── api.ts                    # Remult API configuration
│   │   └── index.ts                  # Express server setup
│   │
│   └── 📁 hooks/                     # React hooks & utilities
│
├── 📁 database/                      # 🐘 PostgreSQL setup
│   ├── init/                         # Database initialization scripts
│   └── pgadmin-servers.json          # pgAdmin pre-configuration
│
├── 📁 docker-compose.dev.yml         # 🐳 Local development services
└── 📁 .env.example                   # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **Docker** & **Docker Compose** (for local databases)
- **Git**

### 1. Clone & Install

```bash
git clone <repository-url>
cd intai
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables (see Environment Configuration section)
nano .env
```

### 3. Start Development Services

```bash
# Start PostgreSQL, Redis, and pgAdmin
npm run docker:dev

# Wait ~30 seconds for services to be ready
# ✅ PostgreSQL: localhost:5432
# ✅ pgAdmin: http://localhost:5050 (admin@intai.dev / admin123)
# ✅ Redis: localhost:6379
# ✅ Redis Commander: http://localhost:8081 (admin / admin123)
```

### 4. Database Setup

```bash
# Generate initial migration from entities
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

### 5. Start Development Servers

```bash
# Terminal 1: Backend server
npm run dev-node

# Terminal 2: Frontend development server  
npm run dev
```

### 6. Access Application

- **🌐 Frontend**: http://localhost:5173
- **🔧 Backend API**: http://localhost:3002/api
- **📊 Admin UI**: http://localhost:3002/api/admin (development only)
- **💚 Health Check**: http://localhost:3002/health

## ⚙️ Environment Configuration

### `.env` File Setup

```bash
# Database Configuration
DATABASE_URL=postgresql://intai_user:intai_password@localhost:5432/intai_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=intai_db
DATABASE_USER=intai_user
DATABASE_PASSWORD=intai_password

# Redis Configuration  
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Session Security
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
SESSION_NAME=intai.sid
SESSION_MAX_AGE=2592000000

# Server Configuration
NODE_ENV=development
PORT=3002
API_BASE_URL=http://localhost:3002

# External API Integration (Production)
MISLAKA_API_KEY=your-mislaka-api-key
HARHABITUAH_API_KEY=your-harhabituah-api-key  
GEMELNET_API_KEY=your-gemelnet-api-key

# Email & SMS (Production)
SENDGRID_API_KEY=your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# DocuSign Integration (Production)
DOCUSIGN_CLIENT_ID=your-docusign-client-id
DOCUSIGN_CLIENT_SECRET=your-docusign-client-secret

# Calendly Integration (Production)
CALENDLY_ACCESS_TOKEN=your-calendly-access-token
```

## 🗄️ Database Management

### Migrations Workflow

```bash
# 1. Modify entities in src/shared/entities/
# 2. Generate migration from entity changes
npm run db:generate

# 3. Review generated migration in src/server/database/migrations.ts
# 4. Apply migration to database
npm run db:migrate
```

### Database Access

- **pgAdmin**: http://localhost:5050
  - Email: `admin@intai.dev`
  - Password: `admin123`
  - Server: `IntAI Development` (pre-configured)

- **Direct Connection**:
  ```bash
  psql postgresql://intai_user:intai_password@localhost:5432/intai_db
  ```

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Frontend development server (Vite)
npm run dev-node         # Backend development server (tsx watch)

# Building  
npm run build            # Production build
npm run preview          # Preview production build

# Database
npm run db:generate      # Generate migrations from entity changes
npm run db:migrate       # Apply pending migrations
npm run docker:dev       # Start development services (PostgreSQL, Redis, pgAdmin)
npm run docker:down      # Stop development services

# Testing
npm run test             # Run tests (Vitest)
npm run test:ui          # Run tests with UI
npm run lint             # ESLint check
```

## 🏭 Production Deployment

### Environment Preparation

1. **Database**: Set up PostgreSQL instance
2. **Sessions**: Configure `SESSION_SECRET` with strong random key
3. **APIs**: Configure external service credentials
4. **HTTPS**: Ensure SSL/TLS termination
5. **Environment**: Set `NODE_ENV=production`

### Build & Deploy

```bash
# Build application
npm run build

# Run migrations on production database
DATABASE_URL=<production-url> npm run db:migrate

# Start production server
npm start
```

## 🔒 Security Features

- **🍪 Secure Sessions**: Cookie-based authentication with signed cookies
- **🔐 Role-based Access**: Entity-level authorization (User/Consultant/Manager/Admin)
- **📝 Audit Logging**: Comprehensive activity tracking
- **🛡️ Input Validation**: Type-safe validation on both client and server
- **🔄 CSRF Protection**: SameSite cookie configuration
- **🌐 HTTPS Enforcement**: Production security headers

## 📊 Key Features

### User Roles & Capabilities

| Role | Capabilities |
|------|-------------|
| **User** | View finance data, book appointments, manage notifications |
| **Consultant** | View meetings, access user data, manage notes, update appointment status |
| **Manager** | All consultant abilities + assign appointments + tag management + analytics |
| **Admin** | All manager abilities + audit logs + tag deletion + system settings |

### External Integrations

- **📈 Finance Data**: Mislaka, Harhabituah, Gemelnet
- **📅 Scheduling**: Calendly integration
- **📧 Communications**: SendGrid (email) + Twilio (SMS)
- **📄 Documents**: DocuSign embedded signing

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report  
npm run test:coverage

# Test specific file
npm test src/shared/entities/User.test.ts
```

## 🐳 Docker Services

The development environment includes:

- **PostgreSQL 17**: Database server
- **pgAdmin 4**: Database administration interface
- **Redis 8**: Session storage and caching
- **Redis Commander**: Redis management interface

## 📚 Additional Resources

- **[Remult Documentation](https://remult.dev/)**: Full-stack TypeScript framework
- **[TanStack Router](https://tanstack.com/router)**: Type-safe React routing
- **[TanStack Query](https://tanstack.com/query)**: Data fetching and state management
- **[Mantine UI](https://mantine.dev/)**: React components library

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

## 📄 License

This project is proprietary and confidential.

---

**Built with ❤️ using TypeScript, React, TanStack, and Remult**
