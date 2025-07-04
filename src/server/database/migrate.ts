import { config } from 'dotenv'
import { dataProvider } from '../config/database.js'
import { migrations } from './migrations.js'
import { migrate } from 'remult/migrations'

// Load environment variables
config()

export async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...')
    await migrate({
      dataProvider,
      migrations,
      endConnection: true,
    })
    console.log('✅ Database migrations completed successfully')
    return true
  } catch (error) {
    console.error('❌ Database migration failed:', error)
    throw error
  }
}

// Only run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration script failed:', error)
      process.exit(1)
    })
} 