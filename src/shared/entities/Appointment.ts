import { Entity, Fields, Relations } from 'remult'
import { User } from './User.js'
import { Staff } from './Staff.js'

export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled_by_user' | 'no_show' | 'follow_up_needed'

@Entity('appointments', {
  allowApiCrud: true,
})
export class Appointment {
  @Fields.uuid()
  id!: string

  @Relations.toOne(() => User, { required: true })
  user!: User

  @Fields.uuid({ required: true })
  userId!: string

  @Relations.toOne(() => Staff, { allowNull: true })
  consultant?: Staff

  @Fields.uuid({ allowNull: true })
  consultantId?: string

  @Fields.string({ allowNull: true })
  calendlyEventId?: string

  @Fields.string<Appointment, AppointmentStatus>({ 
    defaultValue: () => 'scheduled',
    validate: (appointment, field) => {
      const validStatuses = ['scheduled', 'completed', 'canceled_by_user', 'no_show', 'follow_up_needed']
      if (!validStatuses.includes(field.value)) {
        throw new Error(`Status must be one of: ${validStatuses.join(', ')}`)
      }
    }
  })
  status!: AppointmentStatus

  @Fields.date({ required: true })
  startTime!: Date

  @Fields.date({ required: true })
  endTime!: Date

  @Fields.string({ required: true })
  timeZone!: string

  @Fields.string({ allowNull: true })
  meetingUrl?: string

  @Fields.json<Appointment, string[]>({ defaultValue: () => [] })
  tags!: string[]

  @Fields.createdAt()
  createdAt!: Date

  @Fields.updatedAt()
  updatedAt!: Date
} 