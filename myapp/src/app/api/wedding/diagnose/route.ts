import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── TIJDELIJK — diagnose van de databaseverbinding op productie ─────────────
// Afgeschermd met een sleutel en bedoeld om meteen weer verwijderd te worden.
// Geeft nooit de verbindingsstring, de gebruikersnaam of het wachtwoord terug:
// enkel vorm-kenmerken (lengte, protocol, host, poort) en een foutcategorie.

const KEY = '3b7e13ce214ab7aef39c0c322aa7931f'

function shape(v: string) {
  return {
    aanwezig: v.length > 0,
    lengte: v.length,
    protocolOk: v.startsWith('postgresql://') || v.startsWith('postgres://'),
    bevatPlaceholder: /YOUR-PASSWORD/i.test(v),
    // Gebruikersnaam is niet geheim (bevat de publieke project-ref); het
    // wachtwoord erachter tonen we uiteraard niet.
    gebruiker: (v.match(/:\/\/([^:@/]+)/) ?? [])[1] ?? null,
    host: (v.match(/@([^/:?]+)/) ?? [])[1] ?? null,
    poort: (v.match(/@[^/:?]+:(\d+)/) ?? [])[1] ?? null,
    pgbouncer: /pgbouncer=true/.test(v),
  }
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== KEY) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  }

  let verbinding: Record<string, unknown>
  try {
    await prisma.$queryRaw`SELECT 1`
    verbinding = { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const soort = /must start with the protocol/i.test(msg)
      ? 'URL_FORMAAT'
      : /Environment variable not found/i.test(msg)
        ? 'ENV_ONTBREEKT'
        : /Can't reach database server|ECONNREFUSED|ETIMEDOUT/i.test(msg)
          ? 'ONBEREIKBAAR'
          : /Authentication failed|password authentication/i.test(msg)
            ? 'AUTHENTICATIE'
            : /database .* does not exist/i.test(msg)
              ? 'DB_NAAM'
              : /ENOTFOUND|getaddrinfo/i.test(msg)
                ? 'DNS'
                : /prepared statement/i.test(msg)
                  ? 'PGBOUNCER'
                  : 'ANDERS'

    // Prisma-berichten beginnen vaak met een witregel; normaliseer alle
    // witruimte zodat de kern van de melding overblijft.
    const kern = msg.replace(/\s+/g, ' ').trim()

    verbinding = {
      ok: false,
      soort,
      melding: kern.slice(0, 400),
      naam: err instanceof Error ? err.name : null,
    }
  }

  return NextResponse.json({
    DATABASE_URL: shape(process.env.DATABASE_URL ?? ''),
    DIRECT_URL: shape(process.env.DIRECT_URL ?? ''),
    NEXTAUTH_SECRET: { aanwezig: (process.env.NEXTAUTH_SECRET ?? '').length > 0 },
    BLOB_READ_WRITE_TOKEN: { aanwezig: (process.env.BLOB_READ_WRITE_TOKEN ?? '').length > 0 },
    verbinding,
  })
}
