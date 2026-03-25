/**
 * useAutosave — debounced, race-safe autosave hook for the Studio Twaalf editor.
 *
 * Watches a TemplateDesign state and automatically persists changes via the
 * provided `onSave` function.
 *
 * Key properties:
 *  • Dormant when `designId` is null (no design exists server-side yet).
 *    Once `designId` transitions to a non-null value the hook establishes
 *    the current design as a "clean" baseline and starts watching.
 *  • Debounced: rapid edits (drag, live colour slider) only produce one
 *    network request, fired `debounceMs` ms after the last change.
 *  • Race-safe: an incrementing version counter ensures that a slow request
 *    returning after a newer one was dispatched is silently discarded.
 *  • Change-detection: JSON fingerprinting means the hook never sends a
 *    request when nothing has actually changed (e.g. undo back to the
 *    last-saved state cancels the pending timer).
 *
 * Used alongside (not replacing) the manual "Opslaan" button.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type { TemplateDesign } from '@/types/template'

// ─── Public types ─────────────────────────────────────────────────────────────

export type AutoSaveStatus =
  | 'idle'      // Nothing pending; design matches the last saved version
  | 'pending'   // Debounce timer is running; save hasn't fired yet
  | 'saving'    // Network request is in flight
  | 'saved'     // Last autosave succeeded (shown briefly then returns to idle)
  | 'error'     // Last autosave failed; a retry will be attempted on next change

export interface UseAutosaveReturn {
  /** Current autosave lifecycle status. */
  autoSaveStatus: AutoSaveStatus

  /**
   * True when the design has unsaved changes (pending timer, request in
   * flight, or a previous save failed).  Used to drive beforeunload warnings.
   */
  hasPendingChanges: boolean

  /**
   * Cancel any pending debounce timer and save immediately.
   * Safe to call at any time (no-op when dormant or nothing changed).
   */
  flush: () => void
}

interface UseAutosaveOptions {
  /** Current design state — watched for reference changes. */
  design: TemplateDesign

  /**
   * ID of the persisted design record.
   * The hook is dormant while this is null; it activates automatically once
   * a non-null value is received (e.g. after a first manual save).
   */
  designId: string | null

  /**
   * Async function that persists the design to the server.
   * The hook guarantees this is only called when `designId` is non-null.
   * Should resolve with `{ ok: true }` on success or
   * `{ ok: false, error?: string }` on failure.
   */
  onSave: (design: TemplateDesign) => Promise<{ ok: boolean; error?: string }>

  /** Milliseconds of inactivity before a save is triggered.  Default: 1200. */
  debounceMs?: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAutosave({
  design,
  designId,
  onSave,
  debounceMs = 1200,
}: UseAutosaveOptions): UseAutosaveReturn {

  const [status, setStatus] = useState<AutoSaveStatus>('idle')

  // ── Refs — always hold the latest values; safe to read inside callbacks ──

  const designRef    = useRef(design)
  const designIdRef  = useRef(designId)
  const onSaveRef    = useRef(onSave)
  designRef.current  = design
  designIdRef.current = designId
  onSaveRef.current  = onSave

  /**
   * JSON fingerprint of the last design that was successfully persisted by
   * this hook.  Initialised to the current design JSON when designId is
   * already set on mount (design loaded from server → treated as clean).
   * Null while the hook is still dormant (designId is null).
   */
  const lastSavedJsonRef = useRef<string | null>(
    designId != null ? JSON.stringify(design) : null,
  )

  /**
   * Monotonically-increasing counter.  Incremented before every fetch so
   * that when a response arrives we can tell whether a newer request has
   * already superseded it.
   */
  const saveVersionRef = useRef(0)

  /** Debounce timer handle. */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Guards against triggering autosave on the very first render. */
  const mountedRef = useRef(false)

  // ── Activate when designId transitions null → value ──────────────────────

  useEffect(() => {
    if (designId != null && lastSavedJsonRef.current === null) {
      // A manual save just created the design record.  Treat the current
      // design as the clean baseline so we don't immediately re-save it.
      lastSavedJsonRef.current = JSON.stringify(designRef.current)
      setStatus('idle')
    }
  }, [designId])

  // ── Core save ─────────────────────────────────────────────────────────────

  const performSave = useCallback(async () => {
    // Guard: hook is dormant until design exists on server
    if (!designIdRef.current) return

    const snapshot     = designRef.current
    const snapshotJson = JSON.stringify(snapshot)

    // Nothing changed since the last successful autosave — skip the request
    if (lastSavedJsonRef.current === snapshotJson) {
      setStatus('idle')
      return
    }

    const version = ++saveVersionRef.current
    setStatus('saving')

    try {
      const result = await onSaveRef.current(snapshot)

      // Discard stale response — a newer save has already been dispatched
      if (version !== saveVersionRef.current) return

      if (result.ok) {
        lastSavedJsonRef.current = snapshotJson
        setStatus('saved')
        // Return to idle after a brief "saved" flash
        setTimeout(() => {
          if (saveVersionRef.current === version) setStatus('idle')
        }, 2000)
      } else {
        setStatus('error')
      }
    } catch {
      if (version !== saveVersionRef.current) return
      setStatus('error')
    }
  }, []) // All state read via refs — no deps to keep the callback stable

  // ── Debounced schedule ───────────────────────────────────────────────────

  const scheduleSave = useCallback(() => {
    // Don't schedule if there is no server-side record yet
    if (!designIdRef.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('pending')

    timerRef.current = setTimeout(() => {
      void performSave()
    }, debounceMs)
  }, [debounceMs, performSave])

  // ── Watch design changes ─────────────────────────────────────────────────

  useEffect(() => {
    // Skip the very first render (initial mount with the loaded design)
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    scheduleSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design]) // Intentionally only `design` — scheduleSave is stable

  // ── Flush ────────────────────────────────────────────────────────────────

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    void performSave()
  }, [performSave])

  // ── Cleanup ──────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // ── Derived state ────────────────────────────────────────────────────────

  const hasPendingChanges =
    status === 'pending' ||
    status === 'saving'  ||
    status === 'error'

  return { autoSaveStatus: status, hasPendingChanges, flush }
}
