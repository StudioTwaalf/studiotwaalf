import React from 'react'

// ── Variant definitions ────────────────────────────────────────────────────────

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'dark'

const BASE =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

// Light backgrounds always use dark text — dark variant uses white text
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:     'bg-gray-100    text-gray-800',
  secondary:   'bg-indigo-100  text-indigo-700',
  success:     'bg-green-100   text-green-700',
  warning:     'bg-amber-100   text-amber-700',
  destructive: 'bg-red-100     text-red-700',
  dark:        'bg-gray-900    text-white',
}

// Hover colours for interactive uses (e.g. toggle buttons)
const HOVER_CLASSES: Record<BadgeVariant, string> = {
  default:     'hover:bg-gray-200',
  secondary:   'hover:bg-indigo-200',
  success:     'hover:bg-green-200',
  warning:     'hover:bg-amber-200',
  destructive: 'hover:bg-red-200',
  dark:        'hover:bg-gray-800',
}

// ── Utility: className string builder ─────────────────────────────────────────
//
// Use this when you need badge styling on a non-<span> element (e.g. <button>).
//
//   className={badgeClasses('success')}                       → static badge
//   className={badgeClasses('success', { interactive: true })} → with hover

export function badgeClasses(
  variant: BadgeVariant = 'default',
  options: { interactive?: boolean; className?: string } = {},
): string {
  const parts = [
    BASE,
    VARIANT_CLASSES[variant],
    options.interactive ? `${HOVER_CLASSES[variant]} transition-colors cursor-default` : '',
    options.className ?? '',
  ]
  return parts.filter(Boolean).join(' ')
}

// ── <Badge /> component ────────────────────────────────────────────────────────

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export default function Badge({
  variant = 'default',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={[BASE, VARIANT_CLASSES[variant], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </span>
  )
}
