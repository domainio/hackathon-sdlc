import { Entity, Fields, Relations } from 'remult'

export type Language = 'he' | 'en'

@Entity('users', {
  allowApiCrud: true, // We'll change this later
})
export class User {
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

  @Fields.string({ required: true })
  nationalId!: string

  @Fields.createdAt()
  createdAt!: Date

  @Fields.dateOnly({ allowNull: true })
  lastLogin?: Date

  @Fields.boolean({ defaultValue: () => false })
  archived!: boolean

  @Fields.string<User, Language>({ 
    defaultValue: () => 'he',
    validate: (user, field) => {
      if (!['he', 'en'].includes(field.value)) {
        throw new Error('Language must be either "he" or "en"')
      }
    }
  })
  language!: Language

  // Notification preferences
  @Fields.boolean({ defaultValue: () => true })
  emailNotifications!: boolean

  @Fields.boolean({ defaultValue: () => true })
  smsNotifications!: boolean

  @Fields.boolean({ defaultValue: () => true })
  appNotifications!: boolean
} 