import { useEffect, useState } from 'react'
import AiRunner from './AiRunner.jsx'
import AutoGrowTextarea from './AutoGrowTextarea.jsx'

export default function ModuleDrawer({ module, onClose }) {
  const open = Boolean(module)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300 ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
      />

      <div
        className={`relative flex h-full max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-cream-50 shadow-2xl transition-all duration-300 ease-out ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {module && (
          <>
            <div className="flex items-start justify-between border-b border-clay-500/10 bg-gradient-to-r from-cream-100/60 via-cream-50 to-cream-50 px-8 py-6">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-clay-400/25 to-ember-500/25 text-3xl shadow-soft">
                  {module.icon}
                </div>
                <div>
                  <p className="font-mono text-xs font-semibold tracking-widest text-clay-600/70">
                    模块 {module.number}
                  </p>
                  <h3 className="font-display text-3xl font-bold text-ink-900">
                    {module.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-clay-600">
                    {module.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-clay-500/10 hover:text-ink-900"
                aria-label="关闭"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-7">
              <div className="grid gap-7 lg:grid-cols-[1fr_2fr] lg:gap-10">
                <div className="space-y-7">
                  <section>
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-clay-600">
                      概述
                    </h4>
                    <p className="text-base leading-relaxed text-ink-800">
                      {module.summary}
                    </p>
                  </section>

                  <section>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-clay-600">
                      核心要点
                    </h4>
                    <ul className="space-y-2.5">
                      {module.keyPoints.map((p, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-1 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-clay-500/15 font-mono text-[11px] font-bold text-clay-700">
                            {i + 1}
                          </span>
                          <span className="text-sm leading-relaxed text-ink-800">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <section>
                  <h4 className="mb-1 text-sm font-semibold uppercase tracking-wider text-clay-600">
                    对比示例 · 现场跑给你看
                  </h4>
                  <p className="mb-4 text-xs text-ink-700/70">
                    文本可直接修改，点 ▶ 跑改后的版本——同屏对比两种提示词的真实输出
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ExampleBox
                      key={`${module.id}-bad`}
                      variant="bad"
                      label="不好的提示词"
                      original={module.example.bad}
                      cacheKey={`module:${module.id}:bad`}
                    />
                    <ExampleBox
                      key={`${module.id}-good`}
                      variant="good"
                      label="好的提示词"
                      original={module.example.good}
                      cacheKey={`module:${module.id}:good`}
                    />
                  </div>
                </section>
              </div>
            </div>

            <div className="border-t border-clay-500/10 bg-cream-100/60 px-8 py-3 text-xs text-ink-700/80">
              按 <kbd className="rounded border border-clay-500/30 bg-cream-50 px-1.5 py-0.5 font-mono">Esc</kbd> 关闭 · 点击空白处关闭
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ExampleBox({ variant, label, original, cacheKey }) {
  const isBad = variant === 'bad'
  const [text, setText] = useState(original)
  const [copied, setCopied] = useState(false)
  const edited = text !== original

  useEffect(() => {
    setText(original)
    setCopied(false)
  }, [original])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isBad
          ? 'border-red-200/70 bg-red-50/50'
          : 'border-clay-500/20 bg-gradient-to-br from-cream-100 to-cream-200/50'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            isBad ? 'text-red-700' : 'text-clay-700'
          }`}
        >
          <span>{isBad ? '✗' : '✓'}</span>
          {label}
          {edited && (
            <span className="ml-1 rounded-full bg-clay-500/15 px-1.5 py-0.5 text-[10px] font-medium text-clay-700">
              已修改
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {edited && (
            <button
              onClick={() => setText(original)}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-700/80 transition hover:bg-cream-50 hover:text-ink-900"
              title="恢复成课件原版"
            >
              ↩ 还原
            </button>
          )}
          <button
            onClick={copy}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:bg-cream-50"
          >
            {copied ? '✓ 已复制' : '复制'}
          </button>
        </div>
      </div>
      <AutoGrowTextarea
        value={text}
        onChange={setText}
        spellCheck={false}
        collapsedPx={140}
        fadeFrom={isBad ? 'from-red-50' : 'from-cream-100'}
        buttonTone={isBad ? 'red' : 'clay'}
        className="block w-full rounded-xl border border-transparent bg-transparent p-2 font-mono text-sm leading-relaxed text-ink-900 outline-none transition focus:border-clay-500/40 focus:bg-cream-50/60"
      />
      <div className="mt-3 border-t border-current/10 pt-3">
        <AiRunner
          prompt={text}
          cacheKey={cacheKey}
          label={isBad ? '▶ 跑「不好的」看效果' : '▶ 跑「好的」看效果'}
          compact
        />
      </div>
    </div>
  )
}
