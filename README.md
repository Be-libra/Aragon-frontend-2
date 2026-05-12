# Aragon Kanban Challenge

A full-stack kanban-style task management app built for the Aragon frontend/backend challenge.

## Stack

- Next.js App Router
- React + TypeScript
- PostgreSQL via Docker Compose
- Prisma ORM
- Zod validation
- Pino logging

## Quick start

env variables
```
DATABASE_URL="postgres db url"
NODE_ENV="development"
LOG_LEVEL="debug"
```

1. Copy `.env.example` to `.env`.
2. Start Postgres with `docker compose up -d`.
3. Install dependencies with `pnpm install`.
4. Generate the Prisma client with `pnpm db:generate`.
5. Push the schema with `pnpm db:push`.
6. Seed demo data with `pnpm db:seed`.
7. Start the app with `pnpm dev`.


## Project goals

- High-fidelity kanban UI close to the provided reference
- Clean CRUD for boards, columns, tasks, and subtasks
- Strong validation and clear API error handling
- Reusable, modular UI components without overengineering
- Fast local onboarding for humans and AI agents

