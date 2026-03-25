// ─── Illustration library ─────────────────────────────────────────────────────
//
// Structured data for the Studio Twaalf illustration library.
// Each item can later be replaced by a database row — the shape is the contract.
// SVG illustrations support colour tinting via CSS filter in CanvasEditor.
//
// Source folder: /public/illustrations/

export type IllustrationCategory =
  | 'bloemen'
  | 'dieren'
  | 'natuur'
  | 'minimal'
  | 'lijnen'
  | 'patronen'

export interface IllustrationItem {
  id:          string
  name:        string
  category:    IllustrationCategory
  src:         string          // public URL, e.g. "/illustrations/bloemen-1.svg"
  tags:        string[]
  type:        'svg' | 'image' // svg supports colour tinting
  defaultSize: { width: number; height: number }  // mm
}

// ─── Category metadata ────────────────────────────────────────────────────────

export const ILLUSTRATION_CATEGORIES: { key: IllustrationCategory; label: string }[] = [
  { key: 'bloemen',  label: 'Bloemen'        },
  { key: 'dieren',   label: 'Dieren'         },
  { key: 'natuur',   label: 'Natuur'         },
  { key: 'minimal',  label: 'Minimal shapes' },
  { key: 'lijnen',   label: 'Lijnen'         },
  { key: 'patronen', label: 'Patronen'       },
]

// ─── Library data ─────────────────────────────────────────────────────────────

export const ILLUSTRATIONS: IllustrationItem[] = [
  // ── Bloemen ────────────────────────────────────────────────────────────────
  {
    id: 'bloemen-1', name: 'Vijfbladige bloem', category: 'bloemen',
    src: '/illustrations/bloemen-1.svg',
    tags: ['bloem', 'bloemblad', 'lente', 'vintage'],
    type: 'svg', defaultSize: { width: 28, height: 28 },
  },
  {
    id: 'bloemen-2', name: 'Botanisch blad', category: 'bloemen',
    src: '/illustrations/bloemen-2.svg',
    tags: ['blad', 'botanisch', 'nerven', 'groen'],
    type: 'svg', defaultSize: { width: 22, height: 32 },
  },
  {
    id: 'bloemen-3', name: 'Madeliefje', category: 'bloemen',
    src: '/illustrations/bloemen-3.svg',
    tags: ['madeliefje', 'zonnebloem', 'bloem', 'zomer'],
    type: 'svg', defaultSize: { width: 30, height: 30 },
  },

  // ── Dieren ─────────────────────────────────────────────────────────────────
  {
    id: 'dieren-1', name: 'Vlinder', category: 'dieren',
    src: '/illustrations/dieren-1.svg',
    tags: ['vlinder', 'insect', 'natuur', 'lente'],
    type: 'svg', defaultSize: { width: 34, height: 26 },
  },
  {
    id: 'dieren-2', name: 'Vogel', category: 'dieren',
    src: '/illustrations/dieren-2.svg',
    tags: ['vogel', 'vliegen', 'natuur', 'veer'],
    type: 'svg', defaultSize: { width: 36, height: 26 },
  },
  {
    id: 'dieren-3', name: 'Hertje', category: 'dieren',
    src: '/illustrations/dieren-3.svg',
    tags: ['hert', 'gewei', 'dier', 'bos', 'winter'],
    type: 'svg', defaultSize: { width: 28, height: 34 },
  },

  // ── Natuur ─────────────────────────────────────────────────────────────────
  {
    id: 'natuur-1', name: 'Stralende zon', category: 'natuur',
    src: '/illustrations/natuur-1.svg',
    tags: ['zon', 'stralen', 'licht', 'zomer'],
    type: 'svg', defaultSize: { width: 30, height: 30 },
  },
  {
    id: 'natuur-2', name: 'Maan & ster', category: 'natuur',
    src: '/illustrations/natuur-2.svg',
    tags: ['maan', 'ster', 'nacht', 'magisch'],
    type: 'svg', defaultSize: { width: 32, height: 28 },
  },
  {
    id: 'natuur-3', name: 'Tak met blad', category: 'natuur',
    src: '/illustrations/natuur-3.svg',
    tags: ['tak', 'blad', 'boom', 'natuur', 'botanisch'],
    type: 'svg', defaultSize: { width: 22, height: 38 },
  },

  // ── Minimal shapes ─────────────────────────────────────────────────────────
  {
    id: 'minimal-1', name: 'Hart', category: 'minimal',
    src: '/illustrations/minimal-1.svg',
    tags: ['hart', 'liefde', 'minimaal', 'romantisch'],
    type: 'svg', defaultSize: { width: 30, height: 27 },
  },
  {
    id: 'minimal-2', name: 'Ster', category: 'minimal',
    src: '/illustrations/minimal-2.svg',
    tags: ['ster', 'minimaal', 'vorm', 'decoratief'],
    type: 'svg', defaultSize: { width: 28, height: 28 },
  },
  {
    id: 'minimal-3', name: 'Diamant', category: 'minimal',
    src: '/illustrations/minimal-3.svg',
    tags: ['diamant', 'ruit', 'vorm', 'luxe', 'minimaal'],
    type: 'svg', defaultSize: { width: 26, height: 30 },
  },

  // ── Lijnen ─────────────────────────────────────────────────────────────────
  {
    id: 'lijnen-1', name: 'Golvende lijn', category: 'lijnen',
    src: '/illustrations/lijnen-1.svg',
    tags: ['lijn', 'golf', 'verdeler', 'scheiding'],
    type: 'svg', defaultSize: { width: 60, height: 14 },
  },
  {
    id: 'lijnen-2', name: 'Botanische lijn', category: 'lijnen',
    src: '/illustrations/lijnen-2.svg',
    tags: ['lijn', 'botanisch', 'bloem', 'verdeler'],
    type: 'svg', defaultSize: { width: 60, height: 16 },
  },
  {
    id: 'lijnen-3', name: 'Stippellijn', category: 'lijnen',
    src: '/illustrations/lijnen-3.svg',
    tags: ['stippen', 'lijn', 'verdeler', 'punten'],
    type: 'svg', defaultSize: { width: 60, height: 14 },
  },

  // ── Patronen ───────────────────────────────────────────────────────────────
  {
    id: 'patronen-1', name: 'Stippenpatroon', category: 'patronen',
    src: '/illustrations/patronen-1.svg',
    tags: ['stippen', 'patroon', 'dots', 'polka'],
    type: 'svg', defaultSize: { width: 30, height: 30 },
  },
  {
    id: 'patronen-2', name: 'Ruitpatroon', category: 'patronen',
    src: '/illustrations/patronen-2.svg',
    tags: ['ruit', 'diamant', 'patroon', 'geometrisch'],
    type: 'svg', defaultSize: { width: 30, height: 30 },
  },
  {
    id: 'patronen-3', name: 'Bloemenpatroon', category: 'patronen',
    src: '/illustrations/patronen-3.svg',
    tags: ['bloem', 'patroon', 'repeat', 'botanisch'],
    type: 'svg', defaultSize: { width: 30, height: 30 },
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Filter illustrations by search query and/or category. */
export function filterIllustrations(
  items: IllustrationItem[],
  search: string,
  category: IllustrationCategory | 'all',
): IllustrationItem[] {
  let result = items
  if (category !== 'all') {
    result = result.filter((i) => i.category === category)
  }
  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q)),
    )
  }
  return result
}
