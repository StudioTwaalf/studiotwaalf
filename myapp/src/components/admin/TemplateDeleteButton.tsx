'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTemplateAction } from '@/app/admin/templates/[id]/actions'

interface Props {
  id:   string
  name: string
}

export default function TemplateDeleteButton({ id, name }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!window.confirm(`"${name}" verwijderen?\n\nAlle bijbehorende designs van klanten worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.`)) return
    startTransition(async () => {
      await deleteTemplateAction(id)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title="Verwijderen"
      aria-label={`${name} verwijderen`}
      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-400
                 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
