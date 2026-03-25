'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  duplicateVariantAction,
  toggleVariantActiveAction,
  setVariantDefaultAction,
  deleteVariantAction,
} from '@/app/admin/gadgets/[id]/variants/[variantId]/actions'

interface Props {
  productId:   string
  variantId:   string
  variantName: string
  isActive:    boolean
  isDefault:   boolean
}

export default function VariantActionsRow({ productId, variantId, variantName, isActive, isDefault }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action()
      router.refresh()
    })
  }

  return (
    <div className={['flex items-center gap-0.5 shrink-0', pending ? 'opacity-50 pointer-events-none' : ''].join(' ')}>
      {/* Set default */}
      {!isDefault && (
        <button
          type="button"
          onClick={() => run(() => setVariantDefaultAction(productId, variantId))}
          title="Standaard maken"
          className="px-2 py-1 text-xs text-gray-400 hover:text-indigo-600 hover:bg-indigo-50
                     rounded transition-colors whitespace-nowrap"
        >
          Standaard
        </button>
      )}

      {/* Toggle active */}
      <button
        type="button"
        onClick={() => run(() => toggleVariantActiveAction(productId, variantId, !isActive))}
        title={isActive ? 'Deactiveren' : 'Activeren'}
        className="px-2 py-1 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100
                   rounded transition-colors whitespace-nowrap"
      >
        {isActive ? 'Deactiveren' : 'Activeren'}
      </button>

      {/* Duplicate */}
      <button
        type="button"
        onClick={() => run(() => duplicateVariantAction(productId, variantId))}
        title="Dupliceren"
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Edit */}
      <Link
        href={`/admin/gadgets/${productId}/variants/${variantId}`}
        className="px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700
                   hover:bg-indigo-50 rounded transition-colors"
      >
        Bewerken
      </Link>

      {/* Delete */}
      <button
        type="button"
        onClick={() => {
          if (!window.confirm(`"${variantName}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return
          run(() => deleteVariantAction(productId, variantId))
        }}
        title="Verwijderen"
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
