import { PrismaClient } from '@prisma/client'

/**
 * Prisma singleton — Next.js hot-reload safe.
 *
 * ── "Cannot read properties of undefined (reading 'findMany')" ───────────────
 * Root cause: globalThis.prisma holds a STALE PrismaClient created before the
 * last `prisma generate` run.  When you add models to schema.prisma and push /
 * migrate, the generated client on disk gains new delegates (e.g. .product,
 * .category).  But if the dev server was already running, globalThis.prisma
 * still points to the old client that doesn't have those delegates → undefined.
 *
 * Fix checklist (one-time, after adding new models):
 *   1. Stop dev server  (Ctrl+C)
 *   2. npx prisma db push           ← sync DB schema
 *   3. npx prisma generate          ← regenerate client (or just run step 1–2
 *                                      and restart; `pnpm dev` now does this)
 *   4. pnpm dev                     ← starts with a fresh client
 *
 * Automatic guard (below): if the cached singleton is stale it is discarded
 * and a fresh client is created without needing a manual restart.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Required model delegates — any name listed here must exist on PrismaClient
// after the most recent schema update.  Add new ones when you add new models.
const REQUIRED_MODELS = ['product', 'category', 'designAddonSelection', 'cart', 'shopOrder'] as const

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function isFreshClient(client: PrismaClient): boolean {
  const c = client as unknown as Record<string, unknown>
  return REQUIRED_MODELS.every((model) => typeof c[model] !== 'undefined')
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Staleness guard: discard cached client if it is missing required models
const cached = globalForPrisma.prisma
if (cached !== undefined && !isFreshClient(cached)) {
  console.warn(
    '\n[prisma] ⚠️  Stale singleton detected — schema was updated since the last ' +
    'prisma generate.\n' +
    '[prisma]    Discarding old client and creating a fresh one.\n' +
    '[prisma]    To avoid this warning, restart the dev server after prisma generate.\n',
  )
  globalForPrisma.prisma = undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Dev-mode diagnostic: log available model delegates on first load
if (process.env.NODE_ENV === 'development') {
  const models = Object.keys(prisma as unknown as Record<string, unknown>).filter(
    (k) => !k.startsWith('_') && !k.startsWith('$'),
  )
  console.log('[prisma] ✅ Client ready. Models:', models.join(', '))
}
