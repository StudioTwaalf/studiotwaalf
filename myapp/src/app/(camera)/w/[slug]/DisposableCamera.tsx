'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { enqueue, startQueue, subscribe, type QueueState } from '@/lib/wedding/uploadQueue'

/**
 * Digitale wegwerpcamera.
 *
 * Bewuste keuzes:
 *  • Geen preview na het schot.  Je ziet je foto's pas als ze "ontwikkeld" zijn.
 *    Dat is precies waarom het leuk is — en het scheelt een hoop UI.
 *  • De teller telt AF (nog 13), zoals een echt filmpje.
 *  • Korrel, vignet en datumstempel worden in de foto gebakken, niet als
 *    CSS-laagje eroverheen — anders staan ze niet op wat het koppel krijgt.
 */

const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82

type Status = 'starting' | 'ready' | 'denied' | 'unsupported' | 'full'

interface Props {
  slug: string
  guestName: string
  photoLimit: number
  initialCount: number
  coupleName: string
}

// ── In-app browsers (Instagram, Facebook, …) blokkeren vaak de camera ────────
function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /FBAN|FBAV|Instagram|Line\/|Snapchat|Pinterest|TikTok/i.test(navigator.userAgent)
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export default function DisposableCamera({
  slug,
  guestName,
  photoLimit,
  initialCount,
  coupleName,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const grainRef = useRef<HTMLCanvasElement | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const busyRef = useRef(false)

  const [status, setStatus] = useState<Status>('starting')
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [taken, setTaken] = useState(initialCount)
  const [flash, setFlash] = useState(false)
  const [queue, setQueue] = useState<QueueState>({ pending: 0, sending: false, error: null })

  const remaining = Math.max(0, photoLimit - taken)

  // ── Wachtrij ───────────────────────────────────────────────────────────────
  useEffect(() => {
    void startQueue()
    return subscribe(setQueue)
  }, [])

  // ── Korreltegel: één keer genereren, daarna herhaald over de foto ─────────
  useEffect(() => {
    const tile = document.createElement('canvas')
    tile.width = 128
    tile.height = 128
    const ctx = tile.getContext('2d')
    if (ctx) {
      const img = ctx.createImageData(128, 128)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 110 + Math.random() * 90
        img.data[i] = v
        img.data[i + 1] = v
        img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
    }
    grainRef.current = tile
  }, [])

  // ── Camerastream ───────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startStream = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }

    stopStream()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setStatus((s) => (s === 'full' ? s : 'ready'))
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported')
    }
  }, [facing, stopStream])

  useEffect(() => {
    if (remaining === 0) {
      setStatus('full')
      stopStream()
      return
    }
    void startStream()
    return stopStream
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, remaining === 0])

  // ── Accu sparen: stream stoppen zodra de tab op de achtergrond gaat ───────
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopStream()
      } else if (remaining > 0) {
        void startStream()
        void requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [startStream, stopStream, remaining])

  // ── Scherm wakker houden tijdens het fotograferen ─────────────────────────
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // Niet kritiek
    }
  }, [])

  useEffect(() => {
    void requestWakeLock()
    return () => {
      void wakeLockRef.current?.release().catch(() => undefined)
      wakeLockRef.current = null
    }
  }, [requestWakeLock])

  // ── De sluiter ─────────────────────────────────────────────────────────────
  const shutterSound = useCallback(() => {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      const dur = 0.06
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
      }
      const src = ctx.createBufferSource()
      src.buffer = buffer
      const gain = ctx.createGain()
      gain.gain.value = 0.35
      src.connect(gain).connect(ctx.destination)
      src.start()
      src.onended = () => void ctx.close().catch(() => undefined)
    } catch {
      // Geluid mag stilletjes falen
    }
  }, [])

  const capture = useCallback(async () => {
    const video = videoRef.current
    if (!video || busyRef.current || status !== 'ready' || remaining === 0) return
    if (!video.videoWidth) return

    busyRef.current = true
    shutterSound()
    setFlash(true)
    setTimeout(() => setFlash(false), 90)

    try {
      const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight))
      const w = Math.round(video.videoWidth * scale)
      const h = Math.round(video.videoHeight * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Voorcamera spiegelen, zodat de foto klopt met wat de gast zag
      if (facing === 'user') {
        ctx.translate(w, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, w, h)
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      applyLook(ctx, w, h, grainRef.current)
      stampDate(ctx, w, h)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
      )
      if (!blob) return

      setTaken((n) => n + 1)
      await enqueue({ id: crypto.randomUUID(), slug, blob, width: w, height: h })
    } finally {
      // Korte rustpauze — voorkomt dat één tik drie foto's maakt
      setTimeout(() => {
        busyRef.current = false
      }, 350)
    }
  }, [facing, remaining, shutterSound, slug, status])

  // ── Schermen die geen camera tonen ─────────────────────────────────────────
  if (status === 'full') {
    return <FilmFinished coupleName={coupleName} photoLimit={photoLimit} queue={queue} />
  }

  if (status === 'denied' || status === 'unsupported') {
    return (
      <NoCameraFallback
        status={status}
        slug={slug}
        remaining={remaining}
        onPicked={() => setTaken((n) => n + 1)}
      />
    )
  }

  // ── De zoeker ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden select-none">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${facing === 'user' ? 'scale-x-[-1]' : ''}`}
      />

      {/* Vignet over de zoeker — puur sfeer, de foto krijgt zijn eigen vignet */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 140px 40px rgba(0,0,0,0.55)' }}
      />

      {/* Flits */}
      {flash && <div className="absolute inset-0 bg-white" />}

      {/* Bovenbalk */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">{coupleName}</p>
          <p className="text-sm text-white/90">Hallo {guestName}</p>
        </div>

        <div className="rounded-full bg-black/50 px-3 py-1.5 text-right backdrop-blur">
          <p className="font-mono text-2xl leading-none text-[#FF7A18]">{remaining}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/60">nog over</p>
        </div>
      </div>

      {/* Status van de wachtrij */}
      {(queue.pending > 0 || queue.error) && (
        <div className="absolute inset-x-0 top-24 flex justify-center px-5">
          <p className="rounded-full bg-black/60 px-4 py-1.5 text-xs text-white/80 backdrop-blur">
            {queue.error
              ? queue.error
              : `${queue.pending} foto${queue.pending === 1 ? '' : "'s"} worden verstuurd…`}
          </p>
        </div>
      )}

      {/* Onderbalk */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-8 pb-10 pt-6">
        <div className="w-14" />

        <button
          type="button"
          onClick={capture}
          aria-label="Foto maken"
          className="h-20 w-20 rounded-full border-4 border-white/90 bg-white/20 backdrop-blur transition active:scale-90"
        >
          <span className="mx-auto block h-14 w-14 rounded-full bg-white" />
        </button>

        <button
          type="button"
          onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          aria-label="Wissel camera"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-xl backdrop-blur active:scale-90"
        >
          ⟲
        </button>
      </div>

      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <p className="animate-pulse text-sm tracking-widest text-white/60">CAMERA STARTEN…</p>
        </div>
      )}
    </div>
  )
}

// ── Beeldbewerking ───────────────────────────────────────────────────────────

/** Vignet + korrel + een warme waas — het "wegwerpcamera"-gevoel. */
function applyLook(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  grain: HTMLCanvasElement | null,
) {
  // Warme waas
  ctx.save()
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = 'rgba(255, 176, 92, 0.10)'
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Vignet
  ctx.save()
  const r = Math.hypot(w, h) / 2
  const gradient = ctx.createRadialGradient(w / 2, h / 2, r * 0.55, w / 2, h / 2, r)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Korrel
  if (grain) {
    ctx.save()
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = 0.14
    const pattern = ctx.createPattern(grain, 'repeat')
    if (pattern) {
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, w, h)
    }
    ctx.restore()
  }
}

/** Datumstempel rechtsonder, in het oranje van een wegwerpcamera. */
function stampDate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const text = `${pad(now.getDate())} ${pad(now.getMonth() + 1)} '${String(now.getFullYear()).slice(2)}`

  const size = Math.max(16, Math.round(Math.min(w, h) * 0.045))
  const margin = Math.round(size * 0.9)

  ctx.save()
  ctx.font = `${size}px "Courier New", ui-monospace, monospace`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.shadowColor = 'rgba(255, 122, 24, 0.85)'
  ctx.shadowBlur = size * 0.55
  ctx.fillStyle = '#FF8A2B'
  ctx.fillText(text, w - margin, h - margin)
  ctx.fillText(text, w - margin, h - margin) // tweede keer = feller
  ctx.restore()
}

// ── Fallback wanneer getUserMedia niet mag of niet kan ───────────────────────

function NoCameraFallback({
  status,
  slug,
  remaining,
  onPicked,
}: {
  status: 'denied' | 'unsupported'
  slug: string
  remaining: number
  onPicked: () => void
}) {
  const inApp = isInAppBrowser()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onPicked()
    await enqueue({ id: crypto.randomUUID(), slug, blob: file, width: 0, height: 0 })
    e.target.value = ''
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-8 text-center text-white">
      <h1 className="font-serif text-2xl">Even iets anders</h1>

      {inApp ? (
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
          Je opende deze pagina vanuit een app (Instagram of Facebook). Die laat de camera
          niet toe. Tik rechtsboven op <span className="text-white">•••</span> en kies{' '}
          <span className="text-white">Open in {isIos() ? 'Safari' : 'Chrome'}</span>.
        </p>
      ) : status === 'denied' ? (
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
          We mogen je camera niet gebruiken. Zet dat aan in je browserinstellingen en herlaad
          deze pagina — of kies hieronder een foto van je toestel.
        </p>
      ) : (
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
          Je browser ondersteunt de camera hier niet. Je kan wel gewoon een foto kiezen.
        </p>
      )}

      {remaining > 0 && (
        <label className="mt-8 cursor-pointer rounded-full bg-white px-6 py-3 text-sm font-medium text-black">
          Foto kiezen ({remaining} over)
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 text-xs uppercase tracking-widest text-white/50 underline"
      >
        Opnieuw proberen
      </button>
    </div>
  )
}

// ── Filmpje vol ──────────────────────────────────────────────────────────────

function FilmFinished({
  coupleName,
  photoLimit,
  queue,
}: {
  coupleName: string
  photoLimit: number
  queue: QueueState
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-8 text-center text-white">
      <p className="font-mono text-6xl text-[#FF7A18]">{photoLimit}</p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/50">foto&apos;s gemaakt</p>

      <h1 className="mt-8 font-serif text-2xl">Je filmpje zit vol</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
        Bedankt om mee te fotograferen. {coupleName} krijgt al je foto&apos;s — en je ziet ze
        zelf zodra ze ontwikkeld zijn.
      </p>

      {queue.pending > 0 && (
        <p className="mt-6 animate-pulse text-xs text-white/50">
          Nog {queue.pending} foto{queue.pending === 1 ? '' : "'s"} aan het versturen — hou deze
          pagina nog even open.
        </p>
      )}
    </div>
  )
}
