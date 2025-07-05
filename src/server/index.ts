import express from 'express'
import { config } from 'dotenv'
import { api } from './api.js'
import { sessionConfig, initializeRedis, checkRedisHealth } from './config/session.js'
import { validateAndExit, getConfigStatus } from './config/env-validator.js'

// Load environment variables
config()

// Validate environment configuration (production only)
validateAndExit()

const app = express()
const PORT = process.env.PORT || 3002

// Trust proxy for proper session handling behind reverse proxy
app.set('trust proxy', 1)

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', async (_req, res) => {
  const sessionHealthy = await checkRedisHealth() // Returns true for cookie-session
  const configStatus = getConfigStatus()
  const status = sessionHealthy && configStatus.valid ? 'healthy' : 'unhealthy'
  const statusCode = sessionHealthy && configStatus.valid ? 200 : 503

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      sessions: 'cookie-session',
      database: 'connected', // TODO: Add database health check
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    config: {
      valid: configStatus.valid,
      features: configStatus.features,
      summary: configStatus.summary
    }
  })
})

// Initialize the server
async function initializeServer() {
  try {
    // Initialize session system (cookie-session)
    await initializeRedis()

    // Setup session middleware with cookie-session
    app.use(sessionConfig)

    // Setup Remult API
    app.use(api)

    const frontendFiles = process.cwd() + "/dist";
    app.use(express.static(frontendFiles));
    app.get("/", (_, res) => {
      res.sendFile(frontendFiles + "/index.html");
    });

    // Error handling middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Server error:', err)
      res.status(500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        timestamp: new Date().toISOString()
      })
    })

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Admin UI: http://localhost:${PORT}/api/admin`)
      }
    })

  } catch (error) {
    console.error('Failed to initialize server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Initialize the server
initializeServer()