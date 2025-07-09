import { Entity, Fields, Relations } from 'remult'
import { Staff } from './Staff.js'

@Entity('tags', {
  allowApiCrud: true,
})
export class Tag {
  @Fields.uuid()
  id!: string

  @Fields.string({ 
    required: true,
    validate: (_tag, field) => {
      if (field.value.length < 1 || field.value.length > 50) {
        throw new Error('Tag name must be between 1 and 50 characters')
      }
    }
  })
  name!: string

  @Fields.string({ 
    required: true,
    validate: (_tag, field) => {
      // Validate hex color format
      if (!/^#[0-9A-Fa-f]{6}$/.test(field.value)) {
        throw new Error('Color must be a valid hex color (e.g., #FF5733)')
      }
    }
  })
  color!: string

  @Relations.toOne(() => Staff, { required: true })
  createdBy!: Staff

  @Fields.uuid({ required: true })
  createdById!: string

  @Fields.createdAt()
  createdAt!: Date

  @Fields.boolean({ defaultValue: () => false })
  archived!: boolean
} 