interface CheckoutStepperProps {
  current: number // 1, 2, or 3
}

const STEPS = ['Gegevens', 'Bezorging', 'Overzicht']

export default function CheckoutStepper({ current }: CheckoutStepperProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                  done ? 'bg-studio-black text-white' : active ? 'bg-studio-yellow text-[#2C2416]' : 'bg-[#EDE7D9] text-[#B5A48A]',
                ].join(' ')}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : step}
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-studio-black' : 'text-[#B5A48A]'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 sm:w-16 h-px mx-2 mb-4 ${done ? 'bg-studio-black' : 'bg-[#EDE7D9]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
