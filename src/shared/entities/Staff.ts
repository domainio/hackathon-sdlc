import { Entity, Fields } from 'remult'

export type StaffRole = 'consultant' | 'manager' | 'admin'

@Entity('staff', {
  allowApiCrud: true,
})
export class Staff {
  @Fields.uuid()
  id!: string

  @Fields.string({ required: true })
  firstName!: string

  @Fields.string({ required: true })
  lastName!: string

  @Fields.string({ required: true })
  phone!: string

  @Fields.string({ required: true })
  email!: string

  @Fields.string<Staff, StaffRole>({ 
    required: true,
    validate: (staff, field) => {
      if (!['consultant', 'manager', 'admin'].includes(field.value)) {
        throw new Error('Role must be consultant, manager, or admin')
      }
    }
  })
  role!: StaffRole

  @Fields.boolean({ defaultValue: () => true })
  active!: boolean

  @Fields.createdAt()
  createdAt!: Date

  @Fields.dateOnly({ allowNull: true })
  lastLogin?: Date

  // Notification preferences
  @Fields.boolean({ defaultValue: () => true })
  emailNotifications!: boolean

  @Fields.boolean({ defaultValue: () => true })
  smsNotifications!: boolean
} 