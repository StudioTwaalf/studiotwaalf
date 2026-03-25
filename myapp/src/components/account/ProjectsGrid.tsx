'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import type { Project } from '@/types/account'
import ProjectCard from './ProjectCard'
import EmptyState from './EmptyState'

// ─── Filter config ────────────────────────────────────────────────────────────

type FilterKey = 'alle' | 'geboorte' | 'huwelijk' | 'doopsuiker' | 'cadeau' | 'concept'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'alle',       label: 'Alle' },
  { key: 'geboorte',   label: 'Geboorte' },
  { key: 'huwelijk',   label: 'Huwelijk' },
  { key: 'doopsuiker', label: 'Doopsuiker' },
  { key: 'cadeau',     label: 'Cadeau' },
  { key: 'concept',    label: 'Concept' },
]

function matchesFilter(project: Project, filter: FilterKey): boolean {
  if (filter === 'alle') return true
  const c = (project.category ?? '').toLowerCase()
  switch (filter) {
    case 'geboorte':   return c.includes('geboorte') || c.includes('birth')
    case 'huwelijk':   return c.includes('huwelijk') || c.includes('wedding')
    case 'doopsuiker': return c.includes('doopsel')  || c.includes('bapti')
    case 'cadeau':     return c.includes('cadeau')   || c.includes('gift')
    case 'concept':    return c.includes('concept')
    default:           return true
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  projects: Project[]
}

export default function ProjectsGrid({ projects }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('alle')
  const [fading, setFading]             = useState(false)

  // Smooth fade between filter states — 120ms out, swap, 120ms in
  const changeFilter = useCallback((key: FilterKey) => {
    if (key === activeFilter) return
    setFading(true)
    setTimeout(() => {
      setActiveFilter(key)
      setFading(false)
    }, 120)
  }, [activeFilter])

  const filtered = useMemo(
    () => projects.filter((p) => matchesFilter(p, activeFilter)),
    [projects, activeFilter],
  )

  const activeLabel = FILTERS.find((f) => f.key === activeFilter)?.label ?? ''

  return (
    <div>
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      {projects.length > 0 && (
        <div
          className="flex items-center gap-2 flex-wrap mb-8"
          role="group"
          aria-label="Filter projecten"
        >
          {FILTERS.map(({ key, label }) => {
            const count    = projects.filter((p) => matchesFilter(p, key)).length
            const isActive = activeFilter === key
            if (key !== 'alle' && count === 0) return null

            return (
              <button
                key={key}
                onClick={() => changeFilter(key)}
                aria-pressed={isActive}
                className={`
                  relative px-3.5 py-1.5 rounded-full text-xs font-semibold
                  transition-all duration-200 ease-out
                  ${isActive
                    ? 'bg-[#2C2416] text-white shadow-sm scale-[1.02]'
                    : 'bg-white border border-neutral-200 text-[#7A6A52] hover:border-[#C4B8A0] hover:text-[#2C2416] hover:scale-[1.01]'
                  }
                `}
              >
                {label}
                {key !== 'alle' && (
                  <span
                    className={`ml-1.5 text-[10px] tabular-nums transition-opacity duration-200
                                ${isActive ? 'opacity-50' : 'text-[#C4B8A0]'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}

          {/* Result count — slides in with filter */}
          <span
            key={activeFilter}               // remount = re-fade-in
            className="ml-auto text-[11px] text-[#C4B8A0] hidden sm:block
                       animate-[fadeIn_0.3s_ease-out]"
            style={{ ['--tw-animate-duration' as string]: '0.3s' }}
          >
            {filtered.length} {filtered.length === 1 ? 'project' : 'projecten'}
          </span>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div
        className={`
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5
          transition-opacity duration-[120ms] ease-in-out
          ${fading ? 'opacity-0' : 'opacity-100'}
        `}
      >
        {projects.length === 0 ? (
          /* No projects at all → editorial empty state */
          <EmptyState filtered={false} />

        ) : filtered.length === 0 ? (
          /* Filter returned nothing → inline dismissal */
          <div className="col-span-full flex flex-col items-center gap-2.5 py-20 text-center">
            <p className="text-[13px] font-medium text-[#2C2416]">
              Geen projecten in &ldquo;{activeLabel}&rdquo;
            </p>
            <p className="text-xs text-[#B5A48A] max-w-[28ch] leading-relaxed">
              Je hebt nog geen ontwerpen in deze categorie.
            </p>
            <button
              onClick={() => changeFilter('alle')}
              className="mt-1 text-[11px] font-semibold text-[#8C6D1A]
                         underline-offset-2 hover:underline transition-all duration-150"
            >
              Toon alle projecten
            </button>
          </div>

        ) : (
          filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>
    </div>
  )
}
