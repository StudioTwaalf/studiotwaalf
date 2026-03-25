import type { ProjectStatus } from '@/types/account'

export type { ProjectStatus }

interface Config {
  label: string
  pill:  string    // wrapper
  dot:   string    // dot bg color
  ping:  boolean   // live-indicator pulse on active statuses
}

const STATUS_CONFIG: Record<ProjectStatus, Config> = {
  concept: {
    label: 'Concept',
    pill:  'bg-neutral-100 text-neutral-500 border border-neutral-200',
    dot:   'bg-neutral-300',
    ping:  false,
  },
  in_opbouw: {
    label: 'In opbouw',
    pill:  'bg-sky-50 text-sky-700 border border-sky-100',
    dot:   'bg-sky-400',
    ping:  true,
  },
  offerte_aangevraagd: {
    label: 'Offerte gevraagd',
    pill:  'bg-amber-50 text-amber-700 border border-amber-100',
    dot:   'bg-amber-400',
    ping:  true,
  },
  wacht_op_akkoord: {
    label: 'Wacht op akkoord',
    pill:  'bg-[#FFF8E7] text-[#8C6D1A] border border-[#E7C46A]/30',
    dot:   'bg-[#E7C46A]',
    ping:  true,
  },
  in_productie: {
    label: 'In productie',
    pill:  'bg-violet-50 text-violet-700 border border-violet-100',
    dot:   'bg-violet-400',
    ping:  true,
  },
  afgeleverd: {
    label: 'Afgeleverd',
    pill:  'bg-emerald-50 text-emerald-700 border border-emerald-100',
    dot:   'bg-emerald-400',
    ping:  false,
  },
}

interface Props {
  status: ProjectStatus
}

export default function StatusBadge({ status }: Props) {
  const { label, pill, dot, ping } = STATUS_CONFIG[status]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${pill}`}>
      {ping ? (
        /* Radar-pulse dot — signals the status is actively moving */
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0" aria-hidden>
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
        </span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} aria-hidden />
      )}
      {label}
    </span>
  )
}
