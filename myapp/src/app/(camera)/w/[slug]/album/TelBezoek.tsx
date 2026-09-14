'use client'

import { useEffect, useRef } from 'react'

/**
 * Meldt één keer per paginabezoek dat het album geopend is.
 *
 * Toont zelf niets. De ref voorkomt dat React's strict mode in ontwikkeling
 * twee keer telt, want die draait effecten bewust dubbel.
 */
export default function TelBezoek({ slug }: { slug: string }) {
  const gemeld = useRef(false)

  useEffect(() => {
    if (gemeld.current) return
    gemeld.current = true

    // Bewust geen await en geen foutafhandeling die iets toont: een bezoeker
    // hoeft nooit te merken dat dit bestaat, ook niet als het misgaat.
    void fetch(`/api/wedding/${slug}/album-view`, { method: 'POST' }).catch(() => undefined)
  }, [slug])

  return null
}
