import { useMemo, useState } from 'react'
import {
  appliedPlatforms,
  platforms,
  togglePlatform,
} from '../data/platforms.js'

/**
 * 平台约束 chips：每个 chip 点击会往 prompt 里追加/移除对应平台约束块。
 * 用 HTML 注释作 marker，Markdown 渲染时不可见，可被正则精确识别用于 toggle。
 *
 * Props:
 *   value      当前 prompt 文本
 *   onChange   (nextPrompt) => void
 *   className  容器额外 className
 */
export default function PlatformChips({ value, onChange, className = '' }) {
  const [previewId, setPreviewId] = useState(null)
  const active = useMemo(() => new Set(appliedPlatforms(value)), [value])

  const previewPlatform = previewId
    ? platforms.find((p) => p.id === previewId)
    : null

  const onToggle = (p) => {
    const next = togglePlatform(value, p)
    onChange?.(next)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-clay-600">
          🎯 一键加平台约束
        </p>
        <p className="text-[11px] text-ink-700/60">
          点击切换 · 再点取消 · hover 预览
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {platforms.map((p) => {
          const on = active.has(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p)}
              onMouseEnter={() => setPreviewId(p.id)}
              onMouseLeave={() => setPreviewId((cur) => (cur === p.id ? null : cur))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                on
                  ? p.accentActive + ' shadow-warm'
                  : p.accent + ' hover:shadow-soft'
              }`}
              title={on ? '已添加 · 点击移除' : '点击添加到提示词（Prompt）'}
            >
              <span className="text-sm">{p.icon}</span>
              <span>{p.name}</span>
              {on && <span className="ml-0.5 text-[10px]">✓</span>}
            </button>
          )
        })}
      </div>

      {previewPlatform && (
        <div className="mt-3 overflow-hidden rounded-xl border border-clay-500/15 bg-cream-50/80">
          <div className="flex items-center justify-between border-b border-clay-500/10 bg-cream-100/40 px-3 py-2 text-[11px]">
            <span className="font-semibold text-ink-800">
              {previewPlatform.icon} {previewPlatform.name} · 约束预览
            </span>
            <span className="text-ink-700/60">{previewPlatform.summary}</span>
          </div>
          <pre className="whitespace-pre-wrap break-words px-3 py-2 font-mono text-[11.5px] leading-relaxed text-ink-900">
            {previewPlatform.body}
          </pre>
        </div>
      )}
    </div>
  )
}
