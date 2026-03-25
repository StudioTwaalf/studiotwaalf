import type { OrderStatus } from '@/types/account'

interface Config {
  label:     string
  className: string
  dot:       string
}

const ORDER_STATUS_CONFIG: Record<OrderStatus, Config> = {
  offerte: {
    label:     'Offerte',
    className: 'bg-neutral-100 text-neutral-500 border border-neutral-200',
    dot:       'bg-neutral-400',
  },
  bevestigd: {
    label:     'Bevestigd',
    className: 'bg-sky-50 text-sky-700 border border-sky-100',
    dot:       'bg-sky-400',
  },
  in_productie: {
    label:     'In productie',
    className: 'bg-violet-50 text-violet-700 border border-violet-100',
    dot:       'bg-violet-400',
  },
  verzonden: {
    label:     'Verzonden',
    className: 'bg-amber-50 text-amber-700 border border-amber-100',
    dot:       'bg-amber-400',
  },
  geleverd: {
    label:     'Geleverd',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    dot:       'bg-emerald-400',
  },
}

interface Props {
  status: OrderStatus
}

export default function OrderStatusBadge({ status }: Props) {
  const { label, className, dot } = ORDER_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} aria-hidden />
      {label}
    </span>
  )
}
