-- Initialize the IntAI database with proper extensions and settings

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas if needed
CREATE SCHEMA IF NOT EXISTS public;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO intai_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO intai_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO intai_user;

-- Grant all privileges on public schema to the user
GRANT ALL ON SCHEMA public TO intai_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO intai_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO intai_user;

-- Create indexes for better performance (will be created by Remult migrations)
-- These are placeholders for reference

-- Comment explaining the database structure
COMMENT ON DATABASE intai_db IS 'IntAI application database with Remult entities';

-- Set timezone
SET timezone = 'UTC'; 