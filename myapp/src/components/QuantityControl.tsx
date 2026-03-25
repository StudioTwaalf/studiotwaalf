'use client'

/**
 * QuantityControl — compact quantity selector driven by QuantityConfig.
 *
 * Three modes:
 *  free        – − / number-input / + with step 1
 *  recommended – dropdown of preset values; optional "Anders…" reveals number input
 *  pack        – − / value / + with step = config.step; label "per {step} stuks"
 *
 * NOTE: All hooks are called unconditionally at top to satisfy the Rules of Hooks.
 */

import { useState } from 'react'
import type { QuantityConfig } from '@/lib/quantity-config'
import { normalizeQuantity } from '@/lib/quantity-config'

interface Props {
  value:    number
  config:   QuantityConfig
  onChange: (qty: number) => void
}

const btnCls =
  'px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed transition-colors select-none'

export default function QuantityControl({ value, config, onChange }: Props) {
  const { mode, min, max, recommended, step = 1, allowCustom = false } = config

  // Hooks always called at top — only the recommended branch uses customRaw
  const isCustomInitial =
    mode === 'recommended' && allowCustom && !!recommended?.length && !recommended.includes(value)
  const [customRaw, setCustomRaw] = useState<string>(isCustomInitial ? String(value) : '')
  const showCustom = mode === 'recommended' && allowCustom && customRaw !== '' && !recommended?.includes(value)

  // ── recommended mode ──────────────────────────────────────────────────────
  if (mode === 'recommended' && recommended?.length) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-gray-500 shrink-0">Aantal</span>
        <select
          value={showCustom ? '__custom__' : String(value)}
          onChange={(e) => {
            if (e.target.value === '__custom__') {
              setCustomRaw(String(value))
            } else {
              setCustomRaw('')
              onChange(Number(e.target.value))
            }
          }}
          className="flex-1 min-w-[70px] rounded border border-gray-300 px-1.5 py-0.5 text-xs bg-white
                     focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {recommended.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
          {allowCustom && <option value="__custom__">Anders…</option>}
        </select>

        {showCustom && (
          <input
            type="number"
            value={customRaw}
            min={min}
            max={max}
            step={1}
            onChange={(e) => {
              setCustomRaw(e.target.value)
              const n = parseInt(e.target.value, 10)
              if (!isNaN(n)) onChange(normalizeQuantity(n, config))
            }}
            className="w-14 rounded border border-indigo-400 px-1.5 py-0.5 text-xs text-center
                       focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        )}
      </div>
    )
  }

  // ── pack mode ─────────────────────────────────────────────────────────────
  if (mode === 'pack') {
    const packStep = step
    const canDec   = value - packStep >= min
    const canInc   = value + packStep <= max

    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-gray-500 shrink-0">Aantal</span>
        <div className="flex items-center rounded border border-gray-300 overflow-hidden">
          <button
            type="button"
            disabled={!canDec}
            onClick={() => onChange(value - packStep)}
            className={btnCls}
          >
            −
          </button>
          <span className="px-2 py-0.5 text-xs font-medium text-gray-800 tabular-nums bg-white
                           min-w-[28px] text-center border-x border-gray-200">
            {value}
          </span>
          <button
            type="button"
            disabled={!canInc}
            onClick={() => onChange(value + packStep)}
            className={btnCls}
          >
            +
          </button>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">per&nbsp;{packStep}</span>
      </div>
    )
  }

  // ── free mode (default) ───────────────────────────────────────────────────
  const canDec = value - 1 >= min
  const canInc = value + 1 <= max

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-gray-500 shrink-0">Aantal</span>
      <div className="flex items-center rounded border border-gray-300 overflow-hidden">
        <button
          type="button"
          disabled={!canDec}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={btnCls}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={1}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10)
            if (!isNaN(n)) onChange(normalizeQuantity(n, config))
          }}
          className="w-10 py-0.5 text-xs font-medium text-center border-x border-gray-200
                     focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500"
        />
        <button
          type="button"
          disabled={!canInc}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={btnCls}
        >
          +
        </button>
      </div>
    </div>
  )
}
