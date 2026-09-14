'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { sendAlbumOntwikkeld } from '@/lib/email'
import { leesOntvangers, splitsTekstvak } from '@/lib/wedding/ontvangers'

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[àáâä]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createWeddingAction(formData: FormData) {
  const coupleName = ((formData.get('coupleName') as string) ?? '').trim()
  const eventDate = (formData.get('eventDate') as string) ?? ''
  const photoLimit = parseInt((formData.get('photoLimit') as string) || '20', 10)
  const welcomeText = ((formData.get('welcomeText') as string) ?? '').trim()
  const customSlug = ((formData.get('slug') as string) ?? '').trim()

  if (!coupleName || !eventDate) {
    redirect('/admin/huwelijken/new?error=Naam+en+datum+zijn+verplicht')
  }

  const slug = toSlug(customSlug || coupleName)
  if (!slug) {
    redirect('/admin/huwelijken/new?error=Kies+een+bruikbare+naam+of+slug')
  }

  let created
  try {
    created = await prisma.weddingEvent.create({
      data: {
        slug,
        coupleName,
        eventDate: new Date(eventDate),
        photoLimit: Number.isFinite(photoLimit) ? Math.min(200, Math.max(1, photoLimit)) : 20,
        welcomeText: welcomeText || null,
      },
      select: { id: true },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Onbekende fout'
    const friendly = /unique/i.test(msg)
      ? `De link /w/${slug} bestaat al. Kies een andere slug.`
      : msg
    redirect(`/admin/huwelijken/new?error=${encodeURIComponent(friendly)}`)
  }

  revalidatePath('/admin/huwelijken')
  redirect(`/admin/huwelijken/${created.id}`)
}

export async function updateWeddingAction(formData: FormData) {
  const id = formData.get('id') as string
  const isOpen = formData.get('isOpen') === 'on'
  const photoLimit = parseInt((formData.get('photoLimit') as string) || '20', 10)
  const revealRaw = ((formData.get('revealAt') as string) ?? '').trim()
  const welcomeText = ((formData.get('welcomeText') as string) ?? '').trim()
  const extraRuw = (formData.get('extraEmails') as string) ?? ''

  await prisma.weddingEvent.update({
    where: { id },
    data: {
      isOpen,
      photoLimit: Number.isFinite(photoLimit) ? Math.min(200, Math.max(1, photoLimit)) : 20,
      revealAt: revealRaw ? new Date(revealRaw) : null,
      welcomeText: welcomeText || null,
      // Meteen opgeschoond bewaard: onleesbare regels halen de lijst niet,
      // zodat je bij het versturen niet voor verrassingen staat.
      extraEmails: leesOntvangers(splitsTekstvak(extraRuw)).map((o) =>
        o.naam ? `${o.naam} <${o.email}>` : o.email,
      ),
    },
  })

  revalidatePath(`/admin/huwelijken/${id}`)
  revalidatePath('/admin/huwelijken')

  // Terug naar het schone adres. Zonder dit blijft een oude ?mail=-melding in
  // de URL staan, en blijft bijvoorbeeld "het album staat nog dicht" zichtbaar
  // terwijl je het net hebt opengezet — dan lijkt het alsof opslaan niet werkt.
  redirect(`/admin/huwelijken/${id}`)
}

/** Verbergen i.p.v. verwijderen: de foto telt wel nog mee voor de limiet. */
export async function togglePhotoHiddenAction(photoId: string, eventId: string) {
  const photo = await prisma.weddingPhoto.findUnique({
    where: { id: photoId },
    select: { isHidden: true },
  })
  if (!photo) return

  await prisma.weddingPhoto.update({
    where: { id: photoId },
    data: { isHidden: !photo.isHidden },
  })

  revalidatePath(`/admin/huwelijken/${eventId}`)
}

export async function deleteWeddingAction(formData: FormData) {
  const id = formData.get('id') as string
  await prisma.weddingEvent.delete({ where: { id } })
  revalidatePath('/admin/huwelijken')
  redirect('/admin/huwelijken')
}

/**
 * Stuurt alle gasten met een e-mailadres een bericht dat het album open staat.
 *
 * Twee bewuste keuzes:
 *  • Alleen als het album ook écht open is. Een mail sturen naar een album dat
 *    nog "aan het ontwikkelen" is, levert honderd teleurgestelde gasten op.
 *  • sendOnce houdt per gast bij of de mail al vertrok, dus twee keer drukken
 *    stuurt niemand een dubbele mail. Wie er later bijkomt, krijgt hem alsnog.
 */
export async function stuurAlbumAction(formData: FormData) {
  const id = formData.get('id') as string

  const event = await prisma.weddingEvent.findUnique({
    where: { id },
    select: { id: true, slug: true, coupleName: true, revealAt: true, extraEmails: true },
  })

  if (!event) redirect('/admin/huwelijken')

  if (!event.revealAt || event.revealAt > new Date()) {
    redirect(`/admin/huwelijken/${id}?mail=gesloten`)
  }

  const [gasten, aantalFotos] = await Promise.all([
    prisma.weddingGuest.findMany({
      where: { eventId: id, email: { not: null } },
      select: { id: true, name: true, email: true },
    }),
    prisma.weddingPhoto.count({ where: { eventId: id, isHidden: false } }),
  ])

  const basis = (process.env.NEXTAUTH_URL ?? 'https://studiotwaalf.vercel.app').replace(/\/$/, '')
  const albumUrl = `${basis}/w/${event.slug}/album`

  // Gasten en extra ontvangers door dezelfde molen. Een extra ontvanger die
  // toevallig ook ingecheckt is als gast, krijgt de mail maar één keer.
  const bekend = new Set(gasten.map((g) => g.email!.toLowerCase()))
  const extras = leesOntvangers(event.extraEmails).filter(
    (o) => !bekend.has(o.email.toLowerCase()),
  )

  const ontvangers = [
    ...gasten.map((g) => ({
      referentie: g.id,
      email: g.email!,
      voornaam: g.name.split(' ')[0] as string | null,
    })),
    ...extras.map((o) => ({
      referentie: `event:${event.id}:${o.email.toLowerCase()}`,
      email: o.email,
      voornaam: o.naam,
    })),
  ]

  let verstuurd = 0
  let overgeslagen = 0
  let mislukt = 0

  // In blokjes van acht: honderd mails één voor één duurt te lang voor een
  // serverless functie, alles tegelijk vraagt om rate limits bij Resend.
  const BLOK = 8
  for (let i = 0; i < ontvangers.length; i += BLOK) {
    const resultaten = await Promise.all(
      ontvangers.slice(i, i + BLOK).map((o) =>
        sendAlbumOntwikkeld({
          guestId: o.referentie,
          to: o.email,
          voornaam: o.voornaam,
          coupleName: event.coupleName,
          albumUrl,
          aantalFotos,
        }),
      ),
    )

    for (const r of resultaten) {
      if (r.error) mislukt++
      else if (r.skipped) overgeslagen++
      else verstuurd++
    }
  }

  revalidatePath(`/admin/huwelijken/${id}`)
  redirect(
    `/admin/huwelijken/${id}?mail=klaar&verstuurd=${verstuurd}&overgeslagen=${overgeslagen}&mislukt=${mislukt}&totaal=${ontvangers.length}`,
  )
}
