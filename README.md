# mini-erp

Minimal ERP example: Next.js frontend + NestJS backend + Prisma (SQLite).

## Tech stack

- Frontend: Next.js, React, TypeScript
- Backend: NestJS, TypeScript
- ORM: Prisma (SQLite for development)
- Build/runtime: Node.js (Docker images use Node 20)

## Prerequisites

- Git
- Node.js 20.x and npm (for local development)


## Installation

Clone the repository and install dependencies for both apps (if running locally):

```bash
git clone <repo-url>
cd mini-erp

# frontend
cd apps/frontend
npm install

# in a separate shell: backend
cd ../backend
npm install
```

## Run the application (local development)

- Backend (dev):

```bash
cd apps/backend
npm install
npx prisma generate
npm run start:dev
```

- Frontend (dev):

```bash
cd apps/frontend
npm install
npm run dev
```

When running locally, the frontend should point to the backend API at `http://localhost:3001`.

## Database & Prisma

- The project uses SQLite (file stored under `apps/backend/prisma`).
- To apply migrations or create the DB locally:

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
```

## Architectural decisions & assumptions

- Simplicity and developer experience: SQLite + Prisma chosen to keep setup minimal for a demo project.
- Clear separation of concerns: Next.js handles UI and server-side rendering; NestJS provides an API and auth.
- Simple multi-project layout to keep frontend and backend separated; build artifacts live in each app's `dist`/`.next` output.
- Assumptions:
  - Single-instance deployment (no clustering or DB server like Postgres).
  - Secrets and environment variables are not fully production-hardened; add secure secret management for production.
  - Prisma client must be generated (`npx prisma generate`) before running the backend image build when developing locally.

## Files of interest

- Backend source: [apps/backend/src](apps/backend/src)
- Frontend source: [apps/frontend/src](apps/frontend/src)
- Prisma schema: [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma)
- Docs: [docs/ERD.md](docs/ERD.md) and [docs/openapi.yaml](docs/openapi.yaml)

## Troubleshooting


- If you see Prisma errors about a missing client, run `npx prisma generate` inside `apps/backend`.
