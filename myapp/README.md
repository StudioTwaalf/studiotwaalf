# Studio Twaalf

A print-ready design tool built with Next.js 14, Prisma, and PostgreSQL.

## Local development

### Prerequisites

- Node 20+
- pnpm
- Docker (for local PostgreSQL)

### Setup

```bash
# 1. Copy env and set your secrets
cp .env.example .env          # or edit .env directly

# 2. Start the database
pnpm db:up

# 3. Push schema to the database
pnpm prisma:migrate            # runs prisma migrate dev (interactive)
# OR (non-interactive / after a reset):
npx prisma db push

# 4. Seed demo templates
pnpm seed

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Password for the `/admin` area |
| `NEXTAUTH_SECRET` | Random secret for JWT signing (use `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Base URL for NextAuth callbacks (e.g. `http://localhost:3000`) |

### Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm db:up` | Start Docker PostgreSQL |
| `pnpm db:down` | Stop Docker PostgreSQL |
| `pnpm prisma:migrate` | Run Prisma migrations (dev) |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm seed` | Seed demo templates |

### Routes

| Path | Description |
|---|---|
| `/templates` | Public template gallery |
| `/design/[id]` | Design editor (requires customer login) |
| `/login` | Customer sign-in |
| `/register` | Customer registration |
| `/my-designs` | Saved designs (requires customer login) |
| `/admin/templates` | Admin template management |
