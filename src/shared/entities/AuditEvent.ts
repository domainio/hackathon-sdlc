import { Entity, Fields, Relations } from 'remult'
import { User } from './User.js'
import { Staff } from './Staff.js'

export type AuditEventType = 'AUTH' | 'ONBOARD' | 'API'
export type AuditEventStatus = 'success' | 'error' | 'pending'
export type APIProvider = 'mislaka' | 'harhabituah' | 'gemelnet' | 'calendly' | 'docusign' | 'sendgrid' | 'twilio'
export type TriggeredBy = 'system' | 'staff'

@Entity('audit_events', {
  allowApiCrud: true,
})
export class AuditEvent {
  @Fields.uuid()
  id!: string

  @Fields.string<AuditEvent, AuditEventType>({ 
    required: true,
    validate: (event, field) => {
      if (!['AUTH', 'ONBOARD', 'API'].includes(field.value)) {
        throw new Error('Type must be AUTH, ONBOARD, or API')
      }
    }
  })
  type!: AuditEventType

  @Relations.toOne(() => User, { allowNull: true })
  user?: User

  @Fields.uuid({ allowNull: true })
  userId?: string

  @Relations.toOne(() => Staff, { allowNull: true })
  actor?: Staff

  @Fields.uuid({ allowNull: true })
  actorId?: string

  @Fields.string<AuditEvent, APIProvider>({ 
    allowNull: true,
    validate: (event, field) => {
      if (field.value && !['mislaka', 'harhabituah', 'gemelnet', 'calendly', 'docusign', 'sendgrid', 'twilio'].includes(field.value)) {
        throw new Error('API provider must be one of the supported providers')
      }
    }
  })
  apiProvider?: APIProvider

  @Fields.string<AuditEvent, AuditEventStatus>({ 
    allowNull: true,
    validate: (event, field) => {
      if (field.value && !['success', 'error', 'pending'].includes(field.value)) {
        throw new Error('Status must be success, error, or pending')
      }
    }
  })
  status?: AuditEventStatus

  @Fields.string<AuditEvent, TriggeredBy>({ 
    allowNull: true,
    validate: (event, field) => {
      if (field.value && !['system', 'staff'].includes(field.value)) {
        throw new Error('TriggeredBy must be system or staff')
      }
    }
  })
  triggeredBy?: TriggeredBy

  @Fields.string({ allowNull: true })
  ip?: string

  @Fields.string({ allowNull: true })
  userAgent?: string

  @Fields.json({ allowNull: true })
  metadata?: any

  @Fields.date({ defaultValue: () => new Date() })
  occurredAt!: Date
} 