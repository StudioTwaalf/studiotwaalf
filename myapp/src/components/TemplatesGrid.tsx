'use client'

/**
 * TemplatesGrid — client component that renders the template cards grid
 * and fires a typed `select_template` GTM event when the user picks one.
 *
 * Receives serialised template data from the server page so no Prisma
 * types cross the server/client boundary.
 */

import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'
import { deriveJourneyType } from '@/lib/analytics'

export interface TemplateSummary {
  id:          string
  name:        string
  category:    string | null
  description: string | null
  thumbnail:   string | null
  widthMm:     number | null
  heightMm:    number | null
}

interface Props {
  templates: TemplateSummary[]
}

export default function TemplatesGrid({ templates }: Props) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-24 rounded-2xl border border-dashed border-studio-sand/60 bg-studio-beige/40">
        <svg
          className="mx-auto w-12 h-12 text-studio-sand mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        </svg>
        <p className="text-gray-600 font-medium">Nog geen templates beschikbaar.</p>
        <p className="text-gray-400 text-sm mt-1">Kom binnenkort terug — we werken er hard aan!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {templates.map((template) => (
        <Link
          key={template.id}
          href={`/design/${template.id}`}
          onClick={() =>
            trackEvent({
              event:             'select_template',
              flow_step:         'templates',
              // No DB-backed design ID exists yet — generate a fresh UUID so GTM
              // receives a real identifier rather than an empty string.  Once the
              // user saves their first edit the flow switches to the DB design ID.
              session_design_id: crypto.randomUUID(),
              template_id:       template.id,
              template_name:     template.name,
              journey_type:      deriveJourneyType(template.category),
            })
          }
          className="group relative flex flex-col bg-white rounded-2xl border border-studio-sand/60
                     shadow-soft hover:shadow-lg transition-all duration-200 overflow-hidden"
        >
          {/* Thumbnail / placeholder */}
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
            {template.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 16M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {template.widthMm && template.heightMm && (
                  <span className="text-xs font-mono text-gray-400">
                    {template.widthMm} × {template.heightMm} mm
                  </span>
                )}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-studio-yellow/0 group-hover:bg-studio-yellow/5 transition-colors duration-200" />

            {/* Category badge */}
            {template.category && (
              <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full
                               text-xs font-medium bg-white/90 text-gray-600 border border-gray-200 shadow-sm">
                {template.category}
              </span>
            )}
          </div>

          {/* Card body */}
          <div className="p-4 flex flex-col gap-1 flex-1">
            <h2 className="font-semibold text-studio-black text-sm group-hover:text-studio-yellow transition duration-200">
              {template.name}
            </h2>

            {template.description && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {template.description}
              </p>
            )}

            <div className="mt-auto pt-3 flex items-center justify-between">
              {template.widthMm && template.heightMm ? (
                <span className="text-xs text-gray-400 font-mono">
                  {template.widthMm} × {template.heightMm} mm
                </span>
              ) : (
                <span />
              )}
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl
                           bg-studio-yellow/0 group-hover:bg-studio-yellow text-studio-black
                           transition-all duration-200 group-hover:translate-x-0.5"
              >
                Ontwerp aanpassen
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
