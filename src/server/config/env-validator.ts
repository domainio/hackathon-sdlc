import { config } from 'dotenv'

// Load environment variables
config()

// Environment variable validation configuration
interface EnvConfig {
  name: string
  required: boolean
  validator?: (value: string) => boolean | string
  description: string
}

// Define all environment variables used in the application
const ENV_VARIABLES: EnvConfig[] = [
  // Core Application
  {
    name: 'NODE_ENV',
    required: true,
    validator: (value) => ['development', 'production', 'test'].includes(value) || 'Must be development, production, or test',
    description: 'Application environment'
  },
  {
    name: 'PORT',
    required: true,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0 || 'Must be a positive number',
    description: 'Server port (Railway sets this automatically)'
  },

  // Database Configuration
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (value) => value.startsWith('postgresql://') || 'Must be a valid PostgreSQL connection string',
    description: 'PostgreSQL database connection string'
  },

  // Session Configuration
  {
    name: 'SESSION_SECRET',
    required: true,
    validator: (value) => {
      if (value.length < 32) return 'Must be at least 32 characters long for security'
      if (value.includes('your-super-secret-session-key') || value.includes('change-this-in-production')) {
        return 'Must be changed from default value for production security'
      }
      return true
    },
    description: 'Session encryption secret (min 32 chars)'
  },
  {
    name: 'SESSION_NAME',
    required: false,
    description: 'Session cookie name'
  },
  {
    name: 'SESSION_MAX_AGE',
    required: false,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0 || 'Must be a positive number',
    description: 'Session max age in milliseconds'
  },

  // SMS Configuration (Twilio) - Optional
  {
    name: 'TWILIO_ACCOUNT_SID',
    required: false,
    validator: (value) => value.startsWith('AC') || 'Must be a valid Twilio Account SID (starts with AC)',
    description: 'Twilio Account SID for SMS functionality'
  },
  {
    name: 'TWILIO_AUTH_TOKEN',
    required: false,
    validator: (value) => value.length >= 32 || 'Must be at least 32 characters long',
    description: 'Twilio Auth Token for SMS functionality'
  },
  {
    name: 'TWILIO_PHONE_NUMBER',
    required: false,
    validator: (value) => value.startsWith('+') || 'Must be a valid phone number starting with +',
    description: 'Twilio sender phone number'
  },

  // Email Configuration (SMTP) - Optional
  {
    name: 'SMTP_HOST',
    required: false,
    description: 'SMTP server hostname'
  },
  {
    name: 'SMTP_PORT',
    required: false,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0 || 'Must be a positive number',
    description: 'SMTP server port'
  },
  {
    name: 'SMTP_USER',
    required: false,
    validator: (value) => value.includes('@') || 'Must be a valid email address',
    description: 'SMTP username (email)'
  },
  {
    name: 'SMTP_PASS',
    required: false,
    description: 'SMTP password'
  },
  {
    name: 'FROM_EMAIL',
    required: false,
    validator: (value) => value.includes('@') || 'Must be a valid email address',
    description: 'Default from email address'
  },

  // Security & CORS
  {
    name: 'CORS_ORIGINS',
    required: false,
    description: 'Comma-separated list of allowed CORS origins'
  },

  // Redis (if used instead of cookie-session)
  {
    name: 'REDIS_URL',
    required: false,
    validator: (value) => value.startsWith('redis://') || 'Must be a valid Redis URL',
    description: 'Redis connection URL (optional)'
  }
]

// Validation result interface
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  summary: {
    required: number
    requiredSet: number
    optional: number
    optionalSet: number
  }
}

/**
 * Validate environment variables for production readiness
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  let requiredCount = 0
  let requiredSetCount = 0
  let optionalCount = 0
  let optionalSetCount = 0

  console.log('🔍 Validating environment configuration...')

  for (const config of ENV_VARIABLES) {
    const value = process.env[config.name]
    
    if (config.required) {
      requiredCount++
      
      if (!value) {
        errors.push(`❌ Required environment variable '${config.name}' is not set. ${config.description}`)
      } else {
        requiredSetCount++
        
        // Validate value format if validator exists
        if (config.validator) {
          const validationResult = config.validator(value)
          if (validationResult !== true) {
            errors.push(`❌ Invalid value for '${config.name}': ${validationResult}`)
          }
        }
      }
    } else {
      optionalCount++
      
      if (value) {
        optionalSetCount++
        
        // Validate value format if validator exists
        if (config.validator) {
          const validationResult = config.validator(value)
          if (validationResult !== true) {
            warnings.push(`⚠️  Invalid value for optional '${config.name}': ${validationResult}`)
          }
        }
      }
    }
  }

  // Check for SMS/Email configuration completeness
  const hasTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS

  if (!hasTwilio && !hasSmtp) {
    warnings.push('⚠️  No SMS (Twilio) or Email (SMTP) configuration found. Users will not receive notifications.')
  }

  if (process.env.TWILIO_ACCOUNT_SID && (!process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER)) {
    warnings.push('⚠️  Incomplete Twilio configuration. All three variables (ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER) are required.')
  }

  if (process.env.SMTP_HOST && (!process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    warnings.push('⚠️  Incomplete SMTP configuration. All SMTP variables are required for email functionality.')
  }

  const valid = errors.length === 0

  return {
    valid,
    errors,
    warnings,
    summary: {
      required: requiredCount,
      requiredSet: requiredSetCount,
      optional: optionalCount,
      optionalSet: optionalSetCount
    }
  }
}

/**
 * Validate environment and exit if critical issues in production
 */
export function validateAndExit(): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Skip validation in development
  if (!isProduction) {
    console.log('🔧 Development mode - skipping environment validation')
    return
  }

  const result = validateEnvironment()

  // Print summary
  console.log('\n📊 Environment Configuration Summary:')
  console.log(`   Required variables: ${result.summary.requiredSet}/${result.summary.required}`)
  console.log(`   Optional variables: ${result.summary.optionalSet}/${result.summary.optional}`)

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    result.warnings.forEach(warning => console.log(`   ${warning}`))
  }

  // Print errors and exit if any
  if (result.errors.length > 0) {
    console.log('\n❌ Configuration Errors:')
    result.errors.forEach(error => console.log(`   ${error}`))
    
    console.log('\n💡 To fix these issues:')
    console.log('   1. Set the required environment variables in your Railway project')
    console.log('   2. Ensure all values follow the required format')
    console.log('   3. Refer to env.example for sample values')
    console.log('\n🔗 Railway Environment Variables: https://docs.railway.app/develop/variables')
    
    process.exit(1)
  }

  if (result.valid) {
    console.log('\n✅ Environment configuration is valid!')
    if (result.warnings.length > 0) {
      console.log('   Note: Some optional features may not work due to missing configuration.')
    }
  }
}

/**
 * Get configuration status for health checks
 */
export function getConfigStatus() {
  const result = validateEnvironment()
  
  return {
    valid: result.valid,
    features: {
      sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
      email: !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS),
      redis: !!process.env.REDIS_URL
    },
    summary: result.summary
  }
} 