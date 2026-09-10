'use client'

import { useEffect, useState } from 'react'

/**
 * Nodigt de gast uit om de camera op zijn beginscherm te zetten.
 *
 * Waarom dit op het check-in scherm staat en niet later: op iOS krijgt een
 * app die vanaf het beginscherm opent zijn eigen opslag, los van Safari.
 * Wie eerst incheckt en daarna pas installeert, moet in de app opnieuw
 * inchecken. Installeren vóór het inchecken voorkomt dat.
 *
 * Android krijgt de echte installatieknop van de browser; iOS kent die niet,
 * daar blijft het bij uitleg over het deelmenu.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const VERBORGEN_SLEUTEL = 'wc-install-hint-verborgen'

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function draaitAlsApp(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export default function InstallHint() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)
  const [toonIosUitleg, setToonIosUitleg] = useState(false)
  const [verborgen, setVerborgen] = useState(true)

  useEffect(() => {
    // Draait al als app, of eerder weggeklikt? Dan niets tonen.
    if (draaitAlsApp()) return
    try {
      if (localStorage.getItem(VERBORGEN_SLEUTEL) === 'ja') return
    } catch {
      // Privémodus kan localStorage blokkeren; dan tonen we hem gewoon
    }

    setVerborgen(false)

    if (isIos()) {
      setToonIosUitleg(true)
      return
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function sluit() {
    setVerborgen(true)
    try {
      localStorage.setItem(VERBORGEN_SLEUTEL, 'ja')
    } catch {
      // Niet kritiek
    }
  }

  async function installeer() {
    if (!prompt) return
    await prompt.prompt()
    await prompt.userChoice
    setPrompt(null)
    sluit()
  }

  if (verborgen) return null
  if (!toonIosUitleg && !prompt) return null

  return (
    <div className="mt-10 w-full max-w-sm rounded-xl border border-studio-beige/20 bg-studio-beige/[0.05] p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-studio-beige/85">Zet de camera op je beginscherm</p>
        <button
          type="button"
          onClick={sluit}
          aria-label="Verberg deze tip"
          className="-mt-1 shrink-0 px-1 text-lg leading-none text-studio-beige/40 hover:text-studio-beige/70"
        >
          ×
        </button>
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-studio-beige/50">
        Dan kan je hem later gewoon terug openen, zonder de QR-code opnieuw te scannen.
      </p>

      {prompt ? (
        <button
          type="button"
          onClick={installeer}
          className="mt-3 w-full rounded-full bg-studio-yellow py-2.5 text-sm font-medium text-studio-black"
        >
          Toevoegen
        </button>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-studio-beige/60">
          Tik onderaan op <span className="text-studio-beige">Deel</span>{' '}
          <span aria-hidden>􀈂</span> en kies{' '}
          <span className="text-studio-beige">Zet op beginscherm</span>.
        </p>
      )}
    </div>
  )
}
