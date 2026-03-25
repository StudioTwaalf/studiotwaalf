interface Props {
  title?:    string
  subtitle?: string
  children:  React.ReactNode
  action?:   React.ReactNode  // optional top-right slot (e.g. edit button)
  flush?:    boolean          // remove internal padding (for custom content)
}

/**
 * Reusable card container for account page sections.
 * White background, soft border, rounded-2xl — Studio Twaalf's signature card shape.
 */
export default function SectionCard({ title, subtitle, children, action, flush = false }: Props) {
  const hasHeader = title || action

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-neutral-100">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-[#2C2416] tracking-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#9C8F7A]">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={flush ? '' : 'px-6 py-5'}>{children}</div>
    </div>
  )
}
