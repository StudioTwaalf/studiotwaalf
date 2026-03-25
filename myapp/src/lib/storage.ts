/**
 * Provider-agnostic file storage
 *
 * Active provider is chosen at startup based on env vars:
 *   • Cloudinary → set CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 *   • Local dev   → (default) writes to /public/uploads/, served at /uploads/*
 *
 * To add a new provider implement StorageProvider and return it from getStorageProvider().
 */

import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

// ── Public types ───────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string
  mimeType?: string
  sizeBytes?: number
}

export interface StorageProvider {
  upload(buffer: Buffer, filename: string, mimeType: string): Promise<UploadResult>
}

// ── Local storage (dev fallback) ───────────────────────────────────────────────

class LocalStorageProvider implements StorageProvider {
  private dir: string

  constructor() {
    this.dir = path.join(process.cwd(), 'public', 'uploads')
  }

  async upload(buffer: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    await fs.mkdir(this.dir, { recursive: true })

    // Sanitise filename and prefix with timestamp to avoid collisions
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const name = `${Date.now()}-${safe}`
    const fullPath = path.join(this.dir, name)

    await fs.writeFile(fullPath, buffer)

    return {
      url: `/uploads/${name}`,
      mimeType,
      sizeBytes: buffer.length,
    }
  }
}

// ── Cloudinary provider (activates when env vars are present) ──────────────────
//
// Required env vars:
//   CLOUDINARY_CLOUD_NAME   e.g. "mycloud"
//   CLOUDINARY_API_KEY      e.g. "123456789012345"
//   CLOUDINARY_API_SECRET   e.g. "AbCdEfGhIjKlMnOpQrStUvWx"
//
// Optional:
//   CLOUDINARY_FOLDER       e.g. "studio-twaalf/products"  (default: "products")

class CloudinaryProvider implements StorageProvider {
  private cloudName: string
  private apiKey: string
  private apiSecret: string
  private folder: string

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.folder = process.env.CLOUDINARY_FOLDER ?? 'products'
  }

  async upload(buffer: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const folder = this.folder

    // Build signature: SHA-256 of "folder=...&timestamp=...{api_secret}"
    const paramStr = `folder=${folder}&timestamp=${timestamp}`
    const signature = crypto
      .createHash('sha256')
      .update(`${paramStr}${this.apiSecret}`)
      .digest('hex')

    const form = new FormData()
    // TypeScript's DOM lib requires ArrayBuffer, not the Node.js ArrayBufferLike;
    // Buffer is binary-compatible so the cast is safe here.
    form.append('file', new Blob([buffer as unknown as ArrayBuffer], { type: mimeType }), filename)
    form.append('api_key', this.apiKey)
    form.append('timestamp', timestamp)
    form.append('folder', folder)
    form.append('signature', signature)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      { method: 'POST', body: form },
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Cloudinary upload failed: ${JSON.stringify(err)}`)
    }

    const data = await res.json() as { secure_url: string; bytes: number; format: string }

    return {
      url: data.secure_url,
      mimeType: `image/${data.format}`,
      sizeBytes: data.bytes,
    }
  }
}

// ── Factory ────────────────────────────────────────────────────────────────────

let _provider: StorageProvider | null = null

export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    _provider = new CloudinaryProvider(
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET,
    )
    console.log('[storage] Using Cloudinary provider')
  } else {
    _provider = new LocalStorageProvider()
    if (process.env.NODE_ENV !== 'test') {
      console.log('[storage] Using local storage provider (public/uploads/)')
    }
  }

  return _provider
}
