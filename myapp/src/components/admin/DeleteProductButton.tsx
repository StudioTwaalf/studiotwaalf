'use client'

import { useTransition } from 'react'

interface Props {
  boundAction: () => void | Promise<void>
  productName: string
}

export default function DeleteProductButton({ boundAction, productName }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm(`Product "${productName}" definitief verwijderen?`)) return
    startTransition(() => { boundAction() })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="w-full text-center text-sm text-red-500 hover:text-red-700 border border-red-100
                 bg-white hover:bg-red-50 py-2.5 rounded-xl transition-colors disabled:opacity-60
                 disabled:cursor-not-allowed"
    >
      {isPending ? 'Verwijderen…' : 'Product verwijderen'}
    </button>
  )
}
