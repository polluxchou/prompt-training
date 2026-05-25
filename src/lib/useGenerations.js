import { useEffect, useState } from 'react'
import { getState, subscribe } from './generationsStore.js'

export function useGenerationsState() {
  const [state, setState] = useState(getState)
  useEffect(() => {
    const unsub = subscribe((next) => setState(next))
    return () => unsub()
  }, [])
  return state
}
