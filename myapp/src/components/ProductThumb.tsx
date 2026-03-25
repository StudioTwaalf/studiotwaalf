'use client'

/**
 * ProductThumb — renders either an emoji, a next/image (for local /public paths),
 * or a regular <img> (for external/data: URLs as a safe fallback).
 *
 * Usage:
 *   <ProductThumb value={product.emoji} alt={product.name} className="h-24 w-full text-4xl ..." />
 *
 * Props
 *   value      — emoji string OR http/https/data://-prefixed URL OR /public-relative path
 *   alt        — accessible label
 *   className  — applied to the outer container; include h-{n} w-{n} for size
 */

import { useState } from 'react'
import Image from 'next/image'

// ── Helpers ────────────────────────────────────────────────────────────────────

function isImageUrl(v: string): boolean {
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('data:') ||
    v.startsWith('/')
  )
}

/** Local path served from /public — eligible for next/image optimisation */
function isLocalPath(v: string): boolean {
  return v.startsWith('/') && !v.startsWith('//')
}

function looksLikeEmoji(v: string): boolean {
  return !isImageUrl(v) && v.trim().length <= 4
}

const FALLBACK = '📦'

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  value?: string | null
  alt: string
  className?: string
}

export default function ProductThumb({ value, alt, className }: Props) {
  const [imgError, setImgError] = useState(false)

  const v = value?.trim()

  const containerCls = ['flex items-center justify-center overflow-hidden', className]
    .filter(Boolean)
    .join(' ')

  // ── Fallback (no value, or img errored) ──
  if (!v || imgError) {
    return (
      <span className={containerCls} role="img" aria-label={alt}>
        {FALLBACK}
      </span>
    )
  }

  // ── Local /public path → next/image (optimised, lazy-loaded) ──
  if (isLocalPath(v)) {
    return (
      <span className={`${containerCls} relative`}>
        <Image
          src={v}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          // SVGs are vectors; skip the raster optimiser for them
          unoptimized={v.endsWith('.svg')}
          onError={() => setImgError(true)}
        />
      </span>
    )
  }

  // ── data: URL → cannot be optimised by next/image; keep plain <img> ──
  if (v.startsWith('data:')) {
    return (
      <span className={`${containerCls} relative`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={v}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      </span>
    )
  }

  // ── External http/https URL → unoptimised next/image (no domain config needed) ──
  if (isImageUrl(v)) {
    return (
      <span className={`${containerCls} relative`}>
        <Image
          src={v}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          unoptimized
          onError={() => setImgError(true)}
        />
      </span>
    )
  }

  // ── Emoji / short text ──
  if (looksLikeEmoji(v)) {
    return (
      <span className={containerCls} role="img" aria-label={alt}>
        {v}
      </span>
    )
  }

  // ── Unknown — show placeholder ──
  return (
    <span className={containerCls} role="img" aria-label={alt}>
      {FALLBACK}
    </span>
  )
}
