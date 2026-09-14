/**
 * Leest de extra ontvangers van de albummail uit.
 *
 * Eén per regel, met of zonder naam ervoor:
 *
 *   Amelie <amelie@voorbeeld.be>
 *   fotograaf@voorbeeld.be
 *
 * Die eerste vorm is gewoon hoe e-mailadressen al honderd jaar geschreven
 * worden, dus niemand hoeft iets nieuws te leren. Zonder naam groet de mail
 * neutraal in plaats van met een verzonnen voornaam.
 */

export interface Ontvanger {
  naam: string | null
  email: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Eén regel omzetten. Geeft null terug als er geen bruikbaar adres in staat. */
export function leesRegel(regel: string): Ontvanger | null {
  const schoon = regel.trim()
  if (!schoon) return null

  // Vorm "Naam <adres>"
  const metNaam = schoon.match(/^(.*?)\s*<\s*([^>]+?)\s*>$/)
  if (metNaam) {
    const naam = metNaam[1].trim().replace(/^["']|["']$/g, '')
    const email = metNaam[2].trim()
    return EMAIL.test(email) ? { naam: naam || null, email } : null
  }

  return EMAIL.test(schoon) ? { naam: null, email: schoon } : null
}

/** Hele tekstvak omzetten, met dubbele adressen eruit. */
export function leesOntvangers(regels: string[]): Ontvanger[] {
  const gezien = new Set<string>()
  const uit: Ontvanger[] = []

  for (const regel of regels) {
    const ontvanger = leesRegel(regel)
    if (!ontvanger) continue

    const sleutel = ontvanger.email.toLowerCase()
    if (gezien.has(sleutel)) continue

    gezien.add(sleutel)
    uit.push(ontvanger)
  }

  return uit
}

/** Tekstvak naar losse regels, lege regels eruit. */
export function splitsTekstvak(tekst: string): string[] {
  return tekst
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean)
}
