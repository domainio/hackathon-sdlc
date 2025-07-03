import { config } from 'dotenv'
import session from 'express-session'
import { createClient } from 'redis'
import connectRedis from 'connect-redis'

// Load environment variables
config()

// Create Redis client for production
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    tls: process.env.NODE_ENV === 'production' ? true : undefined, // TLS for production
  },
  database: 0,
})

// Initialize Redis store
const RedisStore = connectRedis(session)

// Production-secure session configuration
export const secureSessionConfig: session.SessionOptions = {
  store: new RedisStore({ 
    client: redisClient,
    prefix: 'intai:sess:',
    ttl: 24 * 60 * 60, // 24 hours
  }),
  secret: process.env.SESSION_SECRET || 'CHANGE-THIS-IN-PRODUCTION',
  name: 'intai.sid',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict', // CSRF protection
  },
}

// Only store minimal data in sessions
export const secureSessionUtils = {
  // Store ONLY user ID, fetch sensitive data from DB when needed
  setUser: (req: any, user: { id: string, roles?: string[] }) => {
    req.session.user = {
      id: user.id,
      roles: user.roles || []
      // NO sensitive data here!
    }
  },
  
  getUser: (req: any) => {
    return req.session?.user || null
  },

  clearUser: (req: any) => {
    delete req.session.user
  }
}

export { redisClient } 