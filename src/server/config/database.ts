import { config } from 'dotenv'
import { createPostgresDataProvider } from 'remult/postgres'
import { User, Staff, FinanceSnapshot, Appointment, Tag, Note, AuditEvent } from '../../shared/entities/index.js'

// Load environment variables
config()

// Export entities array for consistency between API and migrations
export const entities = [
  User,
  Staff,
  FinanceSnapshot,
  Appointment,
  Tag,
  Note,
  AuditEvent
]

// Create and export the PostgreSQL data provider
export const dataProvider = createPostgresDataProvider({
  connectionString: process.env.DATABASE_URL || 'postgresql://intai_user:intai_password@localhost:5432/intai_db',
  configuration: {
    // PostgreSQL connection pool configuration
    max: 20, // Maximum number of clients in the pool
    min: 2,  // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close clients after 30 seconds of inactivity
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    maxUses: 7500, // Close (and replace) a connection after it has been used this many times
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Application name for connection tracking
    application_name: 'intai-app',
    // Statement timeout to prevent long-running queries
    statement_timeout: 30000, // 30 seconds
    // Query timeout
    query_timeout: 30000, // 30 seconds
  }
})

// Database configuration object for flexibility
export const databaseConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'intai_db',
  user: process.env.DATABASE_USER || 'intai_user',
  password: process.env.DATABASE_PASSWORD || 'intai_password',
  ssl: process.env.NODE_ENV === 'production',
  connectionString: process.env.DATABASE_URL,
}

// Export individual connection parameters for other uses
export const {
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  connectionString
} = databaseConfig 