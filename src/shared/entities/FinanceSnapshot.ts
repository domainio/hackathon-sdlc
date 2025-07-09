import { Entity, Fields, Relations } from 'remult'
import { User } from './User.js'

@Entity('finance_snapshots', {
  allowApiCrud: true,
})
export class FinanceSnapshot {
  @Fields.uuid()
  id!: string

  @Relations.toOne(() => User, { required: true })
  user!: User

  @Fields.uuid({ required: true })
  userId!: string

  @Fields.json({ required: true })
  payload!: {
    mislaka?: any
    harhabituah?: any  
    gemelnet?: any
    insurance?: any
    pension?: any
  }

  @Fields.date({ required: true })
  fetchedAt!: Date

  @Fields.string({ allowNull: true })
  status?: 'pending' | 'completed' | 'error'

  @Fields.string({ allowNull: true })
  errorMessage?: string
} 