interface Props {
  eyebrow?: string
  title:    string
  body?:    string
}

/**
 * Standard page header for account sections.
 * Eyebrow → title → body copy.
 */
export default function PageIntro({ eyebrow, title, body }: Props) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#B5A48A] mb-1.5">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-semibold text-[#2C2416] tracking-tight">{title}</h1>
      {body && (
        <p className="mt-1.5 text-sm text-[#9C8F7A] max-w-lg leading-relaxed">{body}</p>
      )}
    </div>
  )
}
