import { useEffect, useState } from 'react'
import { templates } from '../data/templates.js'
import AiRunner from './AiRunner.jsx'
import AutoGrowTextarea from './AutoGrowTextarea.jsx'

export default function TemplateLibrary() {
  return (
    <section id="templates" className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="mb-10 max-w-2xl">
        <p className="section-eyebrow">即取即用</p>
        <h2 className="section-title">提示词模板库</h2>
        <p className="mt-3 text-base leading-relaxed text-ink-700">
          可直接修改：把 <code className="rounded bg-cream-200 px-1.5 py-0.5 font-mono text-sm">{'{{占位符}}'}</code> 换成你的内容，
          再点 ▶ 跑当前版本 / 复制带走。
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>
    </section>
  )
}

function TemplateCard({ template }) {
  const [text, setText] = useState(template.body)
  const [copied, setCopied] = useState(false)
  const edited = text !== template.body

  useEffect(() => {
    setText(template.body)
  }, [template.body])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const reset = () => setText(template.body)

  return (
    <article className="card flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-ink-900">{template.title}</h3>
        <div className="flex items-center gap-2">
          {edited && (
            <span className="rounded-full bg-clay-500/15 px-2 py-0.5 text-[10px] font-medium text-clay-700">
              已修改
            </span>
          )}
          <span className="chip">{template.tag}</span>
        </div>
      </div>

      <div className="relative flex-1">
        <AutoGrowTextarea
          value={text}
          onChange={setText}
          spellCheck={false}
          collapsedPx={220}
          fadeFrom="from-ink-900"
          buttonTone="cream"
          className="block w-full overflow-x-auto scrollbar-thin whitespace-pre-wrap break-words rounded-2xl border border-transparent bg-ink-900/95 p-4 font-mono text-[13px] leading-relaxed text-cream-100 outline-none transition focus:border-clay-500/40 focus:bg-ink-900 caret-cream-100"
        />
        {edited && (
          <button
            onClick={reset}
            className="absolute right-3 top-3 rounded-full bg-cream-50/15 px-2.5 py-1 text-[11px] font-medium text-cream-100/80 backdrop-blur transition hover:bg-cream-50/25 hover:text-cream-50"
            title="恢复成课件原版"
          >
            ↩ 还原
          </button>
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={copy}
          className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-clay-500/30 px-4 py-2 text-sm font-medium text-ink-800 transition hover:border-clay-500/60 hover:bg-clay-500/10"
        >
          {copied ? (
            <>✓ 已复制到剪贴板</>
          ) : (
            <>
              <CopyIcon /> 复制{edited ? '修改后' : ''}模板
            </>
          )}
        </button>
        <AiRunner
          prompt={text}
          cacheKey={`template:${template.id}`}
          label="▶ 用 AI 跑当前版本"
          compact
        />
      </div>
    </article>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
