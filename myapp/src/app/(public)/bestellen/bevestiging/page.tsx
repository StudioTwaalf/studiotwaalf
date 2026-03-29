import { Suspense } from 'react'
import BevestigingClient from './BevestigingClient'

export default function BevestigingPage() {
  return (
    <Suspense fallback={null}>
      <BevestigingClient />
    </Suspense>
  )
}
