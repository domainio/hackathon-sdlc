import { remultApi } from 'remult/remult-express'
import { User, Staff, FinanceSnapshot, Appointment, Tag, Note, AuditEvent } from '../shared/entities/index.js'
import { AuthController } from './controllers/AuthController.js'

export const api = remultApi({
  entities: [User, Staff, FinanceSnapshot, Appointment, Tag, Note, AuditEvent],
  controllers: [AuthController],
  admin: true, // Enable admin mode for development - will use in-memory storage for now
})