'use client'

/**
 * Upload-wachtrij voor de wegwerpcamera.
 *
 * Waarom dit bestaat: het netwerk in een feestzaal is slecht.  Kelders, oude
 * gebouwen, 150 mensen op één access point.  Zonder wachtrij is een mislukte
 * upload een foto die voorgoed weg is — en dat is het enige echt onherstelbare
 * probleem in deze app.
 *
 * Dus: elke foto gaat eerst als Blob naar IndexedDB en pas daarna naar de
 * server.  Lukt het niet, dan blijft hij staan en proberen we opnieuw bij
 * "online", bij terugkeer naar de tab, en met oplopende wachttijd.
 */

const DB_NAME = 'wedding-camera'
const DB_VERSION = 1
const STORE = 'queue'

export interface QueueItem {
  id: string
  slug: string
  blob: Blob
  width: number
  height: number
  createdAt: number
  attempts: number
}

export interface QueueState {
  pending: number
  sending: boolean
  /** Laatste foutmelding die de gast mag zien (null = niets aan de hand) */
  error: string | null
}

// ── IndexedDB helpers ────────────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = fn(transaction.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

const putItem = (item: QueueItem) => tx('readwrite', (s) => s.put(item))
const deleteItem = (id: string) => tx('readwrite', (s) => s.delete(id))
const allItems = () => tx<QueueItem[]>('readonly', (s) => s.getAll() as IDBRequest<QueueItem[]>)

// ── Wachtrij ─────────────────────────────────────────────────────────────────

type Listener = (state: QueueState) => void

const listeners = new Set<Listener>()
let state: QueueState = { pending: 0, sending: false, error: null }
let flushing = false
let started = false

function emit(patch: Partial<QueueState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l(state))
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  listener(state)
  return () => {
    listeners.delete(listener)
  }
}

export function getQueueState(): QueueState {
  return state
}

/** Start de wachtrij: telt wat er nog klaarstaat en zet de retry-triggers op. */
export async function startQueue(): Promise<void> {
  if (started) return
  started = true

  const items = await allItems()
  emit({ pending: items.length })

  window.addEventListener('online', () => void flush())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void flush()
  })

  void flush()
}

export async function enqueue(
  item: Omit<QueueItem, 'createdAt' | 'attempts'>,
): Promise<void> {
  await putItem({ ...item, createdAt: Date.now(), attempts: 0 })
  emit({ pending: state.pending + 1 })
  void flush()
}

/** Aantal foto's dat nog niet bij de server is — voor "3 foto's worden verstuurd". */
export async function pendingCount(): Promise<number> {
  const items = await allItems()
  emit({ pending: items.length })
  return items.length
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function flush(): Promise<void> {
  if (flushing) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return

  flushing = true
  emit({ sending: true })

  try {
    let items = await allItems()
    items.sort((a, b) => a.createdAt - b.createdAt)

    for (const item of items) {
      const outcome = await send(item)

      if (outcome === 'done' || outcome === 'dropped') {
        await deleteItem(item.id)
        emit({ pending: Math.max(0, state.pending - 1) })
        continue
      }

      // 'retry' — bewaren, teller ophogen en later opnieuw proberen
      await putItem({ ...item, attempts: item.attempts + 1 })

      // Oplopende wachttijd, afgetopt op 30s.  We stoppen deze ronde: de
      // volgende trigger (online / tab actief / nieuwe foto) pakt het weer op.
      await wait(Math.min(30_000, 1_000 * 2 ** Math.min(item.attempts, 5)))
      break
    }
  } finally {
    flushing = false
    emit({ sending: false })
    const left = await allItems()
    emit({ pending: left.length })
    if (left.length > 0 && navigator.onLine) {
      // Nog werk te doen en we zijn online — meteen door
      void flush()
    }
  }
}

type Outcome = 'done' | 'retry' | 'dropped'

async function send(item: QueueItem): Promise<Outcome> {
  const body = new FormData()
  body.append('file', item.blob, `${item.id}.jpg`)
  body.append('clientId', item.id)
  body.append('width', String(item.width))
  body.append('height', String(item.height))

  let res: Response
  try {
    res = await fetch(`/api/wedding/${item.slug}/photo`, { method: 'POST', body })
  } catch {
    // Netwerk weg — geen fout tonen, gewoon blijven proberen
    return 'retry'
  }

  if (res.ok) {
    emit({ error: null })
    return 'done'
  }

  // Filmpje vol of sessie weg: opnieuw proberen heeft geen zin
  if (res.status === 409 || res.status === 401 || res.status === 403 || res.status === 413) {
    const data = await res.json().catch(() => ({}) as { error?: string })
    emit({ error: data.error ?? 'Deze foto kon niet bewaard worden' })
    return 'dropped'
  }

  return 'retry'
}
