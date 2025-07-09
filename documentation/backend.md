### 📦 Tech Stack
- Express 5

- PostgreSQL (pg, postgres)

- Redis (redis, connect-redis)

- Remult (full-stack ORM with routing/controllers)

- Cookie & session handling (cookie-session, express-session)

- Auth: jsonwebtoken, bcryptjs

- nodemailer + twilio for messaging/email

### 🧠 Architecture Notes
- Monorepo or shared codebase style (unified project)

- Express as base framework

- Redis session store

- Remult REST+ORM model where entities map to routes

- 📂 Folder Structure

src/server/
  index.ts        <-- Entry point
  routes/
  database/
    migrate.ts
    generate-migrations.ts
  controllers/
  services/
  middlewares/

### 🛠️ Tooling
- tsx for modern TypeScript execution (fast, ESM-native)

- Migrations are run via scripts using tsx

### 🧪 Testing
- supertest, vitest for backend API testing

