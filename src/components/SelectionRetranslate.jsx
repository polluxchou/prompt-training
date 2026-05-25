import { useEffect, useMemo, useRef, useState } from 'react'
import { streamChat } from '../lib/api.js'
import { buildTranslationMessages } from '../lib/promptPipeline.js'
import { useConfig } from '../lib/useConfig.js'
import { stripLeadingTitle } from './Markdown.jsx'

/**
 * 选区重译：用户在原文容器里圈选文字 → 浮出"🔁 重译选区"按钮。
 * 点击后只翻译选中部分，结果在侧边面板，可选"替换到译文对应段落"。
 * 支持双向：sourceLang='zh' → 翻译为英文；sourceLang='en' → 翻译为中文。
 *
 * Props:
 *   targetRef          原文容器 ref（在此 ref 内的选区才会响应）
 *   sourceFull         gen.content 完整原文（任一语种）
 *   translatedFull     gen.english_content 完整译文（可空）—— 字段名沿用旧 schema
 *   sourceTitle        原文标题
 *   translatedTitle    译文标题
 *   sourceLang         'zh' | 'en'，决定翻译方向
 *   onReplace          (nextTranslatedFull) => void  · 段落替换后回调
 */
export default function SelectionRetranslate({
  targetRef,
  sourceFull,
  translatedFull,
  sourceTitle,
  translatedTitle,
  sourceLang = 'zh',
  taskType,
  industryKeywords,
  onReplace,
}) {
  const { config } = useConfig()

  const [selectionText, setSelectionText] = useState('')
  const [anchor, setAnchor] = useState(null) // {top, left}
  const [panelOpen, setPanelOpen] = useState(false)
  const [stage, setStage] = useState('idle') // idle | running | done | error
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [paragraphRange, setParagraphRange] = useState(null) // { startPara, endPara } 或 null

  const abortRef = useRef(null)
  const timerRef = useRef(null)
  const startedRef = useRef(0)

  // ── 选区监听 ────────────────────────────────
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        // 选区为空 → 隐藏按钮（但不关 panel，panel 关闭由自己控制）
        setSelectionText('')
        setAnchor(null)
        return
      }
      const text = sel.toString()
      if (!text || !text.trim()) {
        setSelectionText('')
        setAnchor(null)
        return
      }
      // 仅当选区位于目标容器内才响应
      const root = targetRef?.current
      if (!root) return
      const a = sel.anchorNode
      const f = sel.focusNode
      if (!root.contains(a) || !root.contains(f)) {
        setSelectionText('')
        setAnchor(null)
        return
      }
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (!rect || (rect.width === 0 && rect.height === 0)) return
      setSelectionText(text)
      setAnchor({
        // 浮按钮 position:fixed，坐标用视口系（rect 已是视口相对），不要再加 scrollY/X
        top: rect.bottom + 6,
        left: rect.right - 120,
      })
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [targetRef])

  // ── 段落区间推算 ───────────────────────────
  // 注意：必须在「剥掉前导 # 标题」之后的 body 上数段落，
  // 否则两边前导 # 标题数量不一致时段落 index 会错位。
  const range = useMemo(
    () => alignParagraphs(sourceFull || '', selectionText, sourceTitle),
    [sourceFull, selectionText, sourceTitle],
  )

  // ── 翻译流式调用 ───────────────────────────
  const run = async () => {
    setPanelOpen(true)
    setOutput('')
    setError('')
    setStage('running')
    setElapsed(0)
    startedRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedRef.current) / 100) / 10)
    }, 100)
    setParagraphRange(range)

    abortRef.current = new AbortController()
    let acc = ''
    try {
      await streamChat({
        model: config.model,
        temperature: 0.2,
        max_tokens: Math.max(2048, config.max_tokens || 2048),
        messages: buildTranslationMessages({
          sourceContent: selectionText,
          sourceLang,
          taskType,
          industryKeywords,
        }),
        onDelta: (t) => {
          acc += t
          setOutput((prev) => prev + t)
        },
        signal: abortRef.current.signal,
      })
      setStage('done')
    } catch (err) {
      if (err.name === 'AbortError') {
        setStage('done')
      } else {
        setError(err.message || 'unknown error')
        setStage('error')
      }
    } finally {
      clearInterval(timerRef.current)
    }
  }

  const stop = () => abortRef.current?.abort()

  const close = () => {
    setPanelOpen(false)
    setStage('idle')
    setOutput('')
    setError('')
    setParagraphRange(null)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output)
    } catch {
      /* ignore */
    }
  }

  // ── 替换到译文版本 ───────────────────────────
  const canReplace =
    stage === 'done' &&
    output.trim() &&
    paragraphRange &&
    translatedFull &&
    translatedFull.trim()

  const replace = () => {
    if (!canReplace) return
    const next = spliceParagraphs(
      translatedFull,
      paragraphRange.startPara,
      paragraphRange.endPara,
      output.trim(),
      translatedTitle,
    )
    if (next === null) {
      alert(
        '译文的段落数与原文不匹配，无法精确替换。\n请用「复制」把新译文手动粘到对应位置。',
      )
      return
    }
    onReplace?.(next)
    close()
  }

  // ── 渲染 ───────────────────────────────────
  return (
    <>
      {/* 浮动"🔁 重译选区"按钮 —— 仅当选区有效时显示 */}
      {anchor && selectionText && !panelOpen && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault() /* 防止失去选区 */}
          onClick={run}
          style={{ top: anchor.top, left: Math.max(8, anchor.left) }}
          className="fixed z-40 inline-flex items-center gap-1.5 rounded-full bg-clay-500 px-3 py-1.5 text-xs font-medium text-cream-50 shadow-warm transition hover:bg-clay-600"
          title={`重译选中的 ${selectionText.length} 个字`}
        >
          🔁 重译选区 · {selectionText.length} 字
        </button>
      )}

      {/* 翻译结果侧面板 */}
      {panelOpen && (
        <div className="fixed right-4 top-24 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-clay-500/20 bg-cream-50 shadow-warm">
          <header className="flex items-center justify-between gap-2 border-b border-clay-500/10 bg-cream-100/40 px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-clay-600/80">
                选区重译
              </p>
              <p className="font-mono text-[11px] text-ink-700/70">
                {paragraphRange
                  ? `原文第 ${paragraphRange.startPara + 1}${paragraphRange.endPara !== paragraphRange.startPara ? `-${paragraphRange.endPara + 1}` : ''} 段 · ${selectionText.length} 字`
                  : `${selectionText.length} 字`}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="grid h-7 w-7 place-items-center rounded-full text-ink-700/70 hover:bg-clay-500/10 hover:text-ink-900"
              aria-label="关闭"
            >
              ✕
            </button>
          </header>

          <div className="max-h-[60vh] overflow-y-auto p-4">
            {/* 原选区回显 */}
            <details className="mb-3 rounded-xl border border-clay-500/10 bg-cream-100/40 p-2">
              <summary className="cursor-pointer text-[11px] font-semibold text-ink-700/80">
                📌 原文选区
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-ink-800">
                {selectionText}
              </pre>
            </details>

            {/* 流式输出 */}
            <div
              className={`rounded-xl border p-3 ${
                stage === 'error'
                  ? 'border-red-300/60 bg-red-50/60'
                  : 'border-clay-500/15 bg-cream-50'
              }`}
            >
              <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-clay-700">
                <span>
                  {stage === 'running'
                    ? '⏳'
                    : stage === 'error'
                    ? '✗'
                    : sourceLang === 'en' ? '🇨🇳' : '🇬🇧'}
                </span>
                <span>
                  {stage === 'running'
                    ? `翻译中 · ${elapsed.toFixed(1)}s`
                    : stage === 'error'
                    ? '翻译失败'
                    : `新译文 · ${output.length} 字`}
                </span>
                <span className="ml-auto font-mono text-[10px] text-ink-700/55">
                  {config.model}
                </span>
              </div>

              {stage === 'error' ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-red-700">
                  {error}
                </pre>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink-900">
                  {output || ' '}
                  {stage === 'running' && (
                    <span className="ml-0.5 inline-block w-[2px] bg-clay-500 align-middle animate-blink">
                      &nbsp;
                    </span>
                  )}
                </pre>
              )}
            </div>

            {/* 段落对齐警告 */}
            {stage === 'done' && output && !paragraphRange && (
              <p className="mt-2 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-[11px] text-amber-800">
                ⚠ 段落定位失败（可能因为选区跨越非段落分隔），可复制后手动粘到对应位置。
              </p>
            )}
            {stage === 'done' && output && paragraphRange && !translatedFull && (
              <p className="mt-2 rounded-lg bg-sky-500/15 px-2.5 py-1.5 text-[11px] text-sky-800">
                ℹ 还没有整版译文，先点上方"翻译"按钮生成整版，再使用选区重译。
              </p>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-clay-500/10 bg-cream-100/40 px-4 py-3">
            {stage === 'running' ? (
              <button onClick={stop} className="btn-ghost text-sm">
                ⏹ 停止
              </button>
            ) : (
              <>
                {stage === 'done' && output && (
                  <button onClick={copy} className="btn-ghost text-sm">
                    📋 复制
                  </button>
                )}
                {stage === 'done' && output && (
                  <button onClick={run} className="btn-ghost text-sm">
                    ⟳ 再译一次
                  </button>
                )}
                {canReplace && (
                  <button onClick={replace} className="btn-primary text-sm">
                    替换到译文对应段
                  </button>
                )}
                <button onClick={close} className="btn-ghost text-sm">
                  关闭
                </button>
              </>
            )}
          </footer>
        </div>
      )}
    </>
  )
}

// ── 段落对齐工具 ─────────────────────────────────

const PARA_BREAK = /\n{2,}/

function splitParagraphs(text) {
  return (text || '').split(PARA_BREAK)
}

/**
 * 找选区文本在中文 body 里的段落区间（含端点，0-based）
 * 段落 index 在「剥掉前导 # 标题」后的 body 上计算，避免中英两边
 * 前导 # 标题数量不一致（如中文无标题、英文翻译时被加了一行 #）导致错位。
 */
function alignParagraphs(fullText, selection, title) {
  if (!fullText || !selection) return null
  const body = stripLeadingTitle(fullText, title)
  let idx = body.indexOf(selection)
  if (idx < 0) {
    // 容错：归一化空白再找
    const normFull = body.replace(/[ \t ]+/g, ' ')
    const normSel = selection.replace(/[ \t ]+/g, ' ').trim()
    idx = normFull.indexOf(normSel)
    if (idx < 0) return null
  }
  const before = body.slice(0, idx)
  const within = body.slice(idx, idx + selection.length)
  const startPara = countMatches(before, PARA_BREAK)
  const spanned = countMatches(within, PARA_BREAK)
  const endPara = startPara + spanned
  return { startPara, endPara }
}

function countMatches(text, re) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
  return (text.match(g) || []).length
}

/**
 * 把 fullEnglish 按段落切，替换 body 段落区间 [startPara, endPara] 为 replacement。
 * startPara/endPara 是 body 内的段落 index（不含前导 # 标题）。
 * 区间越界或 body 段数 < startPara 时返回 null。
 */
function spliceParagraphs(fullEnglish, startPara, endPara, replacement, title) {
  const body = stripLeadingTitle(fullEnglish, title)
  const head = fullEnglish.slice(0, fullEnglish.length - body.length)
  const paras = splitParagraphs(body)
  if (startPara < 0 || startPara >= paras.length) return null
  const clampedEnd = Math.min(endPara, paras.length - 1)
  const before = paras.slice(0, startPara)
  const after = paras.slice(clampedEnd + 1)
  const newBody = [...before, replacement, ...after].join('\n\n')
  return head + newBody
}
