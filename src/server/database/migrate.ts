import { migrate } from 'remult/migrations'
import { dataProvider } from '../config/database.js'
import { migrations } from './migrations.js'

// Apply migrations to the database
migrate({
  dataProvider,
  migrations,
  endConnection: true, // Close the database connection after applying migrations
})
  .then(() => {
    console.log('✅ Database migrations completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Database migration failed:', error)
    process.exit(1)
  }) 