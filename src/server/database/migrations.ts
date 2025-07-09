import type { Migrations } from 'remult/migrations'

export const migrations: Migrations = {
  // Migrations will be auto-generated when you run:
  // npm run db:generate
  // 
  // Initial migration will be created here automatically
  // based on your entity definitions
  
  // Example of what a migration looks like:
  // 0: async ({ sql }) => {
  //   await sql(`--sql
  //     CREATE SCHEMA IF NOT EXISTS public;
  //     CREATE TABLE "users" (
  //       "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  //       "name" VARCHAR DEFAULT '' NOT NULL,
  //       "email" VARCHAR DEFAULT '' NOT NULL,
  //       "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  //       "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  //     );
  //     CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
  //   `)
  // },
} 