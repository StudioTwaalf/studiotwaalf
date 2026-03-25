/**
 * Studio Twaalf — Paper Library
 *
 * Structured data for the paper selection system.
 * Textures are generated as CSS/SVG data URLs — no external image files needed.
 * The system is designed to be later replaced by a database query.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaperTexture = 'smooth' | 'grain' | 'linen' | 'cotton' | 'recycled' | 'pearl'

export type PaperTag = 'populair' | 'eco' | 'glans' | 'mat' | 'structuur' | 'premium' | 'recycled'

export interface PaperType {
  id:             string
  name:           string
  weight:         number        // g/m²
  description:    string
  tone:           string        // hex — paper base colour
  texture:        PaperTexture
  tags:           PaperTag[]
  popular?:       boolean
  /** 0–1: how strongly the texture overlay blends over the canvas */
  overlayOpacity: number
}

// ─── Texture SVG generator ────────────────────────────────────────────────────

export type TextureParams = {
  type:      'fractalNoise' | 'turbulence'
  freq:      string
  octaves:   number
  noiseOp:   number  // opacity of the noise rect (0–1)
  size:      number  // tile size in px
}

const TEXTURE_DEFS: Record<PaperTexture, TextureParams> = {
  smooth:   { type: 'fractalNoise', freq: '0.65',        octaves: 3, noiseOp: 0.22, size: 200 },
  grain:    { type: 'fractalNoise', freq: '0.88',        octaves: 4, noiseOp: 0.62, size: 150 },
  linen:    { type: 'turbulence',   freq: '0.05 0.015',  octaves: 3, noiseOp: 0.58, size: 200 },
  cotton:   { type: 'fractalNoise', freq: '0.46',        octaves: 5, noiseOp: 0.50, size: 200 },
  recycled: { type: 'fractalNoise', freq: '0.70',        octaves: 5, noiseOp: 0.72, size: 180 },
  pearl:    { type: 'fractalNoise', freq: '0.28',        octaves: 2, noiseOp: 0.20, size: 250 },
}

/** Returns a CSS `url("data:...")` string for a given texture type. */
export function getPaperTextureDataUrl(texture: PaperTexture): string {
  const p = TEXTURE_DEFS[texture]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${p.size}" height="${p.size}"><filter id="n"><feTurbulence type="${p.type}" baseFrequency="${p.freq}" numOctaves="${p.octaves}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="${p.size}" height="${p.size}" filter="url(#n)" opacity="${p.noiseOp}"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Tile size (px) used when rendering the texture on the canvas. */
export function getPaperTextureTileSize(texture: PaperTexture): number {
  return TEXTURE_DEFS[texture].size
}

/**
 * Returns the raw turbulence parameters for inline SVG rendering.
 * Use this instead of getPaperTextureDataUrl when you need a real DOM SVG element
 * (CSS background-image does not execute SVG filter primitives in most browsers).
 */
export function getPaperTextureFilterParams(texture: PaperTexture): TextureParams {
  return TEXTURE_DEFS[texture]
}

// ─── Paper library ────────────────────────────────────────────────────────────

export const PAPERS: PaperType[] = [
  // ── Satijn ─────────────────────────────────────────────────────────────────
  {
    id:             'satin-300',
    name:           'Satijn 300g',
    weight:         300,
    description:    'Glad satijnen papier met een zachte, licht glanzende finish. Kleuren komen helder en levendig naar voren.',
    tone:           '#FEFEFE',
    texture:        'smooth',
    tags:           ['populair', 'glans'],
    popular:        true,
    overlayOpacity: 0.03,
  },
  {
    id:             'satin-350',
    name:           'Satijn 350g',
    weight:         350,
    description:    'Extra dik satijnen papier. Luxueuze aanvoeling met heldere, stralende kleuren. Ideaal voor trouwkaarten.',
    tone:           '#FEFEFE',
    texture:        'smooth',
    tags:           ['premium', 'glans'],
    overlayOpacity: 0.03,
  },

  // ── Mat ────────────────────────────────────────────────────────────────────
  {
    id:             'matte-300',
    name:           'Mat 300g',
    weight:         300,
    description:    'Strak mat papier. Professioneel, tijdloos en elegant. Matte finish met zachte lichte crème ondertoon.',
    tone:           '#F9F9F7',
    texture:        'smooth',
    tags:           ['mat', 'populair'],
    popular:        true,
    overlayOpacity: 0.04,
  },
  {
    id:             'matte-350',
    name:           'Mat 350g',
    weight:         350,
    description:    'Dik mat papier. Haptisch luxe gevoel en luxueuze matte finish. Subtiele warme ondertoon.',
    tone:           '#F8F7F4',
    texture:        'smooth',
    tags:           ['mat', 'premium'],
    overlayOpacity: 0.04,
  },

  // ── Crush ──────────────────────────────────────────────────────────────────
  {
    id:             'crush-corn-250',
    name:           'Crush Corn 250g',
    weight:         250,
    description:    'Ambachtelijk papier gemaakt van maïsresten. Subtiele korreltextuur met zichtbare vezels en warme crèmekleur.',
    tone:           '#F2EDD8',
    texture:        'grain',
    tags:           ['structuur', 'eco'],
    overlayOpacity: 0.10,
  },
  {
    id:             'crush-corn-350',
    name:           'Crush Corn 350g',
    weight:         350,
    description:    'Dik Crush-papier van maïsresten. Stevig, luxueus en duurzaam. Zichtbare vezelstructuur met warme croom tint.',
    tone:           '#EFE8CF',
    texture:        'grain',
    tags:           ['structuur', 'eco', 'premium'],
    popular:        true,
    overlayOpacity: 0.12,
  },
  {
    id:             'crush-olive-300',
    name:           'Crush Olive 300g',
    weight:         300,
    description:    'Olijfgroen getint papier van olijfpersresten. Uniek karakter met subtiele textuur en organische uitstraling.',
    tone:           '#E4E8D8',
    texture:        'grain',
    tags:           ['structuur', 'eco'],
    overlayOpacity: 0.10,
  },
  {
    id:             'crush-lavender-300',
    name:           'Crush Lavender 300g',
    weight:         300,
    description:    'Lavendel getint papier met subtiele korrel. Romantisch en fris, perfect voor geboortekaarten.',
    tone:           '#EAE4F0',
    texture:        'grain',
    tags:           ['structuur', 'eco'],
    overlayOpacity: 0.09,
  },

  // ── Katoen ─────────────────────────────────────────────────────────────────
  {
    id:             'cotton-300',
    name:           'Katoen 300g',
    weight:         300,
    description:    'Katoenpapier met een zachte, warme textuur. Handgemaakt gevoel. Duurzaam en uniek — elke kaart is anders.',
    tone:           '#F7F3EC',
    texture:        'cotton',
    tags:           ['structuur', 'premium', 'eco'],
    overlayOpacity: 0.08,
  },
  {
    id:             'cotton-350',
    name:           'Katoen 350g',
    weight:         350,
    description:    'Dik katoenpapier. Uitzonderlijk rijke, zachte aanraking. Exclusief en luxueus, voor de meest bijzondere kaarten.',
    tone:           '#F5F0E6',
    texture:        'cotton',
    tags:           ['structuur', 'premium', 'eco'],
    overlayOpacity: 0.10,
  },

  // ── Kraft ──────────────────────────────────────────────────────────────────
  {
    id:             'kraft-recycled-300',
    name:           'Kraft Gerecycled 300g',
    weight:         300,
    description:    'Gerecycled kraftpapier met ruwe, ambachtelijke textuur. Duurzame keuze met een stoer, authentiek karakter.',
    tone:           '#D9C9A8',
    texture:        'recycled',
    tags:           ['recycled', 'eco', 'structuur'],
    overlayOpacity: 0.14,
  },

  // ── Scandinavisch premium ──────────────────────────────────────────────────
  {
    id:             'munken-lynx-300',
    name:           'Munken Lynx 300g',
    weight:         300,
    description:    'Scandinavisch uncoated papier. Licht ivoorwit met premium aanvoeling en uitstekende leesbaarheid.',
    tone:           '#FAFAF5',
    texture:        'smooth',
    tags:           ['mat', 'premium'],
    overlayOpacity: 0.03,
  },
  {
    id:             'fedrigoni-arcoprint-350',
    name:           'Fedrigoni Arcoprint 350g',
    weight:         350,
    description:    'Italiaans premium papier. Intensief wit, supergladde finish. Kleuren worden uitzonderlijk helder afgedrukt.',
    tone:           '#FFFFFF',
    texture:        'smooth',
    tags:           ['mat', 'premium'],
    overlayOpacity: 0.02,
  },

  // ── Structuur ─────────────────────────────────────────────────────────────
  {
    id:             'linen-300',
    name:           'Linnen 300g',
    weight:         300,
    description:    'Papier met linnen structuur. Handgemaakte uitstraling met exclusief, textiel gevoel. Zeer onderscheidend.',
    tone:           '#F6F2EB',
    texture:        'linen',
    tags:           ['structuur', 'premium'],
    overlayOpacity: 0.12,
  },
  {
    id:             'conqueror-laid-300',
    name:           'Conqueror Laid 300g',
    weight:         300,
    description:    'Premium laid papier met subtiele ribbelstructuur. Klassieke elegantie die tijdloos is.',
    tone:           '#F8F5EE',
    texture:        'linen',
    tags:           ['structuur', 'premium'],
    overlayOpacity: 0.10,
  },
  {
    id:             'tintoretto-ceylon-300',
    name:           'Tintoretto Ceylon 300g',
    weight:         300,
    description:    'Italiaans papier met fijne linnen textuur en warme ivoortint. Verfijnd Italiaans vakmanschap.',
    tone:           '#F3EDE0',
    texture:        'linen',
    tags:           ['structuur', 'premium'],
    overlayOpacity: 0.10,
  },
  {
    id:             'rives-tradition-300',
    name:           'Rives Tradition 300g',
    weight:         300,
    description:    'Frans fine art papier met vergé lijnen. Klassiek karakter met een subtiele korrel. Tijdloze elegantie.',
    tone:           '#F4EFE6',
    texture:        'grain',
    tags:           ['structuur', 'premium'],
    overlayOpacity: 0.08,
  },

  // ── Speciaal ──────────────────────────────────────────────────────────────
  {
    id:             'sirio-pearl-300',
    name:           'Sirio Pearl 300g',
    weight:         300,
    description:    'Parelmoer effect papier. Subtiele shimmer die kleuren doet oplichten. Prachtig voor trouwkaarten.',
    tone:           '#F5F2F8',
    texture:        'pearl',
    tags:           ['glans', 'premium'],
    overlayOpacity: 0.06,
  },
  {
    id:             'keaykolour-natural-300',
    name:           'Keaykolour Natural 300g',
    weight:         300,
    description:    'Naturel crème papier met organische uitstraling. Populair voor trouwuitnodigingen en geboortekaarten.',
    tone:           '#F0E8D0',
    texture:        'smooth',
    tags:           ['mat', 'populair'],
    popular:        true,
    overlayOpacity: 0.05,
  },
  {
    id:             'popset-apricot-240',
    name:           "Pop'Set Abrikoos 240g",
    weight:         240,
    description:    'Licht abrikoos getint papier. Vrolijk en warm karakter. Licht en speels — perfect voor geboortekaarten.',
    tone:           '#F9E8D5',
    texture:        'smooth',
    tags:           ['mat'],
    overlayOpacity: 0.04,
  },
  {
    id:             'nautilus-recycled-300',
    name:           'Nautilus Recycled 300g',
    weight:         300,
    description:    '100% gerecycled papier met subtiele vezelstructuur. Gecertificeerd milieuvriendelijk zonder concessies aan kwaliteit.',
    tone:           '#F0EDE8',
    texture:        'recycled',
    tags:           ['recycled', 'eco'],
    overlayOpacity: 0.10,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const PAPER_TAG_LABELS: Record<PaperTag | 'all', string> = {
  all:       'Alles',
  populair:  'Populair',
  structuur: 'Structuur',
  eco:       'Eco',
  premium:   'Premium',
  glans:     'Glans',
  mat:       'Mat',
  recycled:  'Recycled',
}
