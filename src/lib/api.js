const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function getHealth() {
  const r = await fetch(`${API_BASE}/api/health`)
  if (!r.ok) throw new Error(`Health check failed: HTTP ${r.status}`)
  return r.json()
}

export async function getBalance() {
  const r = await fetch(`${API_BASE}/api/balance`)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.message || `Balance check failed: HTTP ${r.status}`)
  return data
}

/**
 * 流式调用 /api/chat
 * @param {Object}    opts
 * @param {string}    opts.model
 * @param {Array}     opts.messages       OpenAI 格式
 * @param {number=}   opts.temperature
 * @param {number=}   opts.max_tokens
 * @param {Function=} opts.onDelta        (text) => void  每收到一段文本就回调
 * @param {AbortSignal=} opts.signal
 * @returns {Promise<{ usage: Object|null }>}
 */
export async function streamChat({
  model,
  messages,
  temperature,
  max_tokens,
  onDelta,
  signal,
}) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let usage = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let nl
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (data === '[DONE]') return { usage }
      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) onDelta?.(delta)
        if (parsed.usage) usage = parsed.usage
      } catch {
        /* skip malformed line */
      }
    }
  }
  return { usage }
}
