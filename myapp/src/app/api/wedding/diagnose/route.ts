import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── TIJDELIJK — diagnose van de databaseverbinding op productie ─────────────
// Afgeschermd met een sleutel en bedoeld om meteen weer verwijderd te worden.
// Geeft nooit de verbindingsstring, de gebruikersnaam of het wachtwoord terug:
// enkel vorm-kenmerken (lengte, protocol, host, poort) en een foutcategorie.

const KEY = '3b7e13ce214ab7aef39c0c322aa7931f'

function shape(v: string) {
  // Wachtwoord = alles tussen de eerste ':' na het protocol en de laatste '@'.
  // We tonen het nooit; enkel de lengte en wélke niet-alfanumerieke tekens
  // erin zitten, want juist die breken de verbindingsstring.
  const zonderProtocol = v.replace(/^postgres(?:ql)?:\/\//, '')
  const laatsteApenstaart = zonderProtocol.lastIndexOf('@')
  const userinfo = laatsteApenstaart > -1 ? zonderProtocol.slice(0, laatsteApenstaart) : ''
  const eersteDubbelepunt = userinfo.indexOf(':')
  const wachtwoord = eersteDubbelepunt > -1 ? userinfo.slice(eersteDubbelepunt + 1) : ''

  return {
    aanwezig: v.length > 0,
    lengte: v.length,
    wachtwoordLengte: wachtwoord.length,
    wachtwoordVreemdeTekens: Array.from(
      new Set(wachtwoord.split('').filter((c) => !/[A-Za-z0-9]/.test(c))),
    ),
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

  // Probeert écht naar de Blob-opslag te schrijven. Zonder deze test weten we
  // alleen dát het misgaat, niet waarom: de token kan naar een verwijderde
  // opslag wijzen, verlopen zijn, of bij het verkeerde project horen.
  let blob: Record<string, unknown>
  try {
    const { put } = await import('@vercel/blob')
    const resultaat = await put(`diagnose/${Date.now()}.txt`, 'test', {
      access: 'public',
      contentType: 'text/plain',
    })
    blob = { ok: true, url: resultaat.url }
  } catch (err) {
    blob = {
      ok: false,
      naam: err instanceof Error ? err.name : null,
      melding: (err instanceof Error ? err.message : String(err))
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300),
    }
  }

  // Alleen de slugs en namen van de feesten: geen gasten, geen e-mailadressen,
  // geen foto's. Genoeg om te kunnen testen, niets persoonlijks.
  let feesten: unknown = null
  try {
    feesten = await prisma.weddingEvent.findMany({
      select: {
        slug: true,
        coupleName: true,
        isOpen: true,
        photoLimit: true,
        _count: { select: { guests: true, photos: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  } catch {
    feesten = 'niet op te halen'
  }

  return NextResponse.json({
    blob,
    feesten,
    DATABASE_URL: shape(process.env.DATABASE_URL ?? ''),
    DIRECT_URL: shape(process.env.DIRECT_URL ?? ''),
    NEXTAUTH_SECRET: { aanwezig: (process.env.NEXTAUTH_SECRET ?? '').length > 0 },
    BLOB_READ_WRITE_TOKEN: { aanwezig: (process.env.BLOB_READ_WRITE_TOKEN ?? '').length > 0 },
    verbinding,
  })
}
