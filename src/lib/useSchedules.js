import { useEffect, useState } from 'react'
import { getState, subscribe } from './schedulesStore.js'

export function useSchedulesState() {
  const [state, setState] = useState(getState)
  useEffect(() => {
    const unsub = subscribe((next) => setState(next))
    return () => unsub()
  }, [])
  return state
}
