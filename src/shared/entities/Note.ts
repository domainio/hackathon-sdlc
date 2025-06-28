import { Entity, Fields, Relations } from 'remult'
import { Appointment } from './Appointment.js'
import { Staff } from './Staff.js'

@Entity('notes', {
  allowApiCrud: true,
})
export class Note {
  @Fields.uuid()
  id!: string

  @Relations.toOne(() => Appointment, { required: true })
  appointment!: Appointment

  @Fields.uuid({ required: true })
  appointmentId!: string

  @Relations.toOne(() => Staff, { required: true })
  author!: Staff

  @Fields.uuid({ required: true })
  authorId!: string

  @Fields.string({ 
    required: true,
    validate: (note, field) => {
      if (field.value.length > 10000) {
        throw new Error('Note content cannot exceed 10,000 characters')
      }
    }
  })
  markdown!: string

  @Fields.createdAt()
  createdAt!: Date

  @Fields.updatedAt()
  updatedAt!: Date

  @Fields.integer({ defaultValue: () => 1 })
  version!: number
} 