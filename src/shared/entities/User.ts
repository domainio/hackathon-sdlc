import { Entity, Fields, Relations, Allow } from 'remult'

export type Language = 'he' | 'en'
export type UserRole = 'user' | 'staff' | 'admin'

@Entity('users', {
  allowApiCrud: Allow.authenticated,
  allowApiInsert: false, // Only through registration/invitation
  allowApiUpdate: Allow.authenticated,
  allowApiDelete: 'admin'
})
export class User {
  @Fields.uuid()
  id!: string

  @Fields.string({ required: true })
  firstName!: string

  @Fields.string({ required: true })
  lastName!: string

  @Fields.string({ 
    required: true,
    validate: (user, field) => {
      // Israeli phone number validation
      const phoneRegex = /^(\+972|0)([23489]|5[012345689]|77)[0-9]{7}$/
      if (!phoneRegex.test(field.value.replace(/[-\s]/g, ''))) {
        throw new Error('Invalid Israeli phone number format')
      }
    }
  })
  phone!: string

  @Fields.string({ required: true })
  email!: string

  @Fields.string({ required: true })
  nationalId!: string

  @Fields.string<User, UserRole>({ 
    defaultValue: () => 'user',
    validate: (user, field) => {
      if (!['user', 'staff', 'admin'].includes(field.value)) {
        throw new Error('Role must be user, staff, or admin')
      }
    }
  })
  role!: UserRole

  // Authentication fields
  @Fields.boolean({ defaultValue: () => true })
  isActive!: boolean

  @Fields.boolean({ defaultValue: () => false })
  isPhoneVerified!: boolean

  @Fields.boolean({ defaultValue: () => false })
  isEmailVerified!: boolean

  // OTP fields - sensitive, not exposed to API
  @Fields.string({ allowApiUpdate: false, includeInApi: false })
  otpCode?: string

  @Fields.date({ allowApiUpdate: false, includeInApi: false })
  otpExpiration?: Date

  @Fields.integer({ defaultValue: () => 0, allowApiUpdate: false, includeInApi: false })
  otpAttempts!: number

  @Fields.date({ allowApiUpdate: false, includeInApi: false })
  otpBlockedUntil?: Date

  @Fields.createdAt()
  createdAt!: Date

  @Fields.updatedAt()
  updatedAt!: Date

  @Fields.date({ allowNull: true })
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

  // Computed fields
  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }

  get isOtpBlocked() {
    return this.otpBlockedUntil && this.otpBlockedUntil > new Date()
  }

  get isOtpValid() {
    return this.otpCode && 
           this.otpExpiration && 
           this.otpExpiration > new Date() && 
           !this.isOtpBlocked
  }
} 