const PREFIX = 'luosi-output:'

export function loadCachedOutput(key) {
  if (!key) return null
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveCachedOutput(key, entry) {
  if (!key) return
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota exceeded - silently ignore */
  }
}

export function removeCachedOutput(key) {
  if (!key) return
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

export function listCachedKeys() {
  const keys = []
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length))
    }
  } catch {
    /* ignore */
  }
  return keys
}

export function clearAllCachedOutputs() {
  try {
    const all = listCachedKeys()
    all.forEach((k) => localStorage.removeItem(PREFIX + k))
    return all.length
  } catch {
    return 0
  }
}

export function formatRelativeTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  return `${day} 天前`
}
