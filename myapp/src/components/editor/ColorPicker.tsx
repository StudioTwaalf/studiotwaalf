'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CMYK = [number, number, number, number]

// ─── Color math ───────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex : '#' + hex
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0]
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0'))
      .join('')
  )
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const v = max
  const d = max - min
  const s = max === 0 ? 0 : d / max
  let h = 0
  if (max !== min) {
    if (max === rn)      h = (gn - bn) / d + (gn < bn ? 6 : 0)
    else if (max === gn) h = (bn - rn) / d + 2
    else                 h = (rn - gn) / d + 4
    h /= 6
  }
  return [h * 360, s, v]
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const hn = h / 360
  const i  = Math.floor(hn * 6)
  const f  = hn * 6 - i
  const p  = v * (1 - s)
  const q  = v * (1 - f * s)
  const t  = v * (1 - (1 - f) * s)
  let r = 0, g = 0, b = 0
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function hexToHsv(hex: string): [number, number, number] {
  return rgbToHsv(...hexToRgb(hex))
}

export function hexToCmyk(hex: string): CMYK {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const k = 1 - Math.max(r, g, b)
  if (k >= 1) return [0, 0, 0, 100]
  return [
    Math.round(((1 - r - k) / (1 - k)) * 100),
    Math.round(((1 - g - k) / (1 - k)) * 100),
    Math.round(((1 - b - k) / (1 - k)) * 100),
    Math.round(k * 100),
  ]
}

export function cmykToHex(c: number, m: number, y: number, k: number): string {
  return rgbToHex(
    Math.round(255 * (1 - c / 100) * (1 - k / 100)),
    Math.round(255 * (1 - m / 100) * (1 - k / 100)),
    Math.round(255 * (1 - y / 100) * (1 - k / 100)),
  )
}

// ─── Preset swatches ──────────────────────────────────────────────────────────

const STUDIO_SWATCHES: { hex: string; label: string }[] = [
  { hex: '#FFCED3', label: 'Zacht roze' },
  { hex: '#E8DCBB', label: 'Warm zand' },
  { hex: '#A8BFA3', label: 'Salie groen' },
  { hex: '#E7C46A', label: 'Geel' },
  { hex: '#2C2416', label: 'Donker' },
  { hex: '#FFFFFF', label: 'Wit' },
  { hex: '#F5F0E8', label: 'Crème' },
  { hex: '#B5A48A', label: 'Taupe' },
  { hex: '#7A6A52', label: 'Middenbruin' },
  { hex: '#C8C4BC', label: 'Lichtgrijs' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  value:         string
  onChange:      (hex: string, cmyk?: CMYK) => void
  onLiveChange?: (hex: string) => void
  showCmyk?:     boolean
  compact?:      boolean   // accepted for API compat, ignored
  recentColors?: string[]
  onAddRecent?:  (hex: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColorPicker({
  value,
  onChange,
  onLiveChange,
  showCmyk = false,
  recentColors = [],
  onAddRecent,
}: Props) {
  // Normalise value to valid hex
  const safeValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : '#000000'

  // ── Internal state ─────────────────────────────────────────────────────────
  const [hsv,      setHsv]      = useState<[number, number, number]>(() => hexToHsv(safeValue))
  const [hexInput, setHexInput] = useState(() => safeValue.slice(1).toUpperCase())
  const [rgb,      setRgb]      = useState<[string, string, string]>(() => {
    const [r, g, b] = hexToRgb(safeValue)
    return [String(r), String(g), String(b)]
  })
  const [cmyk,     setCmyk]     = useState<CMYK>(() => hexToCmyk(safeValue))
  const [cmykOpen, setCmykOpen] = useState(showCmyk)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const hsvRef      = useRef<[number, number, number]>(hsv)
  const pickerRef   = useRef<HTMLDivElement>(null)
  const pointerMode = useRef<'picker' | null>(null)
  const lastEmitted = useRef(safeValue)

  // Keep hsvRef in sync
  useEffect(() => { hsvRef.current = hsv }, [hsv])

  // ── Sync from external value (undo/redo) ───────────────────────────────────
  useEffect(() => {
    if (value === lastEmitted.current) return
    const hex = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : '#000000'
    const newHsv = hexToHsv(hex)
    hsvRef.current = newHsv
    setHsv(newHsv)
    setHexInput(hex.slice(1).toUpperCase())
    const [r, g, b] = hexToRgb(hex)
    setRgb([String(r), String(g), String(b)])
    setCmyk(hexToCmyk(hex))
  }, [value])

  // ── Emit helpers ──────────────────────────────────────────────────────────
  const emitLive = useCallback((hex: string) => {
    lastEmitted.current = hex
    onLiveChange?.(hex)
  }, [onLiveChange])

  const emitCommit = useCallback((hex: string) => {
    lastEmitted.current = hex
    onChange(hex, hexToCmyk(hex))
    onAddRecent?.(hex)
  }, [onChange, onAddRecent])

  // ── Shared: update all state from a hex value ──────────────────────────────
  const applyHex = useCallback((hex: string, doCommit: boolean) => {
    const newHsv = hexToHsv(hex)
    hsvRef.current = newHsv
    setHsv(newHsv)
    setHexInput(hex.slice(1).toUpperCase())
    const [r, g, b] = hexToRgb(hex)
    setRgb([String(r), String(g), String(b)])
    setCmyk(hexToCmyk(hex))
    if (doCommit) emitCommit(hex)
    else emitLive(hex)
  }, [emitCommit, emitLive])

  // ── 2D picker drag ────────────────────────────────────────────────────────
  const updateFromPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, doCommit: boolean) => {
      const rect = pickerRef.current?.getBoundingClientRect()
      if (!rect) return
      const s = clamp((e.clientX - rect.left) / rect.width, 0, 1)
      const v = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1)
      const [h] = hsvRef.current
      const newHsv: [number, number, number] = [h, s, v]
      hsvRef.current = newHsv
      setHsv(newHsv)
      const [r, g, b] = hsvToRgb(h, s, v)
      const hex = rgbToHex(r, g, b)
      setHexInput(hex.slice(1).toUpperCase())
      setRgb([String(r), String(g), String(b)])
      setCmyk(hexToCmyk(hex))
      if (doCommit) emitCommit(hex)
      else emitLive(hex)
    },
    [emitCommit, emitLive],
  )

  // ── Hue slider ────────────────────────────────────────────────────────────
  const handleHueChange = useCallback((newHue: number, doCommit: boolean) => {
    const [, s, v] = hsvRef.current
    const newHsv: [number, number, number] = [newHue, s, v]
    hsvRef.current = newHsv
    setHsv(newHsv)
    const [r, g, b] = hsvToRgb(newHue, s, v)
    const hex = rgbToHex(r, g, b)
    setHexInput(hex.slice(1).toUpperCase())
    setRgb([String(r), String(g), String(b)])
    setCmyk(hexToCmyk(hex))
    if (doCommit) emitCommit(hex)
    else emitLive(hex)
  }, [emitCommit, emitLive])

  // ── HEX input ─────────────────────────────────────────────────────────────
  const handleHexInput = (raw: string) => {
    const upper = raw.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 6)
    setHexInput(upper)
    if (upper.length === 6) {
      applyHex('#' + upper.toLowerCase(), true)
    }
  }

  // ── RGB inputs ────────────────────────────────────────────────────────────
  const handleRgbChange = useCallback((ch: 0 | 1 | 2, raw: string) => {
    const next = [...rgb] as [string, string, string]
    next[ch] = raw
    setRgb(next)
    const nums = next.map((v) => parseInt(v, 10))
    if (nums.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
      const hex = rgbToHex(nums[0], nums[1], nums[2])
      const newHsv = rgbToHsv(nums[0], nums[1], nums[2])
      hsvRef.current = newHsv
      setHsv(newHsv)
      setHexInput(hex.slice(1).toUpperCase())
      setCmyk(hexToCmyk(hex))
      emitCommit(hex)
    }
  }, [rgb, emitCommit])

  // ── CMYK ──────────────────────────────────────────────────────────────────
  const handleCmykChange = useCallback(
    (ch: 0 | 1 | 2 | 3, raw: string | number, doCommit = true) => {
      const val = Math.round(clamp(
        typeof raw === 'number' ? raw : parseFloat(raw as string) || 0,
        0, 100,
      ))
      const next = [...cmyk] as CMYK
      next[ch] = val
      setCmyk(next)
      const hex = cmykToHex(next[0], next[1], next[2], next[3])
      const [r, g, b] = hexToRgb(hex)
      const newHsv = rgbToHsv(r, g, b)
      hsvRef.current = newHsv
      setHsv(newHsv)
      setHexInput(hex.slice(1).toUpperCase())
      setRgb([String(r), String(g), String(b)])
      if (doCommit) emitCommit(hex)
      else emitLive(hex)
    },
    [cmyk, emitCommit, emitLive],
  )

  // ── Swatch ────────────────────────────────────────────────────────────────
  const handleSwatch = useCallback((hex: string) => {
    applyHex(hex.toLowerCase(), true)
  }, [applyHex])

  // ── Derived display values ─────────────────────────────────────────────────
  const [hue, sat, val] = hsv
  const pureHueHex = rgbToHex(...hsvToRgb(hue, 1, 1))

  // ── Input class helper ─────────────────────────────────────────────────────
  const inputCls = [
    'w-full border rounded-lg text-[10px] px-2 py-1.5 bg-white text-[#2C2416] text-center tabular-nums',
    'focus:outline-none focus:ring-1 focus:ring-[#E7C46A] focus:border-[#E7C46A]',
    'border-[#E0D5C5]',
  ].join(' ')

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* ── Preset swatches ── */}
      <div>
        <p className="text-[9px] font-semibold text-[#C4B8A0] uppercase tracking-widest mb-1.5">
          Studio Twaalf
        </p>
        <div className="grid grid-cols-10 gap-[3px]">
          {STUDIO_SWATCHES.map(({ hex, label }) => {
            const isActive = safeValue === hex.toLowerCase()
            return (
              <button
                key={hex}
                title={label}
                onClick={() => handleSwatch(hex)}
                className="aspect-square rounded-md transition-all"
                style={{
                  background:  hex,
                  border:      isActive
                    ? '2px solid #B08040'
                    : hex.toUpperCase() === '#FFFFFF' || hex.toUpperCase() === '#F5F0E8'
                    ? '1.5px solid #E0D5C5'
                    : '1.5px solid transparent',
                  boxShadow:  isActive ? '0 0 0 1.5px rgba(176,128,64,0.35)' : undefined,
                  transform:  isActive ? 'scale(1.18)' : undefined,
                  outline: 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* ── Recent colors ── */}
      {recentColors.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-[#C4B8A0] uppercase tracking-widest mb-1.5">
            Recent
          </p>
          <div className="flex flex-wrap gap-[3px]">
            {recentColors.slice(0, 12).map((hex, i) => {
              const isActive = safeValue === hex.toLowerCase()
              return (
                <button
                  key={`${hex}-${i}`}
                  title={hex}
                  onClick={() => handleSwatch(hex)}
                  className="w-5 h-5 rounded-md shrink-0 transition-all"
                  style={{
                    background: hex,
                    border:     isActive
                      ? '2px solid #B08040'
                      : hex.toLowerCase() === '#ffffff'
                      ? '1.5px solid #E0D5C5'
                      : '1.5px solid transparent',
                    boxShadow:  isActive ? '0 0 0 1.5px rgba(176,128,64,0.35)' : undefined,
                    outline:    'none',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── 2D saturation / brightness picker ── */}
      <div
        ref={pickerRef}
        className="relative rounded-xl overflow-hidden select-none"
        style={{ height: 110, touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={(e) => {
          pointerMode.current = 'picker'
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          updateFromPointer(e, false)
        }}
        onPointerMove={(e) => {
          if (pointerMode.current !== 'picker') return
          updateFromPointer(e, false)
        }}
        onPointerUp={(e) => {
          if (pointerMode.current !== 'picker') return
          pointerMode.current = null
          updateFromPointer(e, true)
        }}
      >
        {/* White → hue color gradient */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, #fff, ${pureHueHex})` }}
        />
        {/* Transparent → black overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent, #000)' }}
        />
        {/* Draggable handle */}
        <div
          className="absolute pointer-events-none"
          style={{
            left:        `${sat * 100}%`,
            top:         `${(1 - val) * 100}%`,
            transform:   'translate(-50%, -50%)',
            width:       14,
            height:      14,
            borderRadius: '50%',
            border:      '2px solid #fff',
            background:  safeValue,
            boxShadow:   '0 0 0 1px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {/* ── Hue slider ── */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          height: 14,
          background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
        }}
      >
        {/* Invisible range input for interaction */}
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={hue}
          onChange={(e) => handleHueChange(parseFloat(e.target.value), false)}
          onMouseUp={(e)  => handleHueChange(parseFloat((e.target as HTMLInputElement).value), true)}
          onTouchEnd={(e) => handleHueChange(parseFloat((e.target as HTMLInputElement).value), true)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0"
          style={{ WebkitAppearance: 'none' }}
        />
        {/* Visual thumb */}
        <div
          className="absolute top-1/2 pointer-events-none"
          style={{
            left:        `${(hue / 360) * 100}%`,
            transform:   'translate(-50%, -50%)',
            width:       14,
            height:      14,
            borderRadius: '50%',
            background:  pureHueHex,
            border:      '2px solid #fff',
            boxShadow:   '0 0 0 1px rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {/* ── Color preview + HEX input ── */}
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-xl shrink-0"
          style={{
            background:  safeValue,
            border:      '1.5px solid #E0D5C5',
            boxShadow:   '0 1px 4px rgba(44,36,22,0.1)',
          }}
        />
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <span
            className="text-[10px] font-mono text-[#C4B8A0] shrink-0 select-none"
            style={{ letterSpacing: '0.02em' }}
          >
            #
          </span>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            onBlur={() => setHexInput(safeValue.slice(1).toUpperCase())}
            maxLength={6}
            placeholder="000000"
            spellCheck={false}
            className={[
              'flex-1 min-w-0 border border-[#E0D5C5] rounded-lg font-mono uppercase text-xs',
              'px-2 py-1.5 bg-white text-[#2C2416] text-center tracking-wider',
              'focus:outline-none focus:ring-1 focus:ring-[#E7C46A] focus:border-[#E7C46A]',
            ].join(' ')}
          />
        </div>
      </div>

      {/* ── RGB inputs ── */}
      <div className="grid grid-cols-3 gap-1.5">
        {(['R', 'G', 'B'] as const).map((ch, i) => {
          const val = rgb[i]
          const num = parseInt(val, 10)
          const invalid = isNaN(num) || num < 0 || num > 255
          return (
            <div key={ch}>
              <label className="block text-[9px] font-medium text-[#C4B8A0] mb-1 text-center">
                {ch}
              </label>
              <input
                type="number"
                min={0}
                max={255}
                value={val}
                onChange={(e) => handleRgbChange(i as 0 | 1 | 2, e.target.value)}
                onBlur={() => {
                  const clamped = String(clamp(parseInt(val, 10) || 0, 0, 255))
                  handleRgbChange(i as 0 | 1 | 2, clamped)
                }}
                className={[
                  inputCls,
                  invalid ? 'border-red-300 ring-red-200' : '',
                ].join(' ')}
              />
            </div>
          )
        })}
      </div>

      {/* ── CMYK collapsible section ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid #EDE7D9' }}
      >
        {/* Toggle header */}
        <button
          onClick={() => setCmykOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2 transition-colors"
          style={{ background: cmykOpen ? '#FDF5E0' : '#FAFAF7' }}
        >
          <span className="text-[9px] font-semibold text-[#B5A48A] uppercase tracking-widest">
            CMYK
          </span>
          <div className="flex items-center gap-2">
            {/* Live CMYK preview chips */}
            <span className="text-[9px] font-mono text-[#C4B8A0] tabular-nums">
              {cmyk.join('  ')}
            </span>
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="#C4B8A0" strokeWidth="2.5" strokeLinecap="round"
              style={{
                transform:  cmykOpen ? 'rotate(180deg)' : undefined,
                transition: 'transform 0.15s',
                flexShrink: 0,
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </button>

        {/* Expanded content */}
        {cmykOpen && (
          <div
            className="px-3 py-3 space-y-3"
            style={{ borderTop: '1px solid #EDE7D9', background: '#FAFAF7' }}
          >
            {(['C', 'M', 'Y', 'K'] as const).map((ch, idx) => {
              const CMYK_ACCENT  = ['#00A8CC', '#D9376E', '#D4A017', '#7A6A52'] as const
              const CMYK_END_HEX = ['#00BFFF', '#FF3399', '#FFD700', '#1a1206'] as const
              const thumbPct     = cmyk[idx]  // 0–100
              return (
                <div key={ch} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-bold w-3 shrink-0"
                      style={{ color: CMYK_ACCENT[idx] }}
                    >
                      {ch}
                    </span>
                    {/* Slider track */}
                    <div className="flex-1 relative rounded-full overflow-visible" style={{ height: 10 }}>
                      {/* Gradient track */}
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `linear-gradient(to right, #fff, ${CMYK_END_HEX[idx]})`,
                          border: '1px solid rgba(0,0,0,0.08)',
                        }}
                      />
                      {/* Invisible interactive range input */}
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={cmyk[idx]}
                        onChange={(e)   => handleCmykChange(idx as 0|1|2|3, parseFloat(e.target.value), false)}
                        onMouseUp={(e)  => handleCmykChange(idx as 0|1|2|3, parseFloat((e.target as HTMLInputElement).value), true)}
                        onTouchEnd={(e) => handleCmykChange(idx as 0|1|2|3, parseFloat((e.target as HTMLInputElement).value), true)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0"
                      />
                      {/* Visual thumb */}
                      <div
                        className="absolute top-1/2 pointer-events-none"
                        style={{
                          left:         `${thumbPct}%`,
                          transform:    'translate(-50%, -50%)',
                          width:        12,
                          height:       12,
                          borderRadius: '50%',
                          background:   CMYK_ACCENT[idx],
                          border:       '2px solid #fff',
                          boxShadow:    '0 0 0 1px rgba(0,0,0,0.25)',
                        }}
                      />
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={cmyk[idx]}
                      onChange={(e) => handleCmykChange(idx as 0|1|2|3, e.target.value)}
                      className="w-10 border border-[#E0D5C5] rounded-lg text-[10px] text-center px-1.5 py-1
                                 bg-white text-[#2C2416] tabular-nums shrink-0
                                 focus:outline-none focus:ring-1 focus:ring-[#E7C46A] focus:border-[#E7C46A]"
                    />
                  </div>
                </div>
              )
            })}
            <p className="text-[9px] text-[#D4C8B0] leading-tight pt-0.5">
              CMYK → RGB conversie · voor schermindicatie
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
