import Link from 'next/link'
import type { Project, ProjectStatus } from '@/types/account'
import StatusBadge from './StatusBadge'

export type { Project }

// ─── Visual config ────────────────────────────────────────────────────────────

// 2px top-edge strip — secondary status signal at card level
const STATUS_ACCENT: Record<ProjectStatus, string> = {
  concept:             'bg-neutral-200',
  in_opbouw:           'bg-sky-200',
  offerte_aangevraagd: 'bg-amber-300',
  wacht_op_akkoord:    'bg-[#E7C46A]',
  in_productie:        'bg-violet-300',
  afgeleverd:          'bg-emerald-300',
}

// Category gradient — gives each card visual identity before thumbnail
const CATEGORY_GRADIENT: Record<string, string> = {
  geboorte:   'from-rose-50/80 via-[#FAF8F4] to-[#F5F0E8]',
  huwelijk:   'from-stone-50 via-[#FAF8F4] to-[#F5F0E8]',
  doopsel:    'from-emerald-50/60 via-[#FAF8F4] to-[#F5F0E8]',
  cadeau:     'from-amber-50/60 via-[#FAF8F4] to-[#F5F0E8]',
  concept:    'from-violet-50/50 via-[#FAF8F4] to-[#F5F0E8]',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 2)  return 'zojuist'
  if (mins  < 60) return `${mins}\u202Fmin geleden`
  if (hours < 24) return `${hours}\u202Fu geleden`
  if (days  < 7)  return `${days} dag${days === 1 ? '' : 'en'} geleden`
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function categoryLabel(category: string | null): string {
  if (!category) return 'Overig'
  const c = category.toLowerCase()
  if (c.includes('geboorte') || c.includes('birth'))   return 'Geboorte'
  if (c.includes('huwelijk') || c.includes('wedding')) return 'Huwelijk'
  if (c.includes('doopsel')  || c.includes('bapti'))   return 'Doopsuiker'
  if (c.includes('cadeau')   || c.includes('gift'))    return 'Cadeau'
  if (c.includes('concept'))                           return 'Concept'
  return category
}

function thumbnailGradient(category: string | null): string {
  const key = (category ?? '').toLowerCase().split(/\s/)[0]
  return CATEGORY_GRADIENT[key] ?? 'from-[#FAF8F4] to-[#F5F0E8]'
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  project: Project
}

export default function ProjectCard({ project }: Props) {
  const editorHref  = `/design/${project.templateId}?design=${project.designId}`
  const conceptHref = `/design/${project.templateId}/concept?design=${project.designId}`
  const canQuote    = ['concept', 'in_opbouw'].includes(project.status)
  const catLabel    = categoryLabel(project.category)

  return (
    <article
      className="group relative flex flex-col bg-white rounded-2xl border border-neutral-200
                 shadow-sm hover:shadow-xl hover:-translate-y-0.5
                 transition-all duration-300 ease-out overflow-hidden"
    >
      {/* Colour-coded status strip */}
      <div className={`h-0.5 w-full flex-shrink-0 ${STATUS_ACCENT[project.status]}`} />

      {/* ── Thumbnail ───────────────────────────────────────────────────── */}
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${thumbnailGradient(project.category)}`}>

        {project.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail}
            alt={project.name}
            className="absolute inset-0 w-full h-full object-cover
                       transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <>
            {/* Faint dot-grid texture */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(circle, #2C2416 1px, transparent 1px)',
                backgroundSize:  '20px 20px',
              }}
              aria-hidden
            />
            {/* Large serif watermark word — editorial identity */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden>
              <span className="font-serif text-[5.5rem] leading-none text-[#2C2416]/[0.055] select-none tracking-tight">
                {catLabel}
              </span>
            </div>
          </>
        )}

        {/* Hover scrim + "Bekijk preview" */}
        <div
          className="absolute inset-0 flex items-center justify-center
                     bg-[#2C2416]/0 group-hover:bg-[#2C2416]/28
                     transition-colors duration-300"
          aria-hidden
        >
          <span className="opacity-0 group-hover:opacity-100
                           translate-y-2 group-hover:translate-y-0
                           transition-all duration-300 delay-[60ms]
                           text-white/90 text-[10px] font-semibold tracking-[0.2em] uppercase">
            Bekijk preview
          </span>
        </div>

        {/* Category pill — top-left */}
        <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full
                         text-[10px] font-semibold uppercase tracking-wider
                         bg-white/90 text-[#7A6A52] border border-neutral-200/80
                         shadow-sm backdrop-blur-sm">
          {catLabel}
        </span>

        {/* Gadget count — top-right */}
        {project.gadgetCount > 0 && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                           text-[10px] font-semibold bg-white/90 text-[#7A6A52]
                           border border-neutral-200/80 shadow-sm backdrop-blur-sm">
            {project.gadgetCount}
            <span className="text-[#C4B8A0]">
              gadget{project.gadgetCount !== 1 ? 's' : ''}
            </span>
          </span>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-5 pt-4 pb-5">

        {/* Project name */}
        <h2 className="text-[14px] font-semibold leading-snug text-[#2C2416] line-clamp-2 mb-2.5">
          {project.name}
        </h2>

        {/* Status + last-modified in one compact row */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={project.status} />
          <span className="text-[#D4C9B8] text-xs leading-none" aria-hidden>·</span>
          <span className="text-[11px] text-[#B5A48A]">
            {formatRelative(project.updatedAt)}
          </span>
        </div>

        {/* Hairline divider */}
        <div className="my-4 border-t border-neutral-100" />

        {/* ── CTA row ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">

          {/* Primary: animated text-link with circle-arrow button */}
          <Link
            href={editorHref}
            className="group/cta flex items-center gap-2 flex-1 min-w-0
                       text-[13px] font-semibold text-[#2C2416]
                       hover:text-[#8C6D1A] transition-colors duration-200"
          >
            <span className="truncate">Verder ontwerpen</span>

            {/* Arrow circle — bg transitions gold on hover */}
            <span className="flex-shrink-0 ml-auto w-7 h-7 rounded-full
                             bg-[#F0EBE0] group-hover/cta:bg-[#E7C46A]
                             flex items-center justify-center
                             transition-colors duration-200">
              <svg
                width="11" height="11" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                className="group-hover/cta:translate-x-0.5 transition-transform duration-200"
                aria-hidden
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* Secondary: Offerte (when project can still progress) */}
          {canQuote && (
            <Link
              href={conceptHref}
              className="flex-shrink-0 text-[11px] font-semibold text-[#9C8F7A]
                         hover:text-[#2C2416] transition-colors duration-150
                         underline-offset-2 hover:underline whitespace-nowrap"
            >
              Offerte
            </Link>
          )}

          {/* Secondary: Bekijken (for statuses past quoting stage) */}
          {!canQuote && project.status !== 'concept' && (
            <Link
              href={conceptHref}
              className="flex-shrink-0 text-[11px] font-medium text-[#C4B8A0]
                         hover:text-[#7A6A52] transition-colors duration-150
                         underline-offset-2 hover:underline whitespace-nowrap"
            >
              Bekijken
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
