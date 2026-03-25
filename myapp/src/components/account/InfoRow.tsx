interface Props {
  label:      string
  value:      React.ReactNode
  empty?:     string   // text shown when value is null/undefined/empty string
  className?: string
}

/**
 * A horizontal label + value row used on the Gegevens page.
 * Stacks vertically on small screens.
 */
export default function InfoRow({ label, value, empty = '—', className = '' }: Props) {
  const isEmpty = value === null || value === undefined || value === ''

  return (
    <div className={`flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 py-3.5
                     border-b border-neutral-100 last:border-0 ${className}`}>
      <dt className="w-full sm:w-36 flex-shrink-0 text-xs font-medium text-[#9C8F7A] tracking-wide">
        {label}
      </dt>
      <dd className="text-sm text-[#2C2416] flex-1">
        {isEmpty ? (
          <span className="text-[#C4B8A0] italic text-xs">{empty}</span>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
