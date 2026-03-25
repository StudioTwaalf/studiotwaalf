'use client'

/**
 * CanvasEditor — professional design editor for TemplateDesign v1.
 * Studio Twaalf visual style: soft, premium, minimal, warm palette.
 *
 * Features:
 *  • Interactive canvas: drag, resize (8 handles), rotate
 *  • Double-click text to edit inline on canvas
 *  • Multi-artboard tabs (voorkant / achterkant)
 *  • Top toolbar: undo, redo, zoom, preview, save, continue
 *  • Left panel (Figma-style icon tabs): Tekst, Illustraties, Uploads, Achtergrond
 *  • Right panel: typography with sliders, colour, position/size
 *  • Layers panel: reorder, duplicate, delete
 *  • Print-safe margin guide overlay on canvas
 *  • Full undo/redo with SET (live drag/slider) + COMMIT (end of interaction)
 *  • Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y/Ctrl+Shift+Z redo, Delete,
 *                        Escape deselect, ±/= zoom, [ ] z-order
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { useHistory } from './useHistory'
import { useAutosave } from './useAutosave'
import ColorPicker, { type CMYK } from './ColorPicker'
import {
  EDITOR_FONTS,
  DEFAULT_TEXT_STYLE,
  HANDLE_SIZE,
  ROTATION_HANDLE_GAP,
  ZOOM_STEPS,
  MIN_ZOOM,
  MAX_ZOOM,
  SNAP_THRESHOLD,
  MARGIN_MM,
} from './constants'
import type {
  TemplateDesign,
  TemplateElement,
  TextElement,
  ShapeElement,
  ImageElement,
  TextStyle,
  ShapeStyle,
} from '@/types/template'
import {
  ILLUSTRATIONS,
  ILLUSTRATION_CATEGORIES,
  filterIllustrations,
  type IllustrationItem,
  type IllustrationCategory,
} from '@/data/illustrations'
import PaperPicker from './PaperPicker'
import TemplateWizard from './TemplateWizard'
import { PAPERS, getPaperTextureFilterParams } from '@/data/papers'
import { CARD_FORMATS, matchFormat } from '@/data/formats'
import { trackEvent } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type LeftTab = 'text' | 'illustrations' | 'uploads' | 'fonts' | 'background' | 'paper' | 'velden'

interface UploadedAsset {
  id:        string
  name:      string
  url:       string
  type:      'image'
  mimeType:  string
  createdAt: number
}

interface UploadedFont {
  id:        string
  name:      string
  url:       string
  format:    'ttf' | 'otf' | 'woff' | 'woff2'
  mimeType:  string
  createdAt: number
}

interface DragState {
  elementId:     string
  startPointerX: number
  startPointerY: number
  startElX:      number
  startElY:      number
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface ResizeState {
  elementId:     string
  handle:        ResizeHandle
  startPointerX: number
  startPointerY: number
  startX:        number
  startY:        number
  startW:        number
  startH:        number
}

interface RotateState {
  elementId:     string
  centerX:       number
  centerY:       number
  startAngle:    number
  startRotation: number
}

/** A single snap guide line shown during drag. */
interface SnapGuide {
  /** 'x' = vertical line (snap along horizontal axis); 'y' = horizontal line. */
  axis:     'x' | 'y'
  /** Position in artboard mm (left for x-guides, top for y-guides). */
  position: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function getElBounds(el: TemplateElement) {
  return {
    x: el.x,
    y: el.y,
    w: (el as ShapeElement).width  ?? (el as TextElement).width  ?? 30,
    h: (el as ShapeElement).height ?? (el as TextElement).height ?? 10,
  }
}

function getElRotation(el: TemplateElement): number {
  return el.rotation ?? 0
}

function patchElement<T extends TemplateElement>(
  design: TemplateDesign,
  id: string,
  patch: Partial<T>,
): TemplateDesign {
  return {
    ...design,
    elements: design.elements.map((el) =>
      el.id === id ? { ...el, ...patch } : el,
    ),
  }
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const SEL = '#B08040'  // warm amber — selection handles & outline

// ─── hexToFilter — approximate CSS filter to tint a black SVG ─────────────────
// Converts a hex colour to a CSS filter chain that colorises black SVG content.
// accuracy is sufficient for illustration tinting in a design tool.

function hexToFilter(hex: string): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return 'none'
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
  let h = 0
  if (max !== min) {
    const d = max - min
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  const hDeg  = Math.round(h * 360)
  const sPct  = Math.round(s * 100)
  const lPct  = Math.round(l * 100)
  const inv   = lPct > 70 ? 88 : lPct > 50 ? 72 : lPct > 30 ? 48 : 18
  const sat   = sPct < 5 ? 0 : Math.min(Math.max(sPct * 6, 100), 2500)
  const sepia = sPct < 5 ? 0 : 100
  return `brightness(0) saturate(100%) invert(${inv}%) sepia(${sepia}%) saturate(${sat}%) hue-rotate(${hDeg}deg)`
}

// ─── IllustrationThumb — grid card in the library panel ──────────────────────

function IllustrationThumb({
  item,
  onAdd,
}: {
  item:  IllustrationItem
  onAdd: (item: IllustrationItem) => void
}) {
  return (
    <button
      title={item.name}
      onClick={() => onAdd(item)}
      className="group aspect-square rounded-xl flex items-center justify-center p-2 transition-all relative overflow-hidden"
      style={{
        background:  '#FAFAF7',
        border:      '1.5px solid #EDE7D9',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.background   = '#FDF5E0'
        el.style.borderColor  = '#D4B050'
        el.style.boxShadow    = '0 2px 8px rgba(176,128,64,0.18)'
        el.style.transform    = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.background   = '#FAFAF7'
        el.style.borderColor  = '#EDE7D9'
        el.style.boxShadow    = ''
        el.style.transform    = ''
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.name}
        style={{
          width:     '70%',
          height:    '70%',
          objectFit: 'contain',
          opacity:   0.75,
          transition: 'opacity 0.15s',
        }}
        className="group-hover:opacity-100"
        draggable={false}
      />
      {/* "add" badge on hover */}
      <div
        className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: '#E7C46A' }}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#2C2416" strokeWidth="3" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </div>
    </button>
  )
}

// ─── UploadedAssetThumb — grid card for user-uploaded images ──────────────────

function UploadedAssetThumb({
  asset,
  onAdd,
  onDelete,
}: {
  asset:    UploadedAsset
  onAdd:    (asset: UploadedAsset) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      title={asset.name}
      role="button"
      tabIndex={0}
      className="group aspect-square rounded-xl flex flex-col items-center justify-center p-1.5 transition-all relative overflow-hidden cursor-pointer"
      style={{ background: '#FAFAF7', border: '1.5px solid #EDE7D9' }}
      onClick={() => onAdd(asset)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onAdd(asset) }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-upload-id', asset.id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background   = '#FDF5E0'
        el.style.borderColor  = '#D4B050'
        el.style.boxShadow    = '0 2px 8px rgba(176,128,64,0.18)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background   = '#FAFAF7'
        el.style.borderColor  = '#EDE7D9'
        el.style.boxShadow    = ''
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.url}
        alt={asset.name}
        style={{ width: '80%', height: '70%', objectFit: 'contain', display: 'block', flexShrink: 0 }}
        draggable={false}
      />
      <p className="text-[8px] text-[#B5A48A] mt-1 w-full truncate text-center px-1 leading-tight">
        {asset.name}
      </p>
      {/* Delete badge */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(asset.id) }}
        className="absolute top-1 right-1 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
        style={{ background: 'rgba(210,70,70,0.88)' }}
        title="Verwijder upload"
      >
        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}

// ─── SliderRow — paired slider + number input ─────────────────────────────────

interface SliderRowProps {
  label:          string
  value:          number
  min:            number
  max:            number
  step:           number
  unit?:          string
  decimals?:      number
  onLiveChange:   (v: number) => void
  onCommit:       (v: number) => void
}

function SliderRow({
  label, value, min, max, step, unit, decimals = 1,
  onLiveChange, onCommit,
}: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-[#C4B8A0]">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step={step}
            min={min}
            max={max}
            value={parseFloat(value.toFixed(decimals))}
            onChange={(e) => onCommit(parseFloat(e.target.value) || min)}
            className="w-14 px-1.5 py-1 border border-[#E0D5C5] rounded-lg text-[10px] text-center
                       text-[#2C2416] bg-white focus:outline-none focus:ring-1 focus:ring-[#E7C46A]
                       focus:border-[#E7C46A] tabular-nums"
          />
          {unit && <span className="text-[10px] text-[#C4B8A0] w-4">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onLiveChange(parseFloat(e.target.value))}
        onMouseUp={(e) => onCommit(parseFloat((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onCommit(parseFloat((e.target as HTMLInputElement).value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#E7C46A' }}
      />
    </div>
  )
}

// ─── SelectionHandles ─────────────────────────────────────────────────────────

function SelectionHandles({
  element,
  scale,
  locked = false,
  onResizeStart,
  onRotateStart,
}: {
  element:       TemplateElement
  scale:         number
  locked?:       boolean
  onResizeStart: (handle: ResizeHandle, e: ReactPointerEvent<HTMLDivElement>) => void
  onRotateStart: (e: ReactPointerEvent<HTMLDivElement>) => void
}) {
  const { x, y, w, h } = getElBounds(element)
  const rotation = getElRotation(element)
  const hs       = HANDLE_SIZE / scale
  const rotGap   = ROTATION_HANDLE_GAP / scale
  // Locked elements show a muted outline without interactive handles
  const outlineColor = locked ? 'rgba(176,128,64,0.45)' : SEL

  const handleStyle = (cx: number, cy: number): React.CSSProperties => ({
    position:    'absolute',
    left:        cx - hs / 2,
    top:         cy - hs / 2,
    width:       hs,
    height:      hs,
    borderRadius: hs / 4,
    background:  '#fff',
    border:      `${1.5 / scale}px solid ${outlineColor}`,
    cursor:      'nwse-resize',
    zIndex:      100,
    boxShadow:   '0 1px 4px rgba(44,36,22,0.2)',
  })

  const handles: { key: ResizeHandle; cx: number; cy: number }[] = [
    { key: 'nw', cx: 0,     cy: 0     },
    { key: 'n',  cx: w / 2, cy: 0     },
    { key: 'ne', cx: w,     cy: 0     },
    { key: 'e',  cx: w,     cy: h / 2 },
    { key: 'se', cx: w,     cy: h     },
    { key: 's',  cx: w / 2, cy: h     },
    { key: 'sw', cx: 0,     cy: h     },
    { key: 'w',  cx: 0,     cy: h / 2 },
  ]

  const CURSOR_MAP: Record<ResizeHandle, string> = {
    nw: 'nw-resize', n: 'n-resize',  ne: 'ne-resize',
    e:  'e-resize',  se: 'se-resize', s:  's-resize',
    sw: 'sw-resize', w:  'w-resize',
  }

  return (
    <div
      style={{
        position:        'absolute',
        left:            x,
        top:             y,
        width:           w,
        height:          h,
        pointerEvents:   'none',
        transform:       rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'top left',
        zIndex:          50,
      }}
    >
      {/* Outline — muted dashes when locked, solid amber when free */}
      <div
        style={{
          position:      'absolute',
          inset:         -(2 / scale),
          border:        `${1.5 / scale}px ${locked ? 'dashed' : 'solid'} ${outlineColor}`,
          borderRadius:  2 / scale,
          pointerEvents: 'none',
          boxShadow:     locked ? undefined : `0 0 0 ${1 / scale}px rgba(176,128,64,0.12)`,
        }}
      />
      {/* Lock badge (top-left) when element is locked */}
      {locked && (
        <div
          style={{
            position:        'absolute',
            top:             -(hs * 1.1),
            left:            0,
            width:           hs,
            height:          hs,
            borderRadius:    '50%',
            background:      'rgba(176,128,64,0.65)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            pointerEvents:   'none',
            zIndex:          100,
          }}
        >
          <svg
            width={hs * 0.55} height={hs * 0.55}
            viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
      )}
      {/* Resize handles — hidden when locked */}
      {!locked && handles.map(({ key, cx, cy }) => (
        <div
          key={key}
          style={{ ...handleStyle(cx, cy), cursor: CURSOR_MAP[key], pointerEvents: 'all' }}
          onPointerDown={(e) => { e.stopPropagation(); onResizeStart(key, e) }}
        />
      ))}
      {/* Rotation handle — hidden when locked */}
      {!locked && (
        <div
          style={{
            position:      'absolute',
            left:          w / 2 - hs / 2,
            top:           -(rotGap + hs),
            width:         hs,
            height:        hs,
            borderRadius:  '50%',
            background:    SEL,
            border:        `${1.5 / scale}px solid #fff`,
            cursor:        'grab',
            zIndex:        100,
            pointerEvents: 'all',
            boxShadow:     '0 1px 5px rgba(44,36,22,0.25)',
          }}
          onPointerDown={(e) => { e.stopPropagation(); onRotateStart(e) }}
        />
      )}
      {/* Rotation stem — hidden when locked */}
      {!locked && (
        <div
          style={{
            position:      'absolute',
            left:          w / 2 - 0.5 / scale,
            top:           -(rotGap),
            width:         1 / scale,
            height:        rotGap,
            background:    SEL,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  templateId:        string
  templateName:      string
  initialDesign:     TemplateDesign
  initialDesignId?:  string | null
  /**
   * When true the editor operates in admin template-builder mode:
   *  • The "Naar gadgets" CTA is replaced by "Opslaan als template"
   *  • A metadata modal captures name / category / tags / thumbnail
   *  • Per-element "Vergrendel voor gebruikers" toggle is shown
   *  • Regular user save + autosave are hidden
   */
  adminMode?:        boolean
  /**
   * Set when editing an existing template.  Clicking "Opslaan als template"
   * will PUT to this template ID rather than POSTing a new one.
   */
  adminTemplateId?:  string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CanvasEditor({
  templateId,
  templateName,
  initialDesign,
  initialDesignId  = null,
  adminMode        = false,
  adminTemplateId  = null,
}: Props) {
  const router = useRouter()

  // ── History / design state ─────────────────────────────────────────────────
  const { design, set, commit, undo, redo, canUndo, canRedo } = useHistory(initialDesign)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeArtboardId, setActiveArtboardId] = useState(initialDesign.artboards[0]?.id ?? '')
  const [selectedId, setSelectedId]             = useState<string | null>(null)
  const [editingTextId, setEditingTextId]       = useState<string | null>(null)
  const [zoom, setZoom]                         = useState(1)
  const [leftTab, setLeftTab]                   = useState<LeftTab>('text')
  const [saveStatus, setSaveStatus]             = useState<SaveStatus>('idle')
  const [saveError, setSaveError]               = useState<string | null>(null)
  const [designId, setDesignId]                 = useState<string | null>(initialDesignId ?? null)
  const [previewMode, setPreviewMode]           = useState(false)

  // ── Admin template builder state ────────────────────────────────────────────
  const [showTemplateModal,  setShowTemplateModal]  = useState(false)

  // ── Interaction state ──────────────────────────────────────────────────────
  const [dragState, setDragState]     = useState<DragState | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [rotateState, setRotateState] = useState<RotateState | null>(null)
  /** Active snap guide lines — shown on canvas during drag, cleared on drop. */
  const [snapGuides, setSnapGuides]   = useState<SnapGuide[]>([])

  // ── Illustration library state ─────────────────────────────────────────────
  const [illSearch,   setIllSearch]   = useState('')
  const [illCategory, setIllCategory] = useState<IllustrationCategory | 'all'>('all')

  // ── Recent colors (shared across all color pickers) ────────────────────────
  const [recentColors, setRecentColors] = useState<string[]>([])
  const addRecentColor = useCallback((hex: string) => {
    setRecentColors((prev) =>
      [hex.toLowerCase(), ...prev.filter((c) => c !== hex.toLowerCase())].slice(0, 12),
    )
  }, [])

  // ── Paper selection ─────────────────────────────────────────────────────────
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)
  const selectedPaper = selectedPaperId
    ? (PAPERS.find((p) => p.id === selectedPaperId) ?? null)
    : null

  // ── Layer controls — session-only, not persisted in design ──────────────────
  // In user mode, elements with isTemplateLocked:true are pre-locked on mount.
  const [lockedIds,  setLockedIds]  = useState<Set<string>>(() =>
    adminMode
      ? new Set<string>()
      : new Set(initialDesign.elements.filter((el) => el.isTemplateLocked).map((el) => el.id)),
  )
  const [hiddenIds,  setHiddenIds]  = useState<Set<string>>(new Set())

  // ── Copy / paste clipboard ──────────────────────────────────────────────────
  const [clipboard, setClipboard] = useState<TemplateElement | null>(null)

  // ── Layer drag-to-reorder ───────────────────────────────────────────────────
  const [dragLayerId,     setDragLayerId]     = useState<string | null>(null)
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null)

  // ── Upload state ───────────────────────────────────────────────────────────
  const [uploadedAssets,  setUploadedAssets]  = useState<UploadedAsset[]>([])
  const [uploadedFonts,   setUploadedFonts]   = useState<UploadedFont[]>([])
  const [uploadError,     setUploadError]     = useState<string | null>(null)
  const [fontError,       setFontError]       = useState<string | null>(null)
  const [isDragOver,      setIsDragOver]      = useState(false)
  const [isFontDragOver,  setIsFontDragOver]  = useState(false)
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false)
  const fileInputRef       = useRef<HTMLInputElement>(null)
  const fontInputRef       = useRef<HTMLInputElement>(null)
  const draggedUploadRef   = useRef<UploadedAsset | null>(null)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const canvasContainerRef  = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(600)

  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setContainerWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Derived ────────────────────────────────────────────────────────────────
  const artboard = (
    activeArtboardId
      ? design.artboards.find((a) => a.id === activeArtboardId)
      : null
  ) ?? design.artboards[0]

  const fitScale     = containerWidth > 0 ? (containerWidth - 80) / artboard.width : 1
  const currentScale = fitScale * zoom
  const displayWidth  = artboard.width  * currentScale
  const displayHeight = artboard.height * currentScale

  /** Ref mirror of currentScale — safe to read inside stable callbacks. */
  const currentScaleRef = useRef(currentScale)
  currentScaleRef.current = currentScale

  /** Ref mirrors for keyboard handler — avoids re-registering on every render. */
  const lockedIdsRef     = useRef(lockedIds)
  const editingTextIdRef = useRef(editingTextId)
  lockedIdsRef.current     = lockedIds
  editingTextIdRef.current = editingTextId

  const selectedEl = selectedId
    ? design.elements.find((el) => el.id === selectedId) ?? null
    : null

  // Elements are rendered in array order — last = highest z-index.
  // The layers panel controls order via drag-to-reorder; no type-based sort.
  const artboardElements = design.elements
    .filter((el) => el.artboardId === artboard.id)

  // (Keyboard shortcuts useEffect is declared below, after duplicateElement / copyElement / pasteElement)

  // ── Element updaters ───────────────────────────────────────────────────────

  /** Live update (no history push) — use for sliders / dragging. */
  const setTextStyleLive = useCallback(
    (id: string, patch: Partial<TextStyle>) => {
      const updated = design.elements.map((el): TemplateElement => {
        if (el.id !== id || el.type !== 'text') return el
        const t = el as TextElement
        return { ...t, style: { ...t.style, ...patch } }
      })
      set({ ...design, elements: updated })
    },
    [design, set],
  )

  /** Committed update — push to history. */
  const updateTextStyle = useCallback(
    (id: string, patch: Partial<TextStyle>, content?: string) => {
      const updated = design.elements.map((el): TemplateElement => {
        if (el.id !== id || el.type !== 'text') return el
        const t = el as TextElement
        return {
          ...t,
          ...(content !== undefined ? { content } : {}),
          style: { ...t.style, ...patch },
        }
      })
      commit({ ...design, elements: updated })
    },
    [design, commit],
  )

  const updateShapeFill = useCallback(
    (id: string, fill: string, fillCmyk?: CMYK) => {
      const updated = design.elements.map((el): TemplateElement => {
        if (el.id !== id || el.type !== 'shape') return el
        const s = el as ShapeElement
        const patch: Partial<ShapeStyle> = { fill }
        if (fillCmyk) patch.fillCmyk = fillCmyk
        return { ...s, style: { ...s.style, ...patch } }
      })
      commit({ ...design, elements: updated })
    },
    [design, commit],
  )

  /** Live shape fill update (no history push — for color picker drag). */
  const setShapeFillLive = useCallback(
    (id: string, fill: string) => {
      const updated = design.elements.map((el): TemplateElement =>
        el.id === id && el.type === 'shape'
          ? { ...el, style: { ...(el as ShapeElement).style, fill } }
          : el,
      )
      set({ ...design, elements: updated })
    },
    [design, set],
  )

  /** Resize the active artboard to a preset format, scaling all its elements proportionally. */
  const changeArtboardFormat = useCallback(
    (formatId: string) => {
      const format = CARD_FORMATS.find((f) => f.id === formatId)
      if (!format) return
      const oldW = artboard.width
      const oldH = artboard.height
      const newW = format.widthMm
      const newH = format.heightMm
      if (oldW === newW && oldH === newH) return
      const scaleX    = newW / oldW
      const scaleY    = newH / oldH
      const scaleFont = Math.sqrt(scaleX * scaleY)

      const updatedElements = design.elements.map((el): TemplateElement => {
        if (el.artboardId !== artboard.id) return el
        const base = {
          ...el,
          x:      el.x      * scaleX,
          y:      el.y      * scaleY,
          width:  el.width  != null ? el.width  * scaleX : undefined,
          height: el.height != null ? el.height * scaleY : undefined,
        }
        if (el.type === 'text') {
          return {
            ...base,
            style: { ...el.style, fontSize: el.style.fontSize * scaleFont },
          } as TextElement
        }
        return base as TemplateElement
      })

      const updatedArtboards = design.artboards.map((a) =>
        a.id === artboard.id ? { ...a, width: newW, height: newH } : a,
      )

      commit({ ...design, artboards: updatedArtboards, elements: updatedElements })
    },
    [design, artboard, commit],
  )

  const addTextElement = useCallback(
    (overrides?: Omit<Partial<TextElement>, 'style'> & { style?: Partial<TextStyle> }) => {
      const cx = artboard.width  / 2
      const cy = artboard.height / 2
      const el: TextElement = {
        id:         newId(),
        type:       'text',
        artboardId: artboard.id,
        name:       overrides?.name ?? 'Tekst',
        editable:   true,
        content:    overrides?.content ?? 'Tekst',
        x:          cx - 25,
        y:          cy - 5,
        width:      50,
        height:     14,
        style:      { ...DEFAULT_TEXT_STYLE, ...overrides?.style },
      }
      commit({ ...design, elements: [...design.elements, el] })
      setSelectedId(el.id)
      // Start inline editing immediately
      setTimeout(() => setEditingTextId(el.id), 50)
    },
    [design, commit, artboard],
  )

  const addImageElement = useCallback(
    (item: IllustrationItem) => {
      const cx = artboard.width  / 2
      const cy = artboard.height / 2
      const { width: dw, height: dh } = item.defaultSize
      const el: ImageElement = {
        id:         newId(),
        type:       'image',
        artboardId: artboard.id,
        name:       item.name,
        src:        item.src,
        x:          cx - dw / 2,
        y:          cy - dh / 2,
        width:      dw,
        height:     dh,
        opacity:    1,
        tintColor:  item.type === 'svg' ? '#2C2416' : undefined,
      }
      commit({ ...design, elements: [...design.elements, el] })
      setSelectedId(el.id)
    },
    [design, commit, artboard],
  )

  /** Live image property update (slider drag — no history push). */
  const setImagePropsLive = useCallback(
    (id: string, patch: Partial<Pick<ImageElement, 'opacity' | 'tintColor'>>) => {
      const updated = design.elements.map((el): TemplateElement =>
        el.id === id && el.type === 'image' ? { ...el, ...patch } : el,
      )
      set({ ...design, elements: updated })
    },
    [design, set],
  )

  /** Committed image property update (history push). */
  const updateImageProps = useCallback(
    (id: string, patch: Partial<Pick<ImageElement, 'opacity' | 'tintColor'>>) => {
      const updated = design.elements.map((el): TemplateElement =>
        el.id === id && el.type === 'image' ? { ...el, ...patch } : el,
      )
      commit({ ...design, elements: updated })
    },
    [design, commit],
  )

  // ── Upload handlers ────────────────────────────────────────────────────────

  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
  const ALLOWED_FONT_TYPES  = ['font/ttf', 'font/otf', 'font/woff', 'font/woff2',
                                'application/x-font-ttf', 'application/x-font-otf',
                                'application/font-woff', 'application/font-woff2']
  const ALLOWED_FONT_EXTS   = ['.ttf', '.otf', '.woff', '.woff2']

  const handleImageUpload = useCallback((files: FileList | File[]) => {
    setUploadError(null)
    const fileArr = Array.from(files)
    const invalid = fileArr.filter((f) => !ALLOWED_IMAGE_TYPES.includes(f.type))
    if (invalid.length) {
      setUploadError(`Ongeldig bestandstype: ${invalid.map((f) => f.name).join(', ')}. Gebruik PNG, JPG, SVG of WebP.`)
      return
    }
    fileArr.forEach((file) => {
      const url  = URL.createObjectURL(file)
      const name = file.name.replace(/\.[^.]+$/, '')
      const asset: UploadedAsset = {
        id:        newId(),
        name,
        url,
        type:      'image',
        mimeType:  file.type,
        createdAt: Date.now(),
      }
      setUploadedAssets((prev) => [asset, ...prev])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFontUpload = useCallback(async (files: FileList | File[]) => {
    setFontError(null)
    const fileArr = Array.from(files)
    const invalid = fileArr.filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return !ALLOWED_FONT_EXTS.includes(ext)
    })
    if (invalid.length) {
      setFontError(`Ongeldig bestandstype: ${invalid.map((f) => f.name).join(', ')}. Gebruik TTF, OTF, WOFF of WOFF2.`)
      return
    }
    const EXT_FORMAT_MAP: Record<string, UploadedFont['format']> = {
      '.ttf': 'ttf', '.otf': 'otf', '.woff': 'woff', '.woff2': 'woff2',
    }
    const CSS_FORMAT_MAP: Record<string, string> = {
      '.ttf': 'truetype', '.otf': 'opentype', '.woff': 'woff', '.woff2': 'woff2',
    }
    for (const file of fileArr) {
      const ext      = ('.' + file.name.split('.').pop()?.toLowerCase()) as UploadedFont['format']
      const fontName = file.name.replace(/\.[^.]+$/, '')
      const url      = URL.createObjectURL(file)
      try {
        const fontFace = new FontFace(fontName, `url(${url}) format('${CSS_FORMAT_MAP[ext]}')`)
        await fontFace.load()
        document.fonts.add(fontFace)
        const font: UploadedFont = {
          id: newId(), name: fontName, url,
          format: EXT_FORMAT_MAP[ext] as UploadedFont['format'],
          mimeType: file.type, createdAt: Date.now(),
        }
        setUploadedFonts((prev) => [font, ...prev])
      } catch {
        URL.revokeObjectURL(url)
        setFontError(`Kon lettertype '${fontName}' niet laden. Controleer of het bestand geldig is.`)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addUploadedAssetElement = useCallback((asset: UploadedAsset) => {
    const cx = artboard.width  / 2
    const cy = artboard.height / 2
    const defaultW = 40
    const defaultH = 40
    const isSvg = asset.mimeType === 'image/svg+xml'
    const el: ImageElement = {
      id:         newId(),
      type:       'image',
      artboardId: artboard.id,
      name:       asset.name,
      src:        asset.url,
      x:          cx - defaultW / 2,
      y:          cy - defaultH / 2,
      width:      defaultW,
      height:     defaultH,
      opacity:    1,
      tintColor:  isSvg ? '#2C2416' : undefined,
    }
    commit({ ...design, elements: [...design.elements, el] })
    setSelectedId(el.id)
  }, [artboard, design, commit])

  const deleteUploadedAsset = useCallback((id: string) => {
    setUploadedAssets((prev) => {
      const asset = prev.find((a) => a.id === id)
      if (asset) URL.revokeObjectURL(asset.url)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const deleteUploadedFont = useCallback((id: string) => {
    setUploadedFonts((prev) => {
      const font = prev.find((f) => f.id === id)
      if (font) URL.revokeObjectURL(font.url)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  // ── Canvas drag-drop from uploads panel ────────────────────────────────────

  const onCanvasDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('application/x-upload-id')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setIsCanvasDragOver(true)
    }
  }, [])

  const onCanvasDragLeave = useCallback(() => {
    setIsCanvasDragOver(false)
  }, [])

  const onCanvasDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsCanvasDragOver(false)
    const assetId = e.dataTransfer.getData('application/x-upload-id')
    if (!assetId) return
    const asset = draggedUploadRef.current ?? uploadedAssets.find((a) => a.id === assetId)
    if (!asset) return

    const wrapper = e.currentTarget.getBoundingClientRect()
    const dropX   = (e.clientX - wrapper.left)  / currentScale
    const dropY   = (e.clientY - wrapper.top)   / currentScale
    const defaultW = 40
    const defaultH = 40
    const isSvg = asset.mimeType === 'image/svg+xml'
    const el: ImageElement = {
      id:         newId(),
      type:       'image',
      artboardId: artboard.id,
      name:       asset.name,
      src:        asset.url,
      x:          dropX - defaultW / 2,
      y:          dropY - defaultH / 2,
      width:      defaultW,
      height:     defaultH,
      opacity:    1,
      tintColor:  isSvg ? '#2C2416' : undefined,
    }
    commit({ ...design, elements: [...design.elements, el] })
    setSelectedId(el.id)
    draggedUploadRef.current = null
  }, [uploadedAssets, currentScale, artboard, design, commit])

  const duplicateElement = useCallback(
    (id: string) => {
      const el = design.elements.find((e) => e.id === id)
      if (!el) return
      const dup: TemplateElement = {
        ...JSON.parse(JSON.stringify(el)),
        id: newId(),
        x: el.x + 5,
        y: el.y + 5,
      }
      commit({ ...design, elements: [...design.elements, dup] })
      setSelectedId(dup.id)
    },
    [design, commit],
  )

  const deleteElement = useCallback(
    (id: string) => {
      commit({ ...design, elements: design.elements.filter((el) => el.id !== id) })
      if (selectedId === id) setSelectedId(null)
      if (editingTextId === id) setEditingTextId(null)
    },
    [design, commit, selectedId, editingTextId],
  )

  const handleZOrderChange = useCallback(
    (id: string, dir: -1 | 1) => {
      const idx = design.elements.findIndex((el) => el.id === id)
      if (idx === -1) return
      const newIdx = clamp(idx + dir, 0, design.elements.length - 1)
      if (newIdx === idx) return
      const els = [...design.elements]
      const [el] = els.splice(idx, 1)
      els.splice(newIdx, 0, el)
      commit({ ...design, elements: els })
    },
    [design, commit],
  )

  /** Move element to the very top of the z-stack (front). */
  const bringToFront = useCallback((id: string) => {
    const idx = design.elements.findIndex((el) => el.id === id)
    if (idx === -1 || idx === design.elements.length - 1) return
    const els = [...design.elements]
    const [el] = els.splice(idx, 1)
    els.push(el)
    commit({ ...design, elements: els })
  }, [design, commit])

  /** Move element to the very bottom of the z-stack (back). */
  const sendToBack = useCallback((id: string) => {
    const idx = design.elements.findIndex((el) => el.id === id)
    if (idx === -1 || idx === 0) return
    const els = [...design.elements]
    const [el] = els.splice(idx, 1)
    els.unshift(el)
    commit({ ...design, elements: els })
  }, [design, commit])

  /** Toggle lock state for an element (prevents drag/resize/rotate). */
  const toggleLock = useCallback((id: string) => {
    setLockedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  /**
   * Admin mode: toggle `isTemplateLocked` on an element.
   * Persisted in the design JSON (committed to history).
   */
  const toggleTemplateLock = useCallback((id: string) => {
    const el = design.elements.find((e) => e.id === id)
    if (!el) return
    commit(patchElement(design, id, { isTemplateLocked: !el.isTemplateLocked } as Partial<TemplateElement>))
  }, [design, commit])

  /** Toggle visibility for an element; deselects if hiding the selected one. */
  const toggleVisible = useCallback((id: string) => {
    const willHide = !hiddenIds.has(id)
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (willHide) setSelectedId((sel) => (sel === id ? null : sel))
  }, [hiddenIds])

  /** Copy selected element to the clipboard. */
  const copyElement = useCallback(() => {
    if (!selectedEl) return
    setClipboard(JSON.parse(JSON.stringify(selectedEl)))
  }, [selectedEl])

  /** Paste the clipboard element onto the current artboard (offset +5mm). */
  const pasteElement = useCallback(() => {
    if (!clipboard) return
    const el: TemplateElement = {
      ...JSON.parse(JSON.stringify(clipboard)),
      id:         newId(),
      x:          clipboard.x + 5,
      y:          clipboard.y + 5,
      artboardId: artboard.id,
    }
    commit({ ...design, elements: [...design.elements, el] })
    setSelectedId(el.id)
  }, [clipboard, design, commit, artboard])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  // Placed here so duplicateElement / copyElement / pasteElement are in scope.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); undo()
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault(); redo()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault(); duplicateElement(selectedId)
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId) {
        // Copy — don't preventDefault so system clipboard still works for text
        copyElement()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault(); pasteElement()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        commit({ ...design, elements: design.elements.filter((el) => el.id !== selectedId) })
        setSelectedId(null)
      } else if (e.key === 'Escape') {
        setSelectedId(null)
      } else if (e.key === '=' || e.key === '+') {
        setZoom((z) => clamp(z * 1.2, MIN_ZOOM, MAX_ZOOM))
      } else if (e.key === '-') {
        setZoom((z) => clamp(z / 1.2, MIN_ZOOM, MAX_ZOOM))
      } else if (e.key === '0') {
        setZoom(1)
      } else if (e.key === '[' && selectedId) {
        e.preventDefault(); handleZOrderChange(selectedId, -1)
      } else if (e.key === ']' && selectedId) {
        e.preventDefault(); handleZOrderChange(selectedId, 1)
      } else if (
        selectedId &&
        !editingTextIdRef.current &&
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
         e.key === 'ArrowUp'   || e.key === 'ArrowDown')
      ) {
        // Arrow key nudge — 1 canvas px (Shift = 10 canvas px)
        if (lockedIdsRef.current.has(selectedId)) return
        e.preventDefault()
        const stepPx = e.shiftKey ? 10 : 1
        const stepMm = stepPx / currentScaleRef.current
        const el     = design.elements.find((el) => el.id === selectedId)
        if (!el) return
        const dx = e.key === 'ArrowLeft' ? -stepMm : e.key === 'ArrowRight' ? stepMm : 0
        const dy = e.key === 'ArrowUp'   ? -stepMm : e.key === 'ArrowDown'  ? stepMm : 0
        commit(patchElement(design, selectedId, { x: el.x + dx, y: el.y + dy } as Partial<TemplateElement>))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, design, canUndo, canRedo, duplicateElement, copyElement, pasteElement, clipboard])

  /** Reorder layers: drag fromId to the position of toId in the visual list. */
  const handleLayerDrop = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return
    const els      = [...design.elements]
    const fromIdx  = els.findIndex((el) => el.id === fromId)
    const toIdx    = els.findIndex((el) => el.id === toId)
    if (fromIdx === -1 || toIdx === -1) return
    const [item]   = els.splice(fromIdx, 1)
    // Re-find toId after the splice (index may have shifted)
    const newToIdx = els.findIndex((el) => el.id === toId)
    if (newToIdx === -1) return
    // Visual list is reversed: dropping above toId (visual) → insert after toId (array)
    els.splice(newToIdx + 1, 0, item)
    commit({ ...design, elements: els })
  }, [design, commit])

  // ── Drag ──────────────────────────────────────────────────────────────────

  const onElementPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, el: TemplateElement) => {
      if (previewMode || editingTextId === el.id) return
      e.stopPropagation()
      setSelectedId(el.id)
      // Locked elements: allow selection but block dragging
      if (lockedIds.has(el.id)) return
      setDragState({
        elementId:     el.id,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startElX:      el.x,
        startElY:      el.y,
      })
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [previewMode, editingTextId, lockedIds],
  )

  const onElementPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragState) return
      const scale  = currentScaleRef.current
      const deltaX = (e.clientX - dragState.startPointerX) / scale
      const deltaY = (e.clientY - dragState.startPointerY) / scale
      const rawX   = dragState.startElX + deltaX
      const rawY   = dragState.startElY + deltaY

      // ── Snap computation ──────────────────────────────────────────────────
      // Find the dragged element's dimensions
      const dragged = design.elements.find((el) => el.id === dragState.elementId)
      if (!dragged) return
      const { w, h } = getElBounds(dragged)

      // Build snap target lists from artboard center, print margins, and sibling elements
      const artCenterX = artboard.width  / 2
      const artCenterY = artboard.height / 2
      const snapXTargets: number[] = [artCenterX, MARGIN_MM, artboard.width  - MARGIN_MM]
      const snapYTargets: number[] = [artCenterY, MARGIN_MM, artboard.height - MARGIN_MM]

      for (const other of artboardElements) {
        if (other.id === dragState.elementId) continue
        const ob = getElBounds(other)
        snapXTargets.push(ob.x, ob.x + ob.w / 2, ob.x + ob.w)
        snapYTargets.push(ob.y, ob.y + ob.h / 2, ob.y + ob.h)
      }

      // Try snapping element center, left edge, right edge to X targets
      let finalX = rawX
      let guideX: number | null = null
      outer_x: for (const tx of snapXTargets) {
        for (const [elEdge, offset] of [
          [rawX + w / 2, -w / 2],  // center → tx
          [rawX,         0       ],  // left edge → tx
          [rawX + w,     -w      ],  // right edge → tx
        ] as [number, number][]) {
          if (Math.abs(elEdge - tx) <= SNAP_THRESHOLD) {
            finalX  = tx + offset
            guideX  = tx
            break outer_x
          }
        }
      }

      // Try snapping element center, top edge, bottom edge to Y targets
      let finalY = rawY
      let guideY: number | null = null
      outer_y: for (const ty of snapYTargets) {
        for (const [elEdge, offset] of [
          [rawY + h / 2, -h / 2],  // center → ty
          [rawY,         0       ],  // top edge → ty
          [rawY + h,     -h      ],  // bottom edge → ty
        ] as [number, number][]) {
          if (Math.abs(elEdge - ty) <= SNAP_THRESHOLD) {
            finalY  = ty + offset
            guideY  = ty
            break outer_y
          }
        }
      }

      // Update guide lines
      const guides: SnapGuide[] = []
      if (guideX !== null) guides.push({ axis: 'x', position: guideX })
      if (guideY !== null) guides.push({ axis: 'y', position: guideY })
      setSnapGuides(guides)

      const updated = design.elements.map((el): TemplateElement =>
        el.id === dragState.elementId
          ? { ...el, x: finalX, y: finalY }
          : el,
      )
      set({ ...design, elements: updated })
    },
    [dragState, design, set, artboard, artboardElements],
  )

  const onElementPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragState) {
        const scale  = currentScaleRef.current
        const deltaX = (e.clientX - dragState.startPointerX) / scale
        const deltaY = (e.clientY - dragState.startPointerY) / scale
        if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) commit(design)
        setDragState(null)
        setSnapGuides([])
      }
    },
    [dragState, currentScale, design, commit],
  )

  // ── Resize ────────────────────────────────────────────────────────────────

  const onResizeStart = useCallback(
    (id: string, handle: ResizeHandle, e: ReactPointerEvent<HTMLDivElement>) => {
      if (previewMode || lockedIds.has(id)) return
      e.stopPropagation()
      const el = design.elements.find((el) => el.id === id)
      if (!el) return
      const { x, y, w, h } = getElBounds(el)
      setResizeState({
        elementId:     id,
        handle,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startX:        x,
        startY:        y,
        startW:        w,
        startH:        h,
      })
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [design, previewMode, lockedIds],
  )

  const onResizeMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!resizeState) return
      const dx  = (e.clientX - resizeState.startPointerX) / currentScale
      const dy  = (e.clientY - resizeState.startPointerY) / currentScale
      const MIN = 3

      let { startX: x, startY: y, startW: w, startH: h } = resizeState
      const { handle } = resizeState

      if (handle.includes('e')) { w = Math.max(MIN, w + dx) }
      if (handle.includes('s')) { h = Math.max(MIN, h + dy) }
      if (handle.includes('w')) { x = x + Math.min(dx, w - MIN); w = Math.max(MIN, w - dx) }
      if (handle.includes('n')) { y = y + Math.min(dy, h - MIN); h = Math.max(MIN, h - dy) }

      const updated = design.elements.map((el): TemplateElement => {
        if (el.id !== resizeState.elementId) return el
        return { ...el, x, y, width: w, height: h }
      })
      set({ ...design, elements: updated })
    },
    [resizeState, currentScale, design, set],
  )

  const onResizeEnd = useCallback(() => {
    if (resizeState) { commit(design); setResizeState(null) }
  }, [resizeState, design, commit])

  // ── Rotate ────────────────────────────────────────────────────────────────

  const onRotateStart = useCallback(
    (id: string, e: ReactPointerEvent<HTMLDivElement>) => {
      if (previewMode || lockedIds.has(id)) return
      e.stopPropagation()
      const el = design.elements.find((el) => el.id === id)
      if (!el) return
      const { x, y, w, h } = getElBounds(el)
      const innerDiv = (e.currentTarget as HTMLElement).closest('[data-inner-canvas]')
      if (!innerDiv) return
      const rect = innerDiv.getBoundingClientRect()
      const cx   = rect.left + (x + w / 2) * currentScale
      const cy   = rect.top  + (y + h / 2) * currentScale
      const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
      setRotateState({ elementId: id, centerX: cx, centerY: cy, startAngle, startRotation: el.rotation ?? 0 })
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [design, currentScale, previewMode, lockedIds],
  )

  const onRotateMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!rotateState) return
      const currentAngle = Math.atan2(
        e.clientY - rotateState.centerY,
        e.clientX - rotateState.centerX,
      ) * (180 / Math.PI)
      let rotation = rotateState.startRotation + (currentAngle - rotateState.startAngle)
      if (e.shiftKey) rotation = Math.round(rotation / 15) * 15
      rotation = ((rotation % 360) + 360) % 360
      const updated = design.elements.map((el): TemplateElement =>
        el.id === rotateState.elementId ? { ...el, rotation } : el,
      )
      set({ ...design, elements: updated })
    },
    [rotateState, design, set],
  )

  const onRotateEnd = useCallback(() => {
    if (rotateState) { commit(design); setRotateState(null) }
  }, [rotateState, design, commit])

  const onCanvasPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragState)   onElementPointerMove(e)
      if (resizeState) onResizeMove(e)
      if (rotateState) onRotateMove(e)
    },
    [dragState, resizeState, rotateState, onElementPointerMove, onResizeMove, onRotateMove],
  )

  const onCanvasPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      onElementPointerUp(e)
      onResizeEnd()
      onRotateEnd()
    },
    [onElementPointerUp, onResizeEnd, onRotateEnd],
  )

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    setSaveError(null)
    try {
      if (!designId) {
        const res = await fetch('/api/designs', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ templateId, data: design }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          setSaveError(json.error ?? 'Kon niet opslaan.')
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 4000)
          return
        }
        const json = await res.json() as { id: string }
        setDesignId(json.id)
        router.replace(`/design/${templateId}?design=${json.id}`, { scroll: false })
        trackEvent({ event: 'start_design', template_id: templateId, template_name: templateName })
      } else {
        const res = await fetch(`/api/designs/${designId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ data: design }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          setSaveError(json.error ?? 'Kon niet opslaan.')
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 4000)
          return
        }
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveError('Netwerkfout — probeer opnieuw.')
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 4000)
    }
  }, [design, designId, templateId, router])

  // ── Autosave ────────────────────────────────────────────────────────────────
  //
  // The hook fires automatically after `debounceMs` ms of inactivity whenever
  // `design` changes.  It only activates once `designId` is non-null (i.e.
  // after the user has performed at least one manual save that creates the
  // server-side record).
  //
  // The hook is intentionally separate from `handleSave` so the two never
  // race on POST (only the manual button creates a new design record).
  // Autosave exclusively uses PUT on the existing record.

  /** PUT-only save callback for the autosave hook. */
  const autoSaveDesign = useCallback(
    async (snapshot: TemplateDesign): Promise<{ ok: boolean; error?: string }> => {
      // designId is guaranteed non-null by useAutosave before this is called
      if (!designId) return { ok: false }
      try {
        const res = await fetch(`/api/designs/${designId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ data: snapshot }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string }
          return { ok: false, error: json.error }
        }
        return { ok: true }
      } catch {
        return { ok: false, error: 'Netwerkfout' }
      }
    },
    [designId],
  )

  const { autoSaveStatus, hasPendingChanges, flush: flushAutosave } = useAutosave({
    design,
    designId,
    onSave:     autoSaveDesign,
    debounceMs: 1200,
  })

  // ── Navigation protection ───────────────────────────────────────────────────
  //
  // Warn the user if they try to close/navigate away while there are unsaved
  // changes.  Uses refs so the event listener is registered only once (mount)
  // and always reads the latest values without needing to re-register.

  const autoSaveStatusRef  = useRef(autoSaveStatus)
  const designIdGuardRef   = useRef(designId)
  const canUndoGuardRef    = useRef(canUndo)
  autoSaveStatusRef.current = autoSaveStatus
  designIdGuardRef.current  = designId
  canUndoGuardRef.current   = canUndo

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const autosavePending =
        autoSaveStatusRef.current === 'pending' ||
        autoSaveStatusRef.current === 'saving'  ||
        autoSaveStatusRef.current === 'error'

      // New design (never saved) with at least one edit in history
      const neverSaved = !designIdGuardRef.current && canUndoGuardRef.current

      if (autosavePending || neverSaved) {
        e.preventDefault()
        // Legacy support: returnValue triggers the browser's "Leave site?" dialog
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, []) // Registered once — reads live values via refs

  // ── Shared style helpers ───────────────────────────────────────────────────

  const inputCls = [
    'w-full px-2.5 py-1.5 border border-[#E0D5C5] rounded-lg text-xs bg-white',
    'focus:outline-none focus:ring-1 focus:ring-[#E7C46A] focus:border-[#E7C46A]',
    'text-[#2C2416] placeholder:text-[#C4B8A0]',
  ].join(' ')

  const sectionLabel = 'text-[10px] font-semibold text-[#B5A48A] uppercase tracking-widest'

  // ── Render: canvas elements ────────────────────────────────────────────────

  function renderCanvasElement(el: TemplateElement) {
    // Hidden elements are invisible on canvas but remain in the layers panel
    if (hiddenIds.has(el.id)) return null
    const isInteractive      = !previewMode
    const isLocked           = lockedIds.has(el.id)
    const isCurrentlyEditing = editingTextId === el.id

    const baseStyle: React.CSSProperties = {
      position:         'absolute',
      left:             el.x,
      top:              el.y,
      ...(el.rotation ? { transform: `rotate(${el.rotation}deg)`, transformOrigin: 'top left' } : {}),
    }

    if (el.type === 'shape') {
      const s = el as ShapeElement
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            width:           s.width,
            height:          s.height,
            backgroundColor: s.style.fill && s.style.fill !== 'none' ? s.style.fill : 'transparent',
            border:          s.style.stroke && s.style.stroke !== 'none'
              ? `${s.style.strokeWidth ?? 0}px solid ${s.style.stroke}` : 'none',
            opacity:         s.style.opacity ?? 1,
            borderRadius:    s.shapeType === 'ellipse' ? '50%' : undefined,
            cursor:          isInteractive
              ? isLocked ? 'not-allowed'
              : dragState?.elementId === el.id ? 'grabbing' : 'grab'
              : 'default',
            userSelect:      'none',
            WebkitUserSelect:'none',
            pointerEvents:   isInteractive ? 'all' : 'none',
          }}
          onPointerDown={(e) => isInteractive && onElementPointerDown(e, el)}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
        />
      )
    }

    if (el.type === 'image') {
      const img = el as ImageElement
      if (!img.src || (!img.src.startsWith('/') && !img.src.startsWith('http') && !img.src.startsWith('blob:'))) return null
      const isSvg   = img.src.toLowerCase().endsWith('.svg')
      const imgFilter = isSvg && img.tintColor ? hexToFilter(img.tintColor) : undefined
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            width:         img.width,
            height:        img.height,
            opacity:       img.opacity ?? 1,
            cursor:        isInteractive
              ? isLocked ? 'not-allowed'
              : dragState?.elementId === el.id ? 'grabbing' : 'grab'
              : 'default',
            userSelect:    'none',
            WebkitUserSelect: 'none',
            pointerEvents: isInteractive ? 'all' : 'none',
          }}
          onPointerDown={(e) => isInteractive && onElementPointerDown(e, el)}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.src}
            alt={img.name ?? ''}
            style={{
              width:     '100%',
              height:    '100%',
              objectFit: 'contain',
              display:   'block',
              filter:    imgFilter,
            }}
            draggable={false}
          />
        </div>
      )
    }

    if (el.type === 'text') {
      const t  = el as TextElement
      const s  = t.style
      const tw = t.width  ?? 40
      const th = t.height ?? 10

      const sharedTextStyle: React.CSSProperties = {
        fontFamily:    `${s.fontFamily}, Arial, sans-serif`,
        fontSize:      s.fontSize,
        fontWeight:    s.fontWeight   ?? 400,
        fontStyle:     s.fontStyle    ?? 'normal',
        color:         s.color,
        lineHeight:    s.lineHeight   ?? 1.2,
        textAlign:     s.textAlign    ?? 'left',
        letterSpacing: s.letterSpacing != null ? `${s.letterSpacing}em` : undefined,
        whiteSpace:    'pre-wrap',
      }

      // ── Inline editing mode ──────────────────────────────────────────────
      if (isCurrentlyEditing) {
        return (
          <textarea
            key={el.id}
            autoFocus
            style={{
              ...baseStyle,
              ...sharedTextStyle,
              width:      tw,
              height:     th,
              background: 'rgba(255,253,245,0.85)',
              border:     `${1.5 / currentScale}px solid ${SEL}`,
              borderRadius: 2 / currentScale,
              outline:    'none',
              resize:     'none',
              padding:    0,
              margin:     0,
              overflow:   'hidden',
              cursor:     'text',
              boxSizing:  'border-box',
              userSelect: 'text',
              zIndex:     60,
            }}
            value={t.content}
            onChange={(e) => {
              set(patchElement<TextElement>(design, t.id, { content: e.target.value }))
            }}
            onBlur={() => {
              commit(design)
              setEditingTextId(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          />
        )
      }

      // ── Normal display mode ──────────────────────────────────────────────
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            ...sharedTextStyle,
            ...(t.width  != null ? { width:  t.width  } : {}),
            ...(t.height != null ? { height: t.height } : {}),
            overflow:      'visible',
            cursor:        isInteractive
              ? isLocked ? 'not-allowed'
              : dragState?.elementId === el.id ? 'grabbing' : 'grab'
              : 'default',
            userSelect:    'none',
            WebkitUserSelect: 'none',
            pointerEvents: isInteractive ? 'all' : 'none',
          }}
          onPointerDown={(e) => isInteractive && onElementPointerDown(e, el)}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onDoubleClick={(e) => {
            if (!previewMode) {
              e.stopPropagation()
              setSelectedId(el.id)
              setEditingTextId(el.id)
            }
          }}
        >
          {t.content}
        </div>
      )
    }

    return null
  }

  // ── Render: properties panel ───────────────────────────────────────────────

  function renderPropertiesPanel() {
    if (!selectedEl) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-5 text-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: '#F0E8D4' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4B8A0" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-[#7A6A52] mb-1">Geen element geselecteerd</p>
            <p className="text-[10px] text-[#C4B8A0] leading-relaxed">
              Klik op een element op het canvas om het te bewerken
            </p>
          </div>
          <p className="text-[10px] text-[#D4C8B0] mt-1 leading-relaxed">
            Dubbelklik op een tekstvak<br />om direct te typen
          </p>
          <p className="text-[10px] text-[#D4C8B0] leading-relaxed">
            Klik een illustratie in de<br />bibliotheek om toe te voegen
          </p>
        </div>
      )
    }

    return (
      <div className="divide-y divide-[#EDE7D9]">

        {/* ── Text properties ── */}
        {selectedEl.type === 'text' && (() => {
          const t = selectedEl as TextElement
          const s = t.style
          return (
            <>
              {/* Content */}
              <div className="p-4 space-y-1">
                <p className={sectionLabel + ' mb-3'}>Inhoud</p>
                <textarea
                  rows={3}
                  value={t.content}
                  onChange={(e) => updateTextStyle(t.id, {}, e.target.value)}
                  spellCheck={false}
                  placeholder="Typ hier je tekst…"
                  className={`${inputCls} resize-none leading-relaxed text-sm`}
                />
                <p className="text-[9px] text-[#D4C8B0] pt-0.5">
                  Of dubbelklik op de tekst in het canvas
                </p>
              </div>

              {/* Typography */}
              <div className="p-4 space-y-4">
                <p className={sectionLabel}>Lettertype</p>

                {/* Font family */}
                <div>
                  <label className="block text-[10px] text-[#C4B8A0] mb-1.5">Familie</label>
                  <select
                    value={s.fontFamily}
                    onChange={(e) => updateTextStyle(t.id, { fontFamily: e.target.value })}
                    className={inputCls}
                    style={{ fontFamily: s.fontFamily }}
                  >
                    <optgroup label="Studio Twaalf">
                      {EDITOR_FONTS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                          {f.label}
                        </option>
                      ))}
                    </optgroup>
                    {uploadedFonts.length > 0 && (
                      <optgroup label="Geüploade lettertypes">
                        {uploadedFonts.map((f) => (
                          <option key={f.id} value={f.name} style={{ fontFamily: f.name }}>
                            {f.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Font weight */}
                <div>
                  <label className="block text-[10px] text-[#C4B8A0] mb-1.5">Gewicht</label>
                  <div className="flex gap-1">
                    {([300, 400, 500, 700] as const).map((w) => (
                      <button
                        key={w}
                        onClick={() => updateTextStyle(t.id, { fontWeight: w })}
                        className="flex-1 py-1.5 rounded-lg text-[10px] border transition-all"
                        style={{
                          fontWeight:  w,
                          background:  (s.fontWeight ?? 400) === w ? '#FDF5E0' : '#fff',
                          color:       (s.fontWeight ?? 400) === w ? '#8B5E1A' : '#B5A48A',
                          borderColor: (s.fontWeight ?? 400) === w ? '#E7C46A' : '#E0D5C5',
                        }}
                      >
                        {w === 300 ? 'Dun' : w === 400 ? 'Normaal' : w === 500 ? 'Mid' : 'Vet'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font size slider */}
                <SliderRow
                  label="Grootte"
                  unit="mm"
                  value={s.fontSize}
                  min={1}
                  max={30}
                  step={0.5}
                  decimals={1}
                  onLiveChange={(v) => setTextStyleLive(t.id, { fontSize: v })}
                  onCommit={(v) => updateTextStyle(t.id, { fontSize: v })}
                />

                {/* Letter spacing slider */}
                <SliderRow
                  label="Spatiëring"
                  unit="em"
                  value={s.letterSpacing ?? 0}
                  min={-0.05}
                  max={0.5}
                  step={0.01}
                  decimals={2}
                  onLiveChange={(v) => setTextStyleLive(t.id, { letterSpacing: v })}
                  onCommit={(v) => updateTextStyle(t.id, { letterSpacing: v })}
                />

                {/* Line height slider */}
                <SliderRow
                  label="Regelafstand"
                  value={s.lineHeight ?? 1.2}
                  min={0.8}
                  max={3}
                  step={0.05}
                  decimals={2}
                  onLiveChange={(v) => setTextStyleLive(t.id, { lineHeight: v })}
                  onCommit={(v) => updateTextStyle(t.id, { lineHeight: v })}
                />
              </div>

              {/* Alignment + italic */}
              <div className="p-4 space-y-3">
                <p className={sectionLabel}>Opmaak</p>
                <div className="flex gap-1.5">
                  {(['left', 'center', 'right'] as const).map((align) => {
                    const icons = {
                      left:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h12M3 18h15"/></svg>,
                      center: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M6 12h12M4 18h16"/></svg>,
                      right:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M9 12h12M6 18h15"/></svg>,
                    }
                    const isActive = (s.textAlign ?? 'left') === align
                    return (
                      <button
                        key={align}
                        onClick={() => updateTextStyle(t.id, { textAlign: align })}
                        title={align}
                        className="flex-1 py-2 rounded-lg flex items-center justify-center border transition-all"
                        style={{
                          background:  isActive ? '#FDF5E0' : '#fff',
                          color:       isActive ? '#8B5E1A' : '#B5A48A',
                          borderColor: isActive ? '#E7C46A' : '#E0D5C5',
                        }}
                      >
                        {icons[align]}
                      </button>
                    )
                  })}
                  <button
                    onClick={() =>
                      updateTextStyle(t.id, { fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic' })
                    }
                    className="flex-1 py-2 rounded-lg border text-xs font-bold italic transition-all"
                    style={{
                      background:  s.fontStyle === 'italic' ? '#FDF5E0' : '#fff',
                      color:       s.fontStyle === 'italic' ? '#8B5E1A' : '#B5A48A',
                      borderColor: s.fontStyle === 'italic' ? '#E7C46A' : '#E0D5C5',
                    }}
                    title="Cursief"
                  >
                    I
                  </button>
                </div>
              </div>

              {/* Color */}
              <div className="p-4 space-y-3">
                <p className={sectionLabel}>Kleur</p>
                <ColorPicker
                  value={s.color ?? '#000000'}
                  onChange={(hex) => updateTextStyle(t.id, { color: hex })}
                  onLiveChange={(hex) => setTextStyleLive(t.id, { color: hex })}
                  recentColors={recentColors}
                  onAddRecent={addRecentColor}
                />
              </div>
            </>
          )
        })()}

        {/* ── Image / illustration properties ── */}
        {selectedEl.type === 'image' && (() => {
          const img = selectedEl as ImageElement
          const isSvg = img.src.toLowerCase().endsWith('.svg')
          return (
            <>
              {/* Opacity */}
              <div className="p-4 space-y-3">
                <p className={sectionLabel}>Weergave</p>
                <SliderRow
                  label="Doorzichtigheid"
                  unit="%"
                  value={Math.round((img.opacity ?? 1) * 100)}
                  min={0}
                  max={100}
                  step={1}
                  decimals={0}
                  onLiveChange={(v) => setImagePropsLive(img.id, { opacity: v / 100 })}
                  onCommit={(v) => updateImageProps(img.id, { opacity: v / 100 })}
                />
              </div>

              {/* SVG colour tint */}
              {isSvg && (
                <div className="p-4 space-y-3">
                  <p className={sectionLabel}>Kleur</p>
                  <ColorPicker
                    value={img.tintColor ?? '#2C2416'}
                    onChange={(hex) => updateImageProps(img.id, { tintColor: hex })}
                    onLiveChange={(hex) => setImagePropsLive(img.id, { tintColor: hex })}
                    recentColors={recentColors}
                    onAddRecent={addRecentColor}
                  />
                  <p className="text-[9px] text-[#D4C8B0] leading-tight">
                    Past de kleur van de SVG-illustratie aan
                  </p>
                </div>
              )}
            </>
          )
        })()}

        {/* ── Shape properties ── */}
        {selectedEl.type === 'shape' && (() => {
          const sh = selectedEl as ShapeElement
          return (
            <div className="p-4 space-y-4">
              <p className={sectionLabel}>Kleur</p>
              <ColorPicker
                value={sh.style.fill && sh.style.fill !== 'none' ? sh.style.fill : '#ffffff'}
                onChange={(hex, cmyk) => updateShapeFill(sh.id, hex, cmyk)}
                onLiveChange={(hex) => setShapeFillLive(sh.id, hex)}
                showCmyk
                recentColors={recentColors}
                onAddRecent={addRecentColor}
              />
              <SliderRow
                label="Doorzichtigheid"
                unit="%"
                value={Math.round((sh.style.opacity ?? 1) * 100)}
                min={0}
                max={100}
                step={1}
                decimals={0}
                onLiveChange={(v) => {
                  const opacity = v / 100
                  const updated = design.elements.map((el): TemplateElement =>
                    el.id === sh.id && el.type === 'shape'
                      ? { ...el, style: { ...(el as ShapeElement).style, opacity } } : el
                  )
                  set({ ...design, elements: updated })
                }}
                onCommit={(v) => {
                  const opacity = v / 100
                  const updated = design.elements.map((el): TemplateElement =>
                    el.id === sh.id && el.type === 'shape'
                      ? { ...el, style: { ...(el as ShapeElement).style, opacity } } : el
                  )
                  commit({ ...design, elements: updated })
                }}
              />
            </div>
          )
        })()}

        {/* ── Position & size (all element types) ── */}
        <div className="p-4 space-y-3">
          <p className={sectionLabel}>Positie &amp; afmeting</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'X',       key: 'x', val: Math.round(selectedEl.x * 10) / 10 },
              { label: 'Y',       key: 'y', val: Math.round(selectedEl.y * 10) / 10 },
              { label: 'Breedte', key: 'w', val: Math.round(getElBounds(selectedEl).w * 10) / 10 },
              { label: 'Hoogte',  key: 'h', val: Math.round(getElBounds(selectedEl).h * 10) / 10 },
            ].map(({ label, key, val }) => (
              <div key={key}>
                <label className="block text-[10px] text-[#C4B8A0] mb-1">
                  {label} <span className="text-[#D4C8B0]">mm</span>
                </label>
                <input
                  type="number"
                  step={0.5}
                  value={val}
                  className={inputCls + ' text-center'}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0
                    if (key === 'x') commit(patchElement(design, selectedEl.id, { x: v }))
                    else if (key === 'y') commit(patchElement(design, selectedEl.id, { y: v }))
                    else if (key === 'w') {
                      if (selectedEl.type === 'shape') commit(patchElement<ShapeElement>(design, selectedEl.id, { width: v }))
                      else if (selectedEl.type === 'image') commit(patchElement<ImageElement>(design, selectedEl.id, { width: v }))
                      else commit(patchElement<TextElement>(design, selectedEl.id, { width: v }))
                    } else if (key === 'h') {
                      if (selectedEl.type === 'shape') commit(patchElement<ShapeElement>(design, selectedEl.id, { height: v }))
                      else if (selectedEl.type === 'image') commit(patchElement<ImageElement>(design, selectedEl.id, { height: v }))
                      else commit(patchElement<TextElement>(design, selectedEl.id, { height: v }))
                    }
                  }}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[10px] text-[#C4B8A0] mb-1">
              Rotatie <span className="text-[#D4C8B0]">°</span>
            </label>
            <input
              type="number"
              step={1}
              min={0}
              max={360}
              value={Math.round(getElRotation(selectedEl))}
              onChange={(e) =>
                commit(patchElement(design, selectedEl.id, { rotation: parseFloat(e.target.value) || 0 }))
              }
              className={inputCls + ' text-center'}
            />
          </div>
        </div>

        {/* ── Lock banner ── */}
        {lockedIds.has(selectedEl.id) && (
          <div
            className="mx-4 mb-0 mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[10px]"
            style={{ background: '#FDF5E0', border: '1px solid #E7C46A', color: '#6B4E1A' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B08040" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <span className="font-medium">Laag is vergrendeld — beweging geblokkeerd</span>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="p-4 space-y-2">
          <p className={sectionLabel}>Acties</p>
          <div className="grid grid-cols-2 gap-1.5">

            {/* Row 1: Dupliceer + Kopieer */}
            <button
              onClick={() => duplicateElement(selectedEl.id)}
              title="Dupliceer (⌘D)"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#E0D5C5] rounded-xl text-xs font-medium text-[#5C4D3A] hover:bg-[#FAF5EC] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Dupliceer
            </button>
            <button
              onClick={() => copyElement()}
              title="Kopieer (⌘C)"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#E0D5C5] rounded-xl text-xs font-medium text-[#5C4D3A] hover:bg-[#FAF5EC] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              Kopieer
            </button>

            {/* Row 2: Voorgrond + Achtergrond */}
            <button
              onClick={() => bringToFront(selectedEl.id)}
              title="Naar voorgrond"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#E0D5C5] rounded-xl text-xs font-medium text-[#5C4D3A] hover:bg-[#FAF5EC] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 11 12 6 7 11"/><line x1="12" y1="6" x2="12" y2="18"/>
              </svg>
              Voorgrond
            </button>
            <button
              onClick={() => sendToBack(selectedEl.id)}
              title="Naar achtergrond"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#E0D5C5] rounded-xl text-xs font-medium text-[#5C4D3A] hover:bg-[#FAF5EC] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7 13 12 18 17 13"/><line x1="12" y1="18" x2="12" y2="6"/>
              </svg>
              Achtergrond
            </button>

            {/* Row 3: Lock + Verwijder */}
            {adminMode ? (
              /* Admin: toggle isTemplateLocked for this element */
              <button
                onClick={() => toggleTemplateLock(selectedEl.id)}
                title={selectedEl.isTemplateLocked ? 'Gebruiker mag bewerken' : 'Vergrendel voor gebruikers'}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                style={selectedEl.isTemplateLocked ? {
                  background: '#FFF3E0', border: '1px solid #F0B060', color: '#8B4513',
                } : {
                  background: 'white', border: '1px solid #E0D5C5', color: '#5C4D3A',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  {selectedEl.isTemplateLocked
                    ? <path d="M7 11V7a5 5 0 0110 0v4"/>
                    : <path d="M7 11V7a5 5 0 019.9-1"/>
                  }
                </svg>
                {selectedEl.isTemplateLocked ? 'Geblokkeerd' : 'Blokkeer voor user'}
              </button>
            ) : selectedEl.isTemplateLocked ? (
              /* User mode: template-locked — just a badge, no toggle */
              <div
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium select-none"
                style={{ background: '#FFF3E0', border: '1px solid #F0B060', color: '#8B4513', cursor: 'default' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Admin vergrendeld
              </div>
            ) : (
              /* User mode: regular session lock */
              <button
                onClick={() => toggleLock(selectedEl.id)}
                title={lockedIds.has(selectedEl.id) ? 'Ontgrendel laag' : 'Vergrendel laag'}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                style={lockedIds.has(selectedEl.id) ? {
                  background: '#FDF5E0', border: '1px solid #E7C46A', color: '#6B4E1A',
                } : {
                  background: 'white', border: '1px solid #E0D5C5', color: '#5C4D3A',
                }}
              >
                {lockedIds.has(selectedEl.id) ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 019.9-1"/>
                  </svg>
                )}
                {lockedIds.has(selectedEl.id) ? 'Ontgrendel' : 'Vergrendel'}
              </button>
            )}
            <button
              onClick={() => deleteElement(selectedEl.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-500 hover:bg-red-100 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
              Verwijder
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: layers panel ───────────────────────────────────────────────────

  function renderLayersPanel() {
    // Top of list = highest z-index (last in array)
    const artboardEls = [...design.elements]
      .filter((el) => el.artboardId === artboard.id)
      .reverse()

    return (
      <div style={{ borderTop: '1px solid #EDE7D9' }}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <p className={sectionLabel}>Lagen</p>
          <span
            className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md"
            style={{ background: '#F0E8D4', color: '#B5A48A' }}
          >
            {artboardEls.length}
          </span>
        </div>

        {/* Layer rows */}
        <div className="overflow-y-auto" style={{ maxHeight: 250 }}>
          {artboardEls.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[#C4B8A0] italic">Geen lagen</p>
          ) : (
            artboardEls.map((el) => {
              const isSelected  = el.id === selectedId
              const isHidden    = hiddenIds.has(el.id)
              const isLocked    = lockedIds.has(el.id)
              const isDragOver  = dragOverLayerId === el.id
              const isDragging  = dragLayerId === el.id

              const label = el.type === 'text'
                ? (el as TextElement).content.slice(0, 24) || (el as TextElement).name
                : el.type === 'image'
                ? (el as ImageElement).name || 'illustratie'
                : (el as ShapeElement).name || 'vorm'

              // Type icon (SVG)
              const typeIcon =
                el.type === 'text' ? (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                  </svg>
                ) : el.type === 'shape' ? (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                ) : (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )

              return (
                <div
                  key={el.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('x-layer-id', el.id)
                    setDragLayerId(el.id)
                  }}
                  onDragEnd={() => {
                    setDragLayerId(null)
                    setDragOverLayerId(null)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverLayerId(el.id)
                  }}
                  onDragLeave={() => setDragOverLayerId(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    const fromId = e.dataTransfer.getData('x-layer-id')
                    if (fromId && fromId !== el.id) handleLayerDrop(fromId, el.id)
                    setDragLayerId(null)
                    setDragOverLayerId(null)
                  }}
                  onClick={() => {
                    if (!isHidden) setSelectedId(isSelected ? null : el.id)
                  }}
                  className="group relative flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-xs transition-colors select-none"
                  style={{
                    background:   isSelected ? '#FDF5E0' : undefined,
                    color:        isHidden ? '#C4B8A0' : isSelected ? '#6B4E1A' : '#7A6A52',
                    opacity:      isDragging ? 0.45 : 1,
                    borderTop:    isDragOver ? '2px solid #E7C46A' : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#FAF5EC'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = ''
                  }}
                >
                  {/* ── Drag grip ── */}
                  <span
                    className="shrink-0 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-[#C4B8A0]"
                    style={{ fontSize: 10, lineHeight: 1, letterSpacing: '-1px' }}
                    title="Versleep om volgorde te wijzigen"
                  >
                    ⠿
                  </span>

                  {/* ── Type icon badge ── */}
                  <span
                    className="shrink-0 w-4 h-4 flex items-center justify-center rounded"
                    style={{
                      background: isSelected ? '#E7C46A' : '#F0E8D4',
                      color:      isSelected ? '#2C2416' : '#B5A48A',
                    }}
                  >
                    {typeIcon}
                  </span>

                  {/* ── Label ── */}
                  <span
                    className="flex-1 truncate min-w-0 text-[11px]"
                    style={{ textDecoration: isHidden ? 'line-through' : undefined }}
                    title={label}
                  >
                    {label}
                  </span>

                  {/* ── Visibility icon (always shows if hidden; shows on hover otherwise) ── */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisible(el.id) }}
                    className={`shrink-0 transition-all ${isHidden ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:text-[#E7C46A]`}
                    style={{ color: isHidden ? '#E7C46A' : '#C4B8A0' }}
                    title={isHidden ? 'Toon laag' : 'Verberg laag'}
                  >
                    {isHidden ? (
                      /* eye-off */
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      /* eye */
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>

                  {/* ── Lock icon ── */}
                  {adminMode ? (
                    /* Admin: toggle isTemplateLocked (persisted in design JSON) */
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleTemplateLock(el.id) }}
                      className={`shrink-0 transition-all ${el.isTemplateLocked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      style={{ color: el.isTemplateLocked ? '#C4873A' : '#C4B8A0' }}
                      title={el.isTemplateLocked ? 'Gebruiker mag niet bewerken — klik om te ontgrendelen' : 'Vergrendel voor gebruikers'}
                    >
                      {el.isTemplateLocked ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 019.9-1"/>
                        </svg>
                      )}
                    </button>
                  ) : el.isTemplateLocked ? (
                    /* User mode: template-locked — show static icon, no toggle */
                    <span
                      className="shrink-0 opacity-100"
                      style={{ color: '#C4873A' }}
                      title="Vergrendeld door admin"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    </span>
                  ) : (
                    /* User mode: session lock toggle */
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLock(el.id) }}
                      className={`shrink-0 transition-all ${isLocked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:text-[#E7C46A]`}
                      style={{ color: isLocked ? '#B08040' : '#C4B8A0' }}
                      title={isLocked ? 'Ontgrendel laag' : 'Vergrendel laag'}
                    >
                      {isLocked ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 019.9-1"/>
                        </svg>
                      )}
                    </button>
                  )}

                  {/* ── Delete (hover only) ── */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteElement(el.id) }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-all hover:text-red-400"
                    style={{ color: '#C4B8A0' }}
                    title="Verwijder laag"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ── Left panel tab definitions ─────────────────────────────────────────────

  const LEFT_TABS: { key: LeftTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'text',
      label: 'Tekst',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
      ),
    },
    {
      key: 'illustrations',
      label: 'Illustraties',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      key: 'uploads',
      label: 'Uploads',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
      ),
    },
    {
      key: 'fonts',
      label: 'Lettertypes',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
          <path d="M8 16h8" />
        </svg>
      ),
    },
    {
      key: 'background',
      label: 'Achtergrond',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      ),
    },
    {
      key: 'paper',
      label: 'Papier',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M8 13h8M8 17h5"/>
        </svg>
      ),
    },
    // Admin-only: Velden overview
    ...(adminMode ? [{
      key: 'velden' as LeftTab,
      label: 'Velden',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      ),
    }] : []),
  ]

  // ── Text presets for left panel ─────────────────────────────────────────────

  const TEXT_PRESETS = [
    {
      label:   'Voeg titel toe',
      preview: 'Titel',
      style: {
        fontFamily:    'Fraunces',
        fontSize:      10,
        fontWeight:    700,
        color:         '#111111',
        letterSpacing: 0,
        lineHeight:    1.1,
        textAlign:     'center' as const,
      },
      width: 60,
    },
    {
      label:   'Voeg subtitel toe',
      preview: 'Subtitel',
      style: {
        fontFamily:    'Fraunces',
        fontSize:      5.5,
        fontWeight:    400,
        fontStyle:     'italic' as const,
        color:         '#4A3C2E',
        letterSpacing: 0.02,
        lineHeight:    1.3,
        textAlign:     'center' as const,
      },
      width: 55,
    },
    {
      label:   'Voeg kleine tekst toe',
      preview: 'Kleine tekst',
      style: {
        fontFamily:    'Manrope',
        fontSize:      3.2,
        fontWeight:    300,
        color:         '#7A6A52',
        letterSpacing: 0.04,
        lineHeight:    1.5,
        textAlign:     'center' as const,
      },
      width: 55,
    },
  ]

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#F0EDE8' }}>

      {/* ══ Top toolbar ═══════════════════════════════════════════════════════ */}
      <header
        className="flex items-center gap-1.5 px-4 shrink-0 z-20 select-none"
        style={{
          height:       56,
          background:   '#FAFAF7',
          borderBottom: '1px solid #E8DDD0',
          boxShadow:    '0 1px 4px rgba(44,36,22,0.06)',
        }}
      >
        <a
          href={adminMode ? '/admin/templates' : '/templates'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#B5A48A] hover:text-[#5C4D3A] hover:bg-[#F0E8D4] transition-all shrink-0"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {adminMode ? 'Admin' : 'Templates'}
        </a>

        <div className="w-px h-5 shrink-0" style={{ background: '#E8DDD0' }} />
        <span className="text-sm font-semibold text-[#2C2416] truncate max-w-[160px] mx-1">
          {adminMode && <span className="text-[10px] font-medium text-[#C4873A] mr-1.5 uppercase tracking-widest">Admin</span>}
          {templateName}
        </span>
        <div className="w-px h-5 shrink-0" style={{ background: '#E8DDD0' }} />

        <button onClick={undo} disabled={!canUndo} title="Ongedaan maken (Ctrl+Z)"
          className="p-2 rounded-lg text-[#7A6A52] hover:bg-[#F0E8D4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
          </svg>
        </button>
        <button onClick={redo} disabled={!canRedo} title="Opnieuw (Ctrl+Y)"
          className="p-2 rounded-lg text-[#7A6A52] hover:bg-[#F0E8D4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
          </svg>
        </button>

        <div className="w-px h-5 shrink-0" style={{ background: '#E8DDD0' }} />

        <button onClick={() => setZoom((z) => clamp(z / 1.25, MIN_ZOOM, MAX_ZOOM))}
          className="p-2 rounded-lg text-[#7A6A52] hover:bg-[#F0E8D4] transition-colors font-bold text-sm leading-none" title="Uitzoomen (-)">−</button>
        <select value={zoom.toFixed(2)} onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="text-xs border border-[#E0D5C5] rounded-lg px-2 py-1.5 bg-white text-[#2C2416] focus:outline-none focus:ring-1 focus:ring-[#E7C46A] w-[68px] text-center">
          {ZOOM_STEPS.map((z) => <option key={z} value={z.toFixed(2)}>{Math.round(z * 100)}%</option>)}
        </select>
        <button onClick={() => setZoom((z) => clamp(z * 1.25, MIN_ZOOM, MAX_ZOOM))}
          className="p-2 rounded-lg text-[#7A6A52] hover:bg-[#F0E8D4] transition-colors font-bold text-sm leading-none" title="Inzoomen (+)">+</button>
        <button onClick={() => setZoom(1)}
          className="px-2 py-1.5 rounded-lg text-[10px] font-medium text-[#B5A48A] hover:bg-[#F0E8D4] hover:text-[#5C4D3A] transition-colors" title="Passend (0)">Passend</button>

        <div className="w-px h-5 shrink-0" style={{ background: '#E8DDD0' }} />

        <button
          onClick={() => { setPreviewMode((p) => !p); setSelectedId(null); setEditingTextId(null) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
          style={{
            background:  previewMode ? '#FDF5E0' : '#fff',
            color:       previewMode ? '#8B5E1A' : '#7A6A52',
            borderColor: previewMode ? '#E7C46A' : '#E0D5C5',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          {previewMode ? 'Bewerken' : 'Preview'}
        </button>

        <div className="flex-1" />

        {/* ── Admin mode: save-as-template CTA ─────────────────────────────── */}
        {adminMode ? (
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl ml-1 transition-all"
            style={{ background: '#E7C46A', color: '#2C2416' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            {adminTemplateId ? 'Template bijwerken' : 'Opslaan als template'}
          </button>
        ) : (
          /* ── User mode: regular save + autosave status + "Naar gadgets" ── */
          <>
            <div className="flex flex-col items-end gap-0.5">
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={[
                  'flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all border',
                  'focus:outline-none focus:ring-2 focus:ring-[#E7C46A] focus:ring-offset-1',
                  saveStatus === 'saving' ? 'bg-[#F5EFE4] text-[#C4B8A0] border-[#E8DDD0] cursor-not-allowed' : '',
                  saveStatus === 'saved'  ? 'bg-green-50 text-green-700 border-green-200' : '',
                  saveStatus === 'error'  ? 'bg-red-50 text-red-700 border-red-200' : '',
                  saveStatus === 'idle'   ? 'bg-white text-[#2C2416] border-[#E0D5C5] hover:bg-[#FAF5EC]' : '',
                ].join(' ')}
              >
                {saveStatus === 'saving' && 'Opslaan…'}
                {saveStatus === 'saved'  && '✓ Opgeslagen'}
                {saveStatus === 'error'  && 'Fout — opnieuw'}
                {saveStatus === 'idle'   && (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                      <polyline points="17,21 17,13 7,13 7,21"/>
                      <polyline points="7,3 7,8 15,8"/>
                    </svg>
                    Opslaan
                  </>
                )}
              </button>
              {saveStatus === 'error' && saveError && (
                <p className="text-[10px] text-red-500 max-w-[200px] text-right">{saveError}</p>
              )}
              {saveStatus === 'idle' && autoSaveStatus === 'saving' && (
                <p className="text-[10px] leading-none select-none" style={{ color: '#C4B8A0' }}>↻&thinsp;Bewaren…</p>
              )}
              {saveStatus === 'idle' && autoSaveStatus === 'saved' && (
                <p className="text-[10px] leading-none select-none" style={{ color: '#8AAD8A' }}>✓&thinsp;Automatisch bewaard</p>
              )}
              {saveStatus === 'idle' && autoSaveStatus === 'error' && (
                <p className="text-[10px] leading-none select-none" style={{ color: '#C4873A' }}>⚠&thinsp;Niet bewaard</p>
              )}
              {saveStatus === 'idle' && autoSaveStatus === 'pending' && hasPendingChanges && (
                <p className="text-[10px] leading-none select-none" style={{ color: '#D4C9B8' }}>●</p>
              )}
            </div>

            {designId ? (
              <a href={`/design/${templateId}/gadgets?design=${designId}${selectedPaperId ? `&paper=${selectedPaperId}` : ''}`}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl ml-1 transition-all"
                style={{ background: '#E7C46A', color: '#2C2416' }}>
                Verder naar gadgets
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            ) : (
              <span title="Sla het ontwerp eerst op"
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl ml-1 cursor-not-allowed select-none"
                style={{ background: '#F0E8D4', color: '#C4B8A0' }}>
                Verder naar gadgets
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            )}
          </>
        )}
      </header>

      {/* ══ Body ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ───────────────────────────────────────────────────── */}
        {!previewMode && (
          <aside className="shrink-0 flex overflow-hidden"
            style={{ width: 264, borderRight: '1px solid #E8DDD0', background: '#FAFAF7' }}>

            {/* Icon strip */}
            <div className="flex flex-col items-center pt-3 pb-4 gap-1 shrink-0"
              style={{ width: 52, borderRight: '1px solid #EDE7D9', background: '#F5EFE9' }}>
              {LEFT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setLeftTab(tab.key)}
                  title={tab.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: leftTab === tab.key ? '#E7C46A' : 'transparent',
                    color:      leftTab === tab.key ? '#2C2416' : '#B5A48A',
                    boxShadow:  leftTab === tab.key ? '0 1px 4px rgba(176,128,64,0.25)' : undefined,
                  }}
                  onMouseEnter={(e) => { if (leftTab !== tab.key) (e.currentTarget as HTMLElement).style.background = '#EDE7D9' }}
                  onMouseLeave={(e) => { if (leftTab !== tab.key) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {tab.icon}
                </button>
              ))}
            </div>

            {/* Content panel */}
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #EDE7D9' }}>
                <p className="text-xs font-semibold text-[#5C4D3A]">
                  {LEFT_TABS.find((t) => t.key === leftTab)?.label}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">

                {/* ─ Tekst tab ─ */}
                {leftTab === 'text' && (
                  <div className="space-y-3">
                    {/* Quick add presets */}
                    {TEXT_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => addTextElement({
                          name:    preset.preview,
                          content: preset.preview,
                          width:   preset.width,
                          style:   preset.style as Partial<TextStyle>,
                        })}
                        className="w-full px-4 py-3 bg-white border border-[#E8DDD0] rounded-xl text-left transition-all group"
                        onMouseEnter={(e) => {
                          const el = e.currentTarget
                          el.style.background = '#FAF5EC'
                          el.style.borderColor = '#D4C4A0'
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget
                          el.style.background = '#fff'
                          el.style.borderColor = '#E8DDD0'
                        }}
                      >
                        {/* Preview */}
                        <div
                          style={{
                            fontFamily:    preset.style.fontFamily,
                            fontSize:      `${clamp((preset.style.fontSize ?? 4) * 1.6, 11, 20)}px`,
                            fontWeight:    preset.style.fontWeight,
                            fontStyle:     (preset.style as { fontStyle?: string }).fontStyle ?? 'normal',
                            color:         '#2C2416',
                            letterSpacing: preset.style.letterSpacing ? `${preset.style.letterSpacing}em` : undefined,
                            lineHeight:    1.2,
                            marginBottom:  4,
                          }}
                        >
                          {preset.preview}
                        </div>
                        {/* Label */}
                        <div className="text-[10px] text-[#B5A48A] font-medium">
                          {preset.label}
                          <span className="ml-1.5 text-[#D4C8B0]">
                            · {preset.style.fontFamily} {preset.style.fontSize}mm
                          </span>
                        </div>
                      </button>
                    ))}

                    {/* Generic add button */}
                    <button
                      onClick={() => addTextElement()}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed text-xs font-medium flex items-center justify-center gap-2 transition-all text-[#C4B8A0]"
                      style={{ borderColor: '#E0D5C5' }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget
                        el.style.borderColor = '#E7C46A'
                        el.style.color = '#8B5E1A'
                        el.style.background = '#FDF5E0'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget
                        el.style.borderColor = '#E0D5C5'
                        el.style.color = '#C4B8A0'
                        el.style.background = 'transparent'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Leeg tekstvak
                    </button>
                  </div>
                )}

                {/* ─ Illustraties tab ─ */}
                {leftTab === 'illustrations' && (() => {
                  const filtered = filterIllustrations(ILLUSTRATIONS, illSearch, illCategory)
                  const showGrouped = illCategory === 'all' && !illSearch.trim()

                  return (
                    <div className="space-y-3">
                      {/* Search bar */}
                      <div className="relative">
                        <svg
                          width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#C4B8A0] pointer-events-none"
                        >
                          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input
                          type="text"
                          placeholder="Zoeken…"
                          value={illSearch}
                          onChange={(e) => setIllSearch(e.target.value)}
                          className={`${inputCls} pl-8 text-xs`}
                        />
                      </div>

                      {/* Category filters */}
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        <button
                          onClick={() => setIllCategory('all')}
                          className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
                          style={{
                            background:  illCategory === 'all' ? '#E7C46A' : '#fff',
                            color:       illCategory === 'all' ? '#2C2416' : '#B5A48A',
                            border:      illCategory === 'all' ? '1px solid #D4B050' : '1px solid #E8DDD0',
                          }}
                        >
                          Alles
                        </button>
                        {ILLUSTRATION_CATEGORIES.map((cat) => (
                          <button
                            key={cat.key}
                            onClick={() => setIllCategory(cat.key)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
                            style={{
                              background:  illCategory === cat.key ? '#E7C46A' : '#fff',
                              color:       illCategory === cat.key ? '#2C2416' : '#B5A48A',
                              border:      illCategory === cat.key ? '1px solid #D4B050' : '1px solid #E8DDD0',
                            }}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {/* Results */}
                      {filtered.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-[10px] text-[#C4B8A0] italic">Geen illustraties gevonden</p>
                        </div>
                      ) : showGrouped ? (
                        // Grouped by category
                        ILLUSTRATION_CATEGORIES.map((cat) => {
                          const items = filtered.filter((i) => i.category === cat.key)
                          if (!items.length) return null
                          return (
                            <div key={cat.key} className="space-y-2">
                              <p className="text-[10px] font-semibold text-[#C4B8A0] uppercase tracking-widest">{cat.label}</p>
                              <div className="grid grid-cols-3 gap-1.5">
                                {items.map((item) => (
                                  <IllustrationThumb key={item.id} item={item} onAdd={addImageElement} />
                                ))}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        // Flat grid
                        <div className="grid grid-cols-3 gap-1.5">
                          {filtered.map((item) => (
                            <IllustrationThumb key={item.id} item={item} onAdd={addImageElement} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* ─ Uploads tab ─ */}
                {leftTab === 'uploads' && (
                  <div className="space-y-4">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => { if (e.target.files?.length) handleImageUpload(e.target.files); e.target.value = '' }}
                    />

                    {/* Drop zone */}
                    <div
                      className="rounded-xl p-5 text-center cursor-pointer transition-all"
                      style={{
                        border: isDragOver ? '2px dashed #E7C46A' : '2px dashed #E0D5C5',
                        background: isDragOver ? '#FDF5E0' : 'transparent',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDragOver(false)
                        if (e.dataTransfer.files.length) handleImageUpload(e.dataTransfer.files)
                      }}
                      onMouseEnter={(e) => { if (!isDragOver) { const el = e.currentTarget; el.style.borderColor = '#E7C46A'; el.style.background = '#FDF5E0' } }}
                      onMouseLeave={(e) => { if (!isDragOver) { const el = e.currentTarget; el.style.borderColor = '#E0D5C5'; el.style.background = 'transparent' } }}
                    >
                      <div className="mb-2.5 flex justify-center">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F0E8D4' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B5A48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-[#7A6A52]">Sleep of klik om te uploaden</p>
                      <p className="text-[10px] text-[#C4B8A0] mt-1">PNG, JPG, SVG, WebP</p>
                    </div>

                    {/* Error */}
                    {uploadError && (
                      <div className="rounded-lg px-3 py-2 text-[10px] text-red-600 leading-snug" style={{ background: '#FFF0F0', border: '1px solid #FFD5D5' }}>
                        {uploadError}
                        <button onClick={() => setUploadError(null)} className="ml-2 text-red-400 hover:text-red-600">×</button>
                      </div>
                    )}

                    {/* Uploaded assets grid */}
                    {uploadedAssets.length === 0 ? (
                      <p className="text-[10px] text-center text-[#C4B8A0] italic py-2">
                        Nog geen uploads toegevoegd
                      </p>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-semibold text-[#B5A48A] uppercase tracking-widest">
                            Uploads
                          </p>
                          <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md" style={{ background: '#F0E8D4', color: '#B5A48A' }}>
                            {uploadedAssets.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {uploadedAssets.map((asset) => (
                            <UploadedAssetThumb
                              key={asset.id}
                              asset={asset}
                              onAdd={addUploadedAssetElement}
                              onDelete={deleteUploadedAsset}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─ Lettertypes tab ─ */}
                {leftTab === 'fonts' && (
                  <div className="space-y-4">
                    {/* Hidden font input */}
                    <input
                      ref={fontInputRef}
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => { if (e.target.files?.length) handleFontUpload(e.target.files); e.target.value = '' }}
                    />

                    {/* Drop zone */}
                    <div
                      className="rounded-xl p-5 text-center cursor-pointer transition-all"
                      style={{
                        border: isFontDragOver ? '2px dashed #E7C46A' : '2px dashed #E0D5C5',
                        background: isFontDragOver ? '#FDF5E0' : 'transparent',
                      }}
                      onClick={() => fontInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsFontDragOver(true) }}
                      onDragLeave={() => setIsFontDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsFontDragOver(false)
                        if (e.dataTransfer.files.length) handleFontUpload(e.dataTransfer.files)
                      }}
                      onMouseEnter={(e) => { if (!isFontDragOver) { const el = e.currentTarget; el.style.borderColor = '#E7C46A'; el.style.background = '#FDF5E0' } }}
                      onMouseLeave={(e) => { if (!isFontDragOver) { const el = e.currentTarget; el.style.borderColor = '#E0D5C5'; el.style.background = 'transparent' } }}
                    >
                      <div className="mb-2.5 flex justify-center">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F0E8D4' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B5A48A" strokeWidth="2" strokeLinecap="round">
                            <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-[#7A6A52]">Sleep of klik om te uploaden</p>
                      <p className="text-[10px] text-[#C4B8A0] mt-1">TTF, OTF, WOFF, WOFF2</p>
                    </div>

                    {/* Error */}
                    {fontError && (
                      <div className="rounded-lg px-3 py-2 text-[10px] text-red-600 leading-snug" style={{ background: '#FFF0F0', border: '1px solid #FFD5D5' }}>
                        {fontError}
                        <button onClick={() => setFontError(null)} className="ml-2 text-red-400 hover:text-red-600">×</button>
                      </div>
                    )}

                    {/* Uploaded fonts list */}
                    {uploadedFonts.length === 0 ? (
                      <p className="text-[10px] text-center text-[#C4B8A0] italic py-2">
                        Nog geen lettertypes geüpload
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-semibold text-[#B5A48A] uppercase tracking-widest">
                            Lettertypes
                          </p>
                          <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md" style={{ background: '#F0E8D4', color: '#B5A48A' }}>
                            {uploadedFonts.length}
                          </span>
                        </div>
                        {uploadedFonts.map((font) => (
                          <div
                            key={font.id}
                            className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all"
                            style={{ background: '#FAFAF7', borderColor: '#EDE7D9' }}
                          >
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium text-[#2C2416] truncate"
                                style={{ fontFamily: font.name }}
                              >
                                {font.name}
                              </p>
                              <p className="text-[9px] text-[#C4B8A0] uppercase">{font.format}</p>
                            </div>
                            <button
                              onClick={() => deleteUploadedFont(font.id)}
                              className="shrink-0 w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                              style={{ background: 'rgba(210,70,70,0.10)', color: '#D24646' }}
                              title="Verwijder lettertype"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M18 6L6 18M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─ Achtergrond tab ─ */}
                {leftTab === 'background' && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-semibold text-[#C4B8A0] uppercase tracking-widest mb-3">Artboard kleur</p>
                      <ColorPicker
                        value={artboard.backgroundColor ?? '#ffffff'}
                        onChange={(hex) => {
                          commit({
                            ...design,
                            artboards: design.artboards.map((a) =>
                              a.id === artboard.id ? { ...a, backgroundColor: hex } : a,
                            ),
                          })
                        }}
                        onLiveChange={(hex) => {
                          set({
                            ...design,
                            artboards: design.artboards.map((a) =>
                              a.id === artboard.id ? { ...a, backgroundColor: hex } : a,
                            ),
                          })
                        }}
                        showCmyk
                        recentColors={recentColors}
                        onAddRecent={addRecentColor}
                      />
                    </div>
                    {design.elements
                      .filter((el): el is ShapeElement =>
                        el.type === 'shape' && el.artboardId === artboard.id &&
                        !!el.style.fill && el.style.fill !== 'none',
                      )
                      .map((sh, i) => (
                        <div key={sh.id} className="space-y-3 pt-4" style={{ borderTop: '1px solid #EDE7D9' }}>
                          <p className="text-[10px] font-semibold text-[#7A6A52]">{sh.name?.trim() || `Vorm ${i + 1}`}</p>
                          <ColorPicker
                            value={sh.style.fill!}
                            onChange={(hex, cmyk) => updateShapeFill(sh.id, hex, cmyk)}
                            onLiveChange={(hex) => setShapeFillLive(sh.id, hex)}
                            showCmyk
                            recentColors={recentColors}
                            onAddRecent={addRecentColor}
                          />
                        </div>
                      ))}
                  </div>
                )}

                {/* ─ Papier tab ─ */}
                {leftTab === 'paper' && (
                  <div className="flex flex-col gap-0">
                    {/* Format picker */}
                    <div className="px-4 pt-4 pb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{ color: '#C4B8A0' }}>Formaat</p>
                      {/* Category: A-series */}
                      <p className="text-[10px] font-medium uppercase tracking-widest mb-1.5" style={{ color: '#B5A48A' }}>A-formaten</p>
                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        {CARD_FORMATS.filter(f => f.category === 'a-series').map((f) => {
                          const active = matchFormat(artboard.width, artboard.height)?.id === f.id
                          return (
                            <button
                              key={f.id}
                              onClick={() => changeArtboardFormat(f.id)}
                              className="flex flex-col items-center justify-center gap-0.5 rounded-lg border py-2 px-1 transition-all text-center"
                              style={{
                                borderColor:      active ? '#E7C46A' : '#E0D5C5',
                                background:       active ? 'rgba(231,196,106,0.12)' : '#FAFAF7',
                                boxShadow:        active ? '0 0 0 1.5px #E7C46A' : 'none',
                                color:            active ? '#7A5C00' : '#2C2416',
                              }}
                              title={f.description}
                            >
                              {/* Tiny aspect-ratio thumbnail */}
                              <span
                                className="block rounded-sm border mb-0.5"
                                style={{
                                  width:       f.widthMm > f.heightMm ? 22 : 16,
                                  height:      f.widthMm > f.heightMm ? 16 : 22,
                                  borderColor: active ? '#E7C46A' : '#C4B8A0',
                                  background:  active ? 'rgba(231,196,106,0.25)' : '#EDE8E0',
                                }}
                              />
                              <span className="text-[11px] font-semibold leading-tight">{f.label}</span>
                              <span className="text-[9px] leading-tight" style={{ color: '#B5A48A' }}>{f.widthMm} × {f.heightMm} mm</span>
                            </button>
                          )
                        })}
                      </div>
                      {/* Category: Square */}
                      <p className="text-[10px] font-medium uppercase tracking-widest mb-1.5" style={{ color: '#B5A48A' }}>Vierkant</p>
                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        {CARD_FORMATS.filter(f => f.category === 'square').map((f) => {
                          const active = matchFormat(artboard.width, artboard.height)?.id === f.id
                          return (
                            <button
                              key={f.id}
                              onClick={() => changeArtboardFormat(f.id)}
                              className="flex flex-col items-center justify-center gap-0.5 rounded-lg border py-2 px-1 transition-all text-center"
                              style={{
                                borderColor: active ? '#E7C46A' : '#E0D5C5',
                                background:  active ? 'rgba(231,196,106,0.12)' : '#FAFAF7',
                                boxShadow:   active ? '0 0 0 1.5px #E7C46A' : 'none',
                                color:       active ? '#7A5C00' : '#2C2416',
                              }}
                            >
                              <span
                                className="block rounded-sm border mb-0.5"
                                style={{
                                  width:       18,
                                  height:      18,
                                  borderColor: active ? '#E7C46A' : '#C4B8A0',
                                  background:  active ? 'rgba(231,196,106,0.25)' : '#EDE8E0',
                                }}
                              />
                              <span className="text-[11px] font-semibold leading-tight">{f.label}</span>
                              <span className="text-[9px] leading-tight" style={{ color: '#B5A48A' }}>{f.widthMm} × {f.heightMm} mm</span>
                            </button>
                          )
                        })}
                      </div>
                      {/* Category: Other */}
                      <p className="text-[10px] font-medium uppercase tracking-widest mb-1.5" style={{ color: '#B5A48A' }}>Overig</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CARD_FORMATS.filter(f => f.category !== 'a-series' && f.category !== 'square').map((f) => {
                          const active = matchFormat(artboard.width, artboard.height)?.id === f.id
                          return (
                            <button
                              key={f.id}
                              onClick={() => changeArtboardFormat(f.id)}
                              className="flex flex-col items-center justify-center gap-0.5 rounded-lg border py-2 px-1 transition-all text-center"
                              style={{
                                borderColor: active ? '#E7C46A' : '#E0D5C5',
                                background:  active ? 'rgba(231,196,106,0.12)' : '#FAFAF7',
                                boxShadow:   active ? '0 0 0 1.5px #E7C46A' : 'none',
                                color:       active ? '#7A5C00' : '#2C2416',
                              }}
                            >
                              <span
                                className="block rounded-sm border mb-0.5"
                                style={{
                                  width:       f.widthMm > f.heightMm ? 22 : f.widthMm === f.heightMm ? 18 : 12,
                                  height:      f.widthMm > f.heightMm ? 16 : f.widthMm === f.heightMm ? 18 : 22,
                                  borderColor: active ? '#E7C46A' : '#C4B8A0',
                                  background:  active ? 'rgba(231,196,106,0.25)' : '#EDE8E0',
                                }}
                              />
                              <span className="text-[11px] font-semibold leading-tight">{f.label}</span>
                              <span className="text-[9px] leading-tight" style={{ color: '#B5A48A' }}>{f.widthMm} × {f.heightMm} mm</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-4 border-t" style={{ borderColor: '#E0D5C5' }} />

                    {/* Paper type picker */}
                    <PaperPicker
                      selectedId={selectedPaperId}
                      onSelect={setSelectedPaperId}
                    />
                  </div>
                )}

                {/* ─ Velden tab (admin only) ─ */}
                {leftTab === 'velden' && adminMode && (
                  <div className="space-y-2">
                    {/* Summary row */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#7A6A52' }}>
                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                        {design.elements.filter((e): e is TextElement => e.type === 'text' && e.editable).length} bewerkbaar
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#7A6A52' }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#E7C46A' }} />
                        {design.elements.filter((e) => e.isTemplateLocked).length} vergrendeld
                      </div>
                    </div>

                    {/* Text elements list */}
                    {design.elements.filter((el): el is TextElement => el.type === 'text').length === 0 ? (
                      <div
                        className="text-center py-6 rounded-xl border border-dashed text-xs"
                        style={{ borderColor: '#E0D5C5', color: '#C4B8A0' }}
                      >
                        Geen tekstvelden in het ontwerp
                      </div>
                    ) : (
                      design.elements
                        .filter((el): el is TextElement => el.type === 'text')
                        .map((el) => {
                          const ab = design.artboards.find((a) => a.id === el.artboardId)
                          return (
                            <div
                              key={el.id}
                              onClick={() => setSelectedId(el.id)}
                              className="rounded-xl border p-3 cursor-pointer transition-all"
                              style={{
                                borderColor: selectedId === el.id ? '#E7C46A' : '#E0D5C5',
                                background:  selectedId === el.id ? 'rgba(231,196,106,0.08)' : 'white',
                              }}
                              onMouseEnter={(e) => {
                                if (selectedId !== el.id) (e.currentTarget as HTMLElement).style.background = '#FDFCFA'
                              }}
                              onMouseLeave={(e) => {
                                if (selectedId !== el.id) (e.currentTarget as HTMLElement).style.background = 'white'
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate" style={{ color: '#2C2416' }}>{el.name}</p>
                                  <p className="text-[10px] truncate mt-0.5" style={{ color: '#B5A48A' }}>
                                    {el.content || <em style={{ color: '#D4C8B4' }}>leeg</em>}
                                  </p>
                                </div>
                                {/* Quick toggles */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      commit(patchElement(design, el.id, { editable: !el.editable } as Partial<TextElement>))
                                    }}
                                    className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold transition-all"
                                    style={{
                                      background: el.editable ? '#DCFCE7' : '#F5F0E8',
                                      color:      el.editable ? '#16A34A' : '#B5A48A',
                                    }}
                                    title={el.editable ? 'Bewerkbaar — klik om vast te zetten' : 'Vast — klik om bewerkbaar te maken'}
                                  >
                                    {el.editable ? 'Bewerkbaar' : 'Vast'}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleTemplateLock(el.id) }}
                                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                                    style={{
                                      background: el.isTemplateLocked ? 'rgba(231,196,106,0.2)' : '#F5F0E8',
                                      color:      el.isTemplateLocked ? '#B08040' : '#C4B8A0',
                                    }}
                                    title={el.isTemplateLocked ? 'Vergrendeld — klik om vrij te laten' : 'Vrij — klik om te vergrendelen'}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      {el.isTemplateLocked
                                        ? <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>
                                        : <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" /></>
                                      }
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              {ab && (
                                <span
                                  className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium"
                                  style={{ background: '#F5EFE9', color: '#7A6A52' }}
                                >
                                  {ab.name ?? ab.id}
                                </span>
                              )}
                            </div>
                          )
                        })
                    )}

                    {/* Divider */}
                    <div className="pt-2 border-t" style={{ borderColor: '#EDE7D9' }} />

                    {/* Open wizard button */}
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: '#E7C46A', color: '#2C2416' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#D4B050')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#E7C46A')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                        <polyline points="17,21 17,13 7,13 7,21" />
                        <polyline points="7,3 7,8 15,8" />
                      </svg>
                      {adminTemplateId ? 'Template wizard' : 'Template wizard'}
                    </button>
                  </div>
                )}

              </div>
            </div>
          </aside>
        )}

        {/* ── Canvas ───────────────────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-auto flex flex-col items-center py-10 gap-5"
          style={{ background: 'radial-gradient(circle, #cdc7be 1px, transparent 1px) 0 0 / 18px 18px, #ECEAE4' }}
          onClick={() => { if (!editingTextId) setSelectedId(null) }}
        >
          {/* Artboard tabs */}
          {design.artboards.length > 1 && (
            <div
              className="flex gap-1 rounded-xl p-1"
              style={{ background: 'rgba(250,247,241,0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(232,221,208,0.8)', boxShadow: '0 2px 8px rgba(44,36,22,0.08)' }}
            >
              {design.artboards.map((ab) => (
                <button
                  key={ab.id}
                  onClick={(e) => { e.stopPropagation(); setActiveArtboardId(ab.id); setSelectedId(null) }}
                  className="text-xs font-semibold px-5 py-1.5 rounded-lg transition-all"
                  style={{
                    background: activeArtboardId === ab.id ? '#E7C46A' : 'transparent',
                    color:      activeArtboardId === ab.id ? '#2C2416' : '#B5A48A',
                    boxShadow:  activeArtboardId === ab.id ? '0 1px 3px rgba(44,36,22,0.12)' : undefined,
                  }}
                >
                  {ab.name ?? (ab.id === design.artboards[0].id ? 'Voorkant' : 'Achterkant')}
                </button>
              ))}
            </div>
          )}

          {/* Canvas wrapper */}
          <div ref={canvasContainerRef} className="w-full flex justify-center px-10">
            <div
              style={{
                width: displayWidth, height: displayHeight,
                position: 'relative', overflow: 'hidden', flexShrink: 0,
                // Five-layer shadow: contact → near → mid → far ambient → extended haze
                boxShadow: [
                  '0 1px 2px  rgba(44,36,22,0.06)',
                  '0 3px 8px  rgba(44,36,22,0.09)',
                  '0 10px 28px rgba(44,36,22,0.14)',
                  '0 28px 56px rgba(44,36,22,0.11)',
                  '0 48px 88px rgba(44,36,22,0.05)',
                ].join(', '),
                borderRadius: 3,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Inner canvas */}
              <div
                data-inner-canvas
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: artboard.width, height: artboard.height,
                  backgroundColor: artboard.backgroundColor ?? '#ffffff',
                  transform: `scale(${currentScale})`, transformOrigin: 'top left',
                  overflow: 'visible',
                  outline: isCanvasDragOver ? `${2 / currentScale}px dashed #E7C46A` : undefined,
                }}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
                onDragOver={onCanvasDragOver}
                onDragLeave={onCanvasDragLeave}
                onDrop={onCanvasDrop}
              >
                {/* ════════════════════════════════════════════════════════════
                 *  PRINT PREVIEW LAYER STACK
                 *
                 *  Render order (bottom → top):
                 *    1. artboard.backgroundColor   (inner canvas background)
                 *    2. design elements            (text / shapes / images)
                 *    3. z:180  paper texture       (multiply — above elements so it shows
                 *                                   on ANY card, even with a full-bleed
                 *                                   background shape covering the artboard)
                 *    4. z:182  catch-light         (top-left light + bottom-right shadow)
                 *    5. z:185  gloss / pearl sheen (screen, glans + pearl papers only)
                 *    6. z:190  edge depth          (inset shadow, always visible)
                 *    7. z:200  print margin guide
                 *    8. z:210+ selection handles
                 *
                 *  Why texture is ABOVE elements:
                 *  Real cards typically have a full-bleed background shape as their first
                 *  design element.  Placing the texture below that shape would hide it
                 *  completely.  Placing it above (multiply blend) makes it visible over
                 *  any colour — multiply darkens proportionally, like fibres pressing
                 *  through the ink layer.
                 *
                 *  multiply blend: colour × noise → subtle darker variations on any hue.
                 *  All px values use (N / currentScale) for zoom-invariant screen pixels.
                 * ════════════════════════════════════════════════════════════ */}

                {/* ── Layer 2: Design elements ──────────────────────────────── */}
                {artboardElements.map((el) => renderCanvasElement(el))}

                {/* ── Layer 3 (z:180): Paper texture — inline SVG ──────────── *
                 *  CSS background-image does NOT execute SVG filter primitives  *
                 *  (feTurbulence) in most browsers — they silently fail.        *
                 *  Solution: render a real <svg> element in the DOM where       *
                 *  filter primitives are fully supported by every browser.      *
                 *                                                                *
                 *  The SVG fills 100% of the inner canvas (artboard dimensions  *
                 *  before the CSS scale transform). feTurbulence coordinates     *
                 *  are in inner-canvas pixels; the parent transform scales them  *
                 *  up, so grain size stays proportional to the displayed card.   *
                 *                                                                *
                 *  multiply blend: backdrop × noise → fibre-like dark variation  *
                 *  visible over ANY card colour, including full-bleed shapes.    *
                 *  Opacity scales with paper roughness; capped at 0.20.         */}
                {selectedPaper && (() => {
                  const p       = getPaperTextureFilterParams(selectedPaper.texture)
                  const opacity = Math.min(selectedPaper.overlayOpacity * 3, 0.20)
                  // Unique filter id — avoids DOM collisions if multiple SVGs render
                  const fid = `pt-${selectedPaper.id}`
                  return (
                    <svg
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        width: '100%', height: '100%',
                        opacity,
                        mixBlendMode: 'multiply',
                        zIndex:        180,
                        overflow:      'hidden',
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <filter id={fid} x="0%" y="0%" width="100%" height="100%"
                          colorInterpolationFilters="linearRGB">
                          <feTurbulence
                            type={p.type}
                            baseFrequency={p.freq}
                            numOctaves={p.octaves}
                            stitchTiles="stitch"
                          />
                          <feColorMatrix type="saturate" values="0" />
                        </filter>
                      </defs>
                      <rect width="100%" height="100%"
                        filter={`url(#${fid})`}
                        opacity={p.noiseOp}
                      />
                    </svg>
                  )
                })()}

                {/* ── Layer 182: Catch-light gradient ──────────────────────── *
                 *  Simulates a soft light source from the top-left, with a     *
                 *  very gentle shadow fall-off toward the bottom-right.        *
                 *  Always visible — it works on any paper and background.      */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    zIndex:     182,
                    background: [
                      // Top-left catch-light
                      'radial-gradient(ellipse at 22% 11%, rgba(255,255,255,0.09) 0%, transparent 54%)',
                      // Bottom-right shadow falloff
                      'radial-gradient(ellipse at 80% 90%, rgba(44,36,22,0.055) 0%, transparent 46%)',
                    ].join(', '),
                  }}
                />

                {/* ── Layer 185: Gloss / pearl sheen ───────────────────────── *
                 *  Diagonal sheen that simulates specular reflectance on       *
                 *  coated (glans) and pearlescent paper surfaces.              */}
                {selectedPaper &&
                  (selectedPaper.tags.includes('glans') || selectedPaper.texture === 'pearl') && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      zIndex:       185,
                      background:   [
                        'linear-gradient(138deg,',
                        '  rgba(255,255,255,0.16) 0%,',
                        '  rgba(255,255,255,0.05) 22%,',
                        '  transparent 48%,',
                        '  rgba(255,255,255,0.02) 74%,',
                        '  transparent 100%)',
                      ].join(''),
                      mixBlendMode: 'screen',
                    }}
                  />
                )}

                {/* ── Layer 190: Edge depth ─────────────────────────────────── *
                 *  Inset box-shadow that gives the card physical edge depth:   *
                 *    top / left → subtle white highlight (light-facing edges)  *
                 *    bottom / right → subtle warm shadow (shadow-facing edges) *
                 *  Uses 1/currentScale so the highlight is always 1 screen-px. */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    zIndex:    190,
                    boxShadow: [
                      `inset 0  ${1 / currentScale}px 0 rgba(255,255,255,0.22)`,
                      `inset 0 -${1 / currentScale}px 0 rgba(44,36,22,0.07)`,
                      `inset  ${1 / currentScale}px 0 0 rgba(255,255,255,0.10)`,
                      `inset -${1 / currentScale}px 0 0 rgba(44,36,22,0.04)`,
                    ].join(', '),
                  }}
                />

                {/* Print margin guide */}
                {!previewMode && (
                  <div style={{
                    position: 'absolute', top: MARGIN_MM, left: MARGIN_MM,
                    width: artboard.width - MARGIN_MM * 2, height: artboard.height - MARGIN_MM * 2,
                    border: `${0.5 / currentScale}px dashed rgba(140,120,90,0.3)`,
                    pointerEvents: 'none', zIndex: 200,
                  }} />
                )}

                {/* Snap guides — amber hairlines shown during element drag */}
                {!previewMode && snapGuides.map((guide, i) =>
                  guide.axis === 'x' ? (
                    /* Vertical line */
                    <div key={`sg-x-${i}`} style={{
                      position:     'absolute',
                      left:         guide.position,
                      top:          0,
                      width:        1 / currentScale,
                      height:       artboard.height,
                      background:   'rgba(231,196,106,0.80)',
                      pointerEvents:'none',
                      zIndex:       205,
                    }} />
                  ) : (
                    /* Horizontal line */
                    <div key={`sg-y-${i}`} style={{
                      position:     'absolute',
                      top:          guide.position,
                      left:         0,
                      height:       1 / currentScale,
                      width:        artboard.width,
                      background:   'rgba(231,196,106,0.80)',
                      pointerEvents:'none',
                      zIndex:       205,
                    }} />
                  ),
                )}

                {/* Selection handles — hidden while inline editing or element is hidden */}
                {!previewMode && selectedEl && !editingTextId &&
                  selectedEl.artboardId === artboard.id && !hiddenIds.has(selectedEl.id) && (
                  <SelectionHandles
                    element={selectedEl}
                    scale={currentScale}
                    locked={lockedIds.has(selectedEl.id)}
                    onResizeStart={(handle, e) => onResizeStart(selectedEl.id, handle, e)}
                    onRotateStart={(e) => onRotateStart(selectedEl.id, e)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Info bar */}
          <div
            className="flex items-center gap-3 text-[10px] font-mono rounded-xl px-4 py-2"
            style={{ background: 'rgba(44,36,22,0.16)', backdropFilter: 'blur(4px)', color: 'rgba(255,255,255,0.72)' }}
          >
            <span>{artboard.width} × {artboard.height} mm</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{Math.round(currentScale * 100)}%</span>
            {editingTextId && <><span style={{ opacity: 0.4 }}>·</span><span style={{ color: '#E7C46A' }}>tekst bewerken</span></>}
            {selectedEl && !editingTextId && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <button className="flex items-center gap-1 hover:text-white/90 transition-colors" onClick={() => setSelectedId(null)}>
                  {selectedEl.type === 'text'
                    ? (selectedEl as TextElement).content?.slice(0, 14) || 'tekst'
                    : (selectedEl as ImageElement).name?.slice(0, 14) || selectedEl.type}
                  <span style={{ opacity: 0.5 }}>×</span>
                </button>
              </>
            )}
          </div>

          {/* Paper indicator — shown when a paper type is selected */}
          {selectedPaper && (
            <div
              className="flex items-center gap-2 text-[10px] rounded-xl px-3 py-1.5 cursor-pointer select-none transition-all"
              style={{
                background:   'rgba(231,196,106,0.18)',
                backdropFilter: 'blur(4px)',
                border:       '1px solid rgba(231,196,106,0.35)',
                color:        'rgba(255,255,255,0.85)',
              }}
              onClick={() => setLeftTab('paper')}
              title="Open papierkeuze"
            >
              <svg
                width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="rgba(231,196,106,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span style={{ color: 'rgba(231,196,106,0.9)', fontWeight: 600 }}>
                {selectedPaper.name}
              </span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{selectedPaper.weight} g/m²</span>
            </div>
          )}
        </main>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        {!previewMode && (
          <aside className="shrink-0 flex flex-col overflow-hidden"
            style={{ width: 256, borderLeft: '1px solid #E8DDD0', background: '#FAFAF7' }}>

            <div className="px-4 py-3 shrink-0 flex items-center justify-between"
              style={{ borderBottom: '1px solid #EDE7D9' }}>
              <p className="text-xs font-semibold text-[#5C4D3A]">
                {selectedEl
                  ? selectedEl.type === 'text'  ? 'Tekst'
                  : selectedEl.type === 'shape' ? 'Vorm'
                  : 'Illustratie'
                  : 'Eigenschappen'
                }
              </p>
              {selectedEl && (
                <button
                  onClick={() => { setSelectedId(null); setEditingTextId(null) }}
                  className="w-5 h-5 flex items-center justify-center rounded-md text-[#C4B8A0] hover:text-[#7A6A52] hover:bg-[#F0E8D4] transition-all text-sm"
                >×</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {renderPropertiesPanel()}
            </div>

            {renderLayersPanel()}
          </aside>
        )}
      </div>

      {/* ══ Admin: Template wizard ══════════════════════════════════════════════ */}
      {adminMode && showTemplateModal && (
        <TemplateWizard
          design={design}
          adminTemplateId={adminTemplateId ?? null}
          initialName={initialDesign.name ?? templateName}
          onClose={() => setShowTemplateModal(false)}
          onCommitDesign={(updatedDesign) => commit(updatedDesign)}
          onSaveComplete={() => {
            setShowTemplateModal(false)
            router.push('/admin/templates')
          }}
        />
      )}
    </div>
  )
}
