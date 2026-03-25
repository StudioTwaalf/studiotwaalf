import { NextRequest, NextResponse } from 'next/server'
import { getStorageProvider } from '@/lib/storage'

// ─── POST /api/admin/upload — file upload for admin and editor ────────────────

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer   = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || 'application/octet-stream'
  const filename = file.name

  try {
    const provider = getStorageProvider()
    const result   = await provider.upload(buffer, filename, mimeType)

    return NextResponse.json({
      url:      result.url,
      mimeType: result.mimeType ?? mimeType,
    })
  } catch (err) {
    console.error('[upload] Error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
