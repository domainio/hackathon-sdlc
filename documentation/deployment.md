### 🐳 Tooling
- Docker Compose dev setup: docker-compose.dev.yml

### Scripts:

- docker:dev – boot local dev containers

- docker:down – shut them down

### ⚙️ Build & Deployment Flow
- Server build: tsc -p tsconfig.server.json

- Client build: vite build

- Combined build: npm run build:all

- Postbuild migration: npm run db:migrate

- Production launch: NODE_ENV=production node dist/server/index.js

### 🌐 Environment
- Uses .env and dotenv for configuration

- Node 24+, npm 10+

- Likely deployable to:

- Local Docker dev

- Cloud/containerized production (e.g. Fly.io, Vercel backend, etc.)