import { useEffect, useRef, useState } from 'react'
import { useConfig } from '../lib/useConfig.js'
import { streamChat } from '../lib/api.js'
import {
  loadCachedOutput,
  saveCachedOutput,
  removeCachedOutput,
  formatRelativeTime,
} from '../lib/outputCache.js'

/**
 * 一个可重用的 "▶ 用 AI 跑一下" 按钮 + 输出区
 *
 * Props:
 *   prompt          要发送给模型的用户消息（必填）
 *   cacheKey        若提供，则本次结果会被缓存到 localStorage，下次回来自动恢复
 *   label           按钮文字
 *   compact         紧凑样式
 *   className       外层 className
 */
export default function AiRunner({
  prompt,
  cacheKey,
  label = '▶ 用 AI 跑一下',
  compact = false,
  className = '',
}) {
  const { config } = useConfig()

  // ---- 初始化：尝试从缓存恢复上次结果 ----
  const initial = useState(() => loadCachedOutput(cacheKey))[0]

  const [output, setOutput] = useState(initial?.output || '')
  const [usage, setUsage] = useState(initial?.usage || null)
  const [cachedAt, setCachedAt] = useState(initial?.ts || null)
  const [cachedPrompt, setCachedPrompt] = useState(initial?.prompt || '')
  const [cachedModel, setCachedModel] = useState(initial?.model || '')
  const [status, setStatus] = useState(initial?.output ? 'cached' : 'idle')
  // idle | cached | running | done | error

  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const abortRef = useRef(null)
  const startedAtRef = useRef(0)
  const [elapsed, setElapsed] = useState(0)

  // 切换 cacheKey 时（例如换了模板/模块）重新从对应的缓存恢复
  useEffect(() => {
    if (!cacheKey) return
    const entry = loadCachedOutput(cacheKey)
    if (entry?.output) {
      setOutput(entry.output)
      setUsage(entry.usage || null)
      setCachedAt(entry.ts || null)
      setCachedPrompt(entry.prompt || '')
      setCachedModel(entry.model || '')
      setStatus('cached')
    } else {
      setOutput('')
      setUsage(null)
      setCachedAt(null)
      setCachedPrompt('')
      setCachedModel('')
      setStatus('idle')
    }
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  const isStale =
    status === 'cached' && cachedPrompt && cachedPrompt.trim() !== (prompt || '').trim()

  const run = async () => {
    if (status === 'running') return
    setOutput('')
    setError('')
    setUsage(null)
    setStatus('running')
    startedAtRef.current = Date.now()
    setElapsed(0)

    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAtRef.current) / 100) / 10)
    }, 100)

    abortRef.current = new AbortController()
    let finalOutput = ''
    let finalUsage = null
    try {
      const result = await streamChat({
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: prompt },
        ],
        onDelta: (t) => {
          finalOutput += t
          setOutput((prev) => prev + t)
        },
        signal: abortRef.current.signal,
      })
      finalUsage = result.usage
      setUsage(result.usage)
      setStatus('done')
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('done')
      } else {
        setError(err.message)
        setStatus('error')
      }
    } finally {
      clearInterval(timer)
    }

    // 成功 / 中断后，若有内容则写入缓存
    if (cacheKey && finalOutput) {
      const ts = Date.now()
      saveCachedOutput(cacheKey, {
        output: finalOutput,
        usage: finalUsage,
        prompt,
        model: config.model,
        ts,
      })
      setCachedAt(ts)
      setCachedPrompt(prompt)
      setCachedModel(config.model)
    }
  }

  const stop = () => abortRef.current?.abort()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const reset = () => {
    setOutput('')
    setStatus('idle')
    setUsage(null)
    setError('')
    setCachedAt(null)
    setCachedPrompt('')
    setCachedModel('')
    if (cacheKey) removeCachedOutput(cacheKey)
  }

  const showOutputPanel =
    status === 'running' ||
    status === 'cached' ||
    status === 'done' ||
    output ||
    error

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {status === 'running' ? (
          <button onClick={stop} className="btn-ghost text-sm">
            ⏹ 停止 · {elapsed.toFixed(1)}s
          </button>
        ) : (
          <button
            onClick={run}
            disabled={!prompt}
            className={
              compact
                ? 'inline-flex items-center gap-1.5 rounded-full bg-clay-500 px-3 py-1.5 text-xs font-medium text-cream-50 shadow-warm transition hover:bg-clay-600 disabled:opacity-50'
                : 'btn-primary text-sm'
            }
          >
            {status === 'cached' ? (isStale ? '▶ 重跑（提示词已改）' : '⟳ 重跑') : label}
          </button>
        )}
        {(status === 'done' || status === 'cached') && output && (
          <>
            {status === 'done' && (
              <button onClick={run} className="btn-ghost text-sm">
                ⟳ 重跑
              </button>
            )}
            <button onClick={copy} className="btn-ghost text-sm">
              {copied ? '✓ 已复制' : '复制结果'}
            </button>
            <button
              onClick={reset}
              className="text-xs text-ink-700/70 underline-offset-2 hover:underline"
            >
              清空缓存
            </button>
          </>
        )}
        {usage && (
          <span className="ml-auto font-mono text-[11px] text-ink-700/70">
            tokens: {usage.prompt_tokens} → {usage.completion_tokens}
          </span>
        )}
      </div>

      {showOutputPanel && (
        <div
          className={`mt-3 rounded-2xl border p-4 ${
            status === 'cached'
              ? isStale
                ? 'border-amber-300/50 bg-amber-50/40'
                : 'border-clay-500/15 bg-cream-100/50'
              : 'border-clay-500/20 bg-gradient-to-br from-cream-100 to-cream-200/40'
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-clay-700">
            <span>
              {status === 'running'
                ? '⏳'
                : status === 'error'
                ? '✗'
                : status === 'cached'
                ? '♻️'
                : '✓'}
            </span>
            <span>
              {status === 'running'
                ? `AI 正在生成... ${elapsed.toFixed(1)}s`
                : status === 'error'
                ? '生成失败'
                : status === 'cached'
                ? `上次结果 · ${formatRelativeTime(cachedAt)}`
                : `AI 输出 · 共 ${output.length} 字`}
            </span>
            {status === 'cached' && isStale && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                提示词已修改 · 建议重跑
              </span>
            )}
            <span className="ml-auto font-mono text-[10px] text-ink-700/60">
              {status === 'cached' ? cachedModel || config.model : config.model}
            </span>
          </div>

          {error ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs text-red-700">
              {error}
              {error.includes('no_key') && (
                <>{'\n\n请打开右上角 ⚙️ 检查后端 Key 配置。'}</>
              )}
            </pre>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-ink-900">
              {output || ' '}
              {status === 'running' && (
                <span className="ml-0.5 inline-block w-[2px] bg-clay-500 align-middle animate-blink">
                  &nbsp;
                </span>
              )}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
