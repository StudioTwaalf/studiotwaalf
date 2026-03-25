'use client'

import { useState } from 'react'

interface Props {
  value: string
}

export default function CopyButton({ value }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback: ignore silently
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy full ID: ${value}`}
      className={`
        ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded
        transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400
        ${copied
          ? 'text-green-500 bg-green-50'
          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}
      `}
    >
      {copied ? (
        // Checkmark
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        // Copy icon
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2
               m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}
