import { useEffect, useState, useCallback } from 'react'
import { loadConfig, saveConfig, DEFAULT_CONFIG } from './config.js'

let listeners = new Set()
let currentConfig = null

function getConfig() {
  if (!currentConfig) currentConfig = loadConfig()
  return currentConfig
}

function setConfig(next) {
  currentConfig = next
  saveConfig(next)
  listeners.forEach((fn) => fn(next))
}

export function useConfig() {
  const [config, setLocal] = useState(getConfig)

  useEffect(() => {
    const fn = (c) => setLocal(c)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  const update = useCallback((patch) => {
    setConfig({ ...getConfig(), ...patch })
  }, [])

  const reset = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG })
  }, [])

  return { config, update, reset }
}
