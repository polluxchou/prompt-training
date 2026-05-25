import { useRef, useState } from 'react'
import { streamChat } from '../../lib/api.js'
import { completeRun, failRun, startRun } from '../../lib/schedulesStore.js'
import { useConfig } from '../../lib/useConfig.js'

/**
 * 试跑面板：直接调 DeepSeek 并流式渲染。
 * Props:
 *   prompt          要试跑的提示词
 *   provider/model  忽略 provider（原型只对接 DeepSeek），model 用 schedule 上设的
 *   persistTo       若提供 schedule id，则跑完会写入 scheduled_runs + agent_articles（manual trigger）
 *   compact         紧凑样式
 *   disabledReason  若不为空，按钮变 disabled 并 title 显示
 *   onPersisted     (article) => void  持久化后回调，供 detail 页跳转
 */
export default function TryRun({
  prompt,
  model,
  persistTo,
  compact = true,
  disabledReason = '',
  onPersisted,
}) {
  const { config } = useConfig()
  const [status, setStatus] = useState('idle')
  // idle | running | done | error
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [usage, setUsage] = useState(null)
  const [articleId, setArticleId] = useState(null)
  const abortRef = useRef(null)
  const startedRef = useRef(0)
  const timerRef = useRef(null)

  const usedModel = model || config.model || 'deepseek-v4-flash'

  const run = async () => {
    if (status === 'running') return
    setStatus('running')
    setOutput('')
    setError('')
    setUsage(null)
    setArticleId(null)
    setElapsed(0)
    startedRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedRef.current) / 100) / 10)
    }, 100)

    abortRef.current = new AbortController()
    let runRow = null
    if (persistTo) {
      try {
        runRow = startRun(persistTo, 'manual')
      } catch {
        /* ignore — fall back to non-persist */
      }
    }

    let acc = ''
    let finalUsage = null
    try {
      const result = await streamChat({
        model: usedModel,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: prompt },
        ],
        onDelta: (t) => {
          acc += t
          setOutput((prev) => prev + t)
        },
        signal: abortRef.current.signal,
      })
      finalUsage = result.usage
      setUsage(result.usage)
      setStatus('done')

      if (runRow) {
        try {
          const article = completeRun(runRow.id, {
            content: acc,
            tokenUsage: result.usage,
            model: usedModel,
          })
          setArticleId(article.id)
          onPersisted?.(article)
        } catch (e) {
          /* ignore */
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
        setStatus('error')
        if (runRow) failRun(runRow.id, err.message)
      } else {
        setStatus('done')
        if (runRow && acc) {
          try {
            const article = completeRun(runRow.id, {
              content: acc,
              tokenUsage: finalUsage,
              model: usedModel,
            })
            setArticleId(article.id)
            onPersisted?.(article)
          } catch {
            /* ignore */
          }
        } else if (runRow) {
          failRun(runRow.id, 'aborted')
        }
      }
    } finally {
      clearInterval(timerRef.current)
    }
  }

  const stop = () => abortRef.current?.abort()

  const buttonBase = compact
    ? 'inline-flex items-center gap-1.5 rounded-full bg-clay-500 px-3 py-1.5 text-xs font-medium text-cream-50 shadow-warm transition hover:bg-clay-600 disabled:opacity-50'
    : 'btn-primary text-sm'

  const isDisabled = !prompt?.trim() || Boolean(disabledReason)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {status === 'running' ? (
          <button onClick={stop} className="btn-ghost text-sm">
            ⏹ 停止 · {elapsed.toFixed(1)}s
          </button>
        ) : (
          <button
            onClick={run}
            disabled={isDisabled}
            title={disabledReason || '直接调 DeepSeek 试跑当前提示词（Prompt）'}
            className={buttonBase}
          >
            {status === 'done' && output ? '⟳ 再试一次' : '▶ 立即试跑'}
          </button>
        )}
        {usage && (
          <span className="font-mono text-[11px] text-ink-700/70">
            tokens: {usage.prompt_tokens} → {usage.completion_tokens}
          </span>
        )}
        {articleId && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
            已存档为文章
          </span>
        )}
      </div>

      {(status === 'running' || output || error) && (
        <div
          className={`mt-3 rounded-2xl border p-4 ${
            status === 'error'
              ? 'border-red-300/60 bg-red-50/50'
              : 'border-clay-500/20 bg-gradient-to-br from-cream-100 to-cream-200/40'
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-clay-700">
            <span>
              {status === 'running' ? '⏳' : status === 'error' ? '✗' : '✓'}
            </span>
            <span>
              {status === 'running'
                ? `AI 正在生成... ${elapsed.toFixed(1)}s`
                : status === 'error'
                ? '生成失败'
                : `输出 · ${output.length} 字`}
            </span>
            <span className="ml-auto font-mono text-[10px] text-ink-700/60">
              {usedModel}
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
