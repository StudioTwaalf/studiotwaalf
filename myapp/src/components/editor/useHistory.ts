import { useReducer, useCallback } from 'react'
import type { TemplateDesign } from '@/types/template'
import { MAX_HISTORY } from './constants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryState {
  past:    TemplateDesign[]
  present: TemplateDesign
  future:  TemplateDesign[]
}

type HistoryAction =
  | { type: 'SET';    design: TemplateDesign }  // live update, no history push
  | { type: 'COMMIT'; design: TemplateDesign }  // push to history + update present
  | { type: 'UNDO' }
  | { type: 'REDO' }

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'SET': {
      // Update present without touching history (used during live drag)
      return { ...state, present: action.design }
    }
    case 'COMMIT': {
      // Push current present to past, set new present, clear future
      const past = [...state.past, state.present].slice(-MAX_HISTORY)
      return { past, present: action.design, future: [] }
    }
    case 'UNDO': {
      if (state.past.length === 0) return state
      const past    = state.past.slice(0, -1)
      const present = state.past[state.past.length - 1]
      const future  = [state.present, ...state.future]
      return { past, present, future }
    }
    case 'REDO': {
      if (state.future.length === 0) return state
      const [present, ...future] = state.future
      const past = [...state.past, state.present]
      return { past, present, future }
    }
    default:
      return state
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHistory(initialDesign: TemplateDesign) {
  const [state, dispatch] = useReducer(reducer, {
    past:    [],
    present: JSON.parse(JSON.stringify(initialDesign)) as TemplateDesign,
    future:  [],
  })

  /** Update present immediately (no history entry) — use during live drag. */
  const set = useCallback((design: TemplateDesign) => {
    dispatch({ type: 'SET', design })
  }, [])

  /** Record present to history and set new present — use on interaction end. */
  const commit = useCallback((design: TemplateDesign) => {
    dispatch({ type: 'COMMIT', design })
  }, [])

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])

  return {
    design:   state.present,
    canUndo:  state.past.length > 0,
    canRedo:  state.future.length > 0,
    set,
    commit,
    undo,
    redo,
  }
}
