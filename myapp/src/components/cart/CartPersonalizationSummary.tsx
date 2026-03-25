interface CartPersonalizationSummaryProps {
  personalization: Record<string, string>
}

// Capitalise the first letter of a key for display
function labelFor(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
}

export default function CartPersonalizationSummary({ personalization }: CartPersonalizationSummaryProps) {
  const entries = Object.entries(personalization).filter(([, v]) => v?.toString().trim())
  if (entries.length === 0) return null

  return (
    <div className="mt-2 bg-[#FAF7F2] border border-[#EDE7D9] rounded-lg px-3 py-2.5 space-y-1">
      <p className="text-[10px] font-semibold text-[#B5A48A] uppercase tracking-widest mb-1.5">
        Personalisatie
      </p>
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-1.5 text-xs leading-relaxed">
          <span className="text-[#8A7A6A] shrink-0">{labelFor(key)}:</span>
          <span className="text-studio-black font-medium break-words min-w-0">{value}</span>
        </div>
      ))}
    </div>
  )
}
