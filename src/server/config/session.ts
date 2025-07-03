import { config } from 'dotenv'
import cookieSession from 'cookie-session'

// Load environment variables
config()

// Session configuration using cookie-session (as per Remult tutorial)
export const sessionConfig = cookieSession({
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this-in-production',
  name: process.env.SESSION_NAME || 'intai.sid',
  maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000000', 10), // 30 days in milliseconds
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  httpOnly: true, // Prevent client-side JS access
  signed: true, // Use signed cookies
})

// Session utility functions
export const sessionUtils = {
  // Get user from session
  getUser: (req: any) => {
    return req.session!['user'] || null
  },

  // Set user in session
  setUser: (req: any, user: any) => {
    req.session.user = user
  },

  // Clear user from session
  clearUser: (req: any) => {
    delete req.session.user
  },

  // Destroy session completely
  destroySession: (req: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        req.session = null // cookie-session way to destroy session
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  },

  // Regenerate session ID
  regenerateSession: (req: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const userData = req.session?.user
        req.session = null
        req.session = { user: userData }
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }
}

// No Redis needed with cookie-session
export const initializeRedis = async () => {
  console.log('Using cookie-session (no Redis needed)')
}

export const checkRedisHealth = async (): Promise<boolean> => {
  return true // Always healthy with cookie-session
} 