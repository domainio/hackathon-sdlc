import { generateMigrations } from 'remult/migrations'
import { dataProvider, entities } from '../config/database.js'

// Generate migration scripts based on entity changes
generateMigrations({
  dataProvider, // The data provider for your database
  entities, // Entity classes to include in the migration
  endConnection: true, // Close the database connection after generating migrations
})
  .then(() => {
    console.log('✅ Database migrations generated successfully')
    console.log('📁 Check src/server/database/migrations.ts for the generated migration')
    console.log('🔧 Run "npm run db:migrate" to apply the migrations')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration generation failed:', error)
    process.exit(1)
  }) 