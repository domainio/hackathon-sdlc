import { remultApi } from 'remult/remult-express'
import { dataProvider, entities } from './config/database.js'
import { AuthController } from './controllers/AuthController.js'
import { sessionUtils } from './config/session.js'

export const api = remultApi({
  entities,
  controllers: [AuthController],
  dataProvider,
  ensureSchema: true, // Disable automatic schema creation - we'll use migrations instead
  admin: process.env.NODE_ENV === 'development', // Enable admin mode only in development
  getUser: (req) => sessionUtils.getUser(req), // Get user from session
  logApiEndPoints: process.env.NODE_ENV === 'development', // Log API endpoints in development
})