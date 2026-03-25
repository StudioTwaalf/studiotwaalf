// Pure presentational — no client hooks needed.

interface Props {
  steps: string[]
  currentIndex: number
}

export default function ProgressSteps({ steps, currentIndex }: Props) {
  return (
    <nav aria-label="Voortgang" className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isDone    = i < currentIndex
        const isCurrent = i === currentIndex
        const isLast    = i === steps.length - 1

        return (
          <div key={step} className="flex items-center">
            {/* Step pill */}
            <div
              className={[
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                isDone    ? 'bg-studio-sage/30 text-studio-black'   : '',
                isCurrent ? 'bg-studio-yellow text-studio-black'      : '',
                !isDone && !isCurrent ? 'bg-gray-100 text-gray-400' : '',
              ].join(' ')}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isDone && (
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {step}
            </div>

            {/* Connector */}
            {!isLast && (
              <div className={[
                'w-6 h-px mx-0.5',
                i < currentIndex ? 'bg-studio-sage' : 'bg-gray-200',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </nav>
  )
}
