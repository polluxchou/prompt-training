import { useMemo, useState } from 'react'
import { boardMenu, countByStatus, STATUS_META } from '../../data/board.js'

const STATUS_KEYS = ['done', 'partial', 'planned']

export default function AdminBoard() {
  const [activeId, setActiveId] = useState(boardMenu[0].id)
  const [statusFilter, setStatusFilter] = useState(new Set(STATUS_KEYS))

  const activeRoot = boardMenu.find((m) => m.id === activeId) || boardMenu[0]
  const counts = useMemo(() => countByStatus(), [])
  const total = counts.done + counts.partial + counts.planned

  const visibleSections = useMemo(() => {
    return (activeRoot.children || [])
      .map((child) => ({
        ...child,
        requirements: (child.requirements || []).filter((r) =>
          statusFilter.has(r.status),
        ),
      }))
      .filter((child) => child.requirements.length > 0)
  }, [activeRoot, statusFilter])

  const toggleStatus = (key) => {
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">内部 · 需求管理白板</p>
          <h1 className="section-title">网站菜单与需求目录</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-700/85">
            快速查看每个页面承载的需求与完成情况。未来仅 admin / group
            manager 可见，现阶段无权限。
          </p>
        </div>
        <StatusSummary counts={counts} total={total} />
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-700/60">
          过滤
        </span>
        {STATUS_KEYS.map((key) => {
          const meta = STATUS_META[key]
          const active = statusFilter.has(key)
          return (
            <button
              key={key}
              onClick={() => toggleStatus(key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? meta.pillActive
                  : 'border-clay-500/15 bg-cream-50 text-ink-700/50 hover:text-ink-700'
              }`}
            >
              <span>{meta.dot}</span>
              {meta.label}
              <span className="text-[10px] opacity-70">{counts[key]}</span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* 左侧菜单树 */}
        <aside className="rounded-3xl border border-clay-500/15 bg-cream-50/80 p-3 shadow-soft">
          <ul className="space-y-1">
            {boardMenu.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setActiveId(m.id)}
                  className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                    activeId === m.id
                      ? 'bg-clay-500 text-cream-50 shadow-warm'
                      : 'text-ink-800 hover:bg-clay-500/10'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="flex-1 font-semibold">{m.label}</span>
                  <span
                    className={`text-[10px] ${
                      activeId === m.id ? 'text-cream-50/80' : 'text-ink-700/50'
                    }`}
                  >
                    {(m.children || []).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* 右侧需求清单 */}
        <section className="space-y-4">
          <div className="rounded-3xl border border-clay-500/15 bg-cream-100/40 px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-ink-900">
                {activeRoot.icon} {activeRoot.label}
              </h2>
              <code className="font-mono text-xs text-ink-700/60">
                {activeRoot.path}
              </code>
            </div>
            {activeRoot.summary && (
              <p className="mt-1 text-sm text-ink-700/85">{activeRoot.summary}</p>
            )}
          </div>

          {visibleSections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}

          {visibleSections.every((s) => s.requirements.length === 0) && (
            <div className="rounded-3xl border border-dashed border-clay-500/25 bg-cream-100/30 px-6 py-12 text-center text-sm text-ink-700/70">
              当前过滤下没有需求条目
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SectionCard({ section }) {
  return (
    <div className="rounded-3xl border border-clay-500/15 bg-cream-50/80 p-5 shadow-soft">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-bold text-ink-900">
          {section.label}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-ink-700/60">
          {section.anchor && (
            <a
              href={`/${section.anchor}`}
              className="rounded-full bg-clay-500/10 px-2 py-0.5 font-mono text-clay-700 hover:bg-clay-500/20"
              title="跳到训练首页对应锚点"
            >
              {section.anchor}
            </a>
          )}
          {section.path && (
            <code className="font-mono">{section.path}</code>
          )}
        </div>
      </div>

      {section.requirements.length === 0 ? (
        <p className="text-xs text-ink-700/50">— 当前过滤下无条目 —</p>
      ) : (
        <ul className="space-y-1.5">
          {section.requirements.map((r) => (
            <RequirementRow key={r.id} req={r} />
          ))}
        </ul>
      )}
    </div>
  )
}

function RequirementRow({ req }) {
  const meta = STATUS_META[req.status]
  return (
    <li className="flex items-start gap-3 rounded-xl px-2.5 py-1.5 transition hover:bg-clay-500/5">
      <span
        className={`mt-0.5 inline-flex h-5 w-14 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tracking-wider ${meta.badge}`}
        title={meta.label}
      >
        <span className="mr-1">{meta.dot}</span>
        {meta.label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-800">{req.title}</p>
        {req.hint && (
          <p className="mt-0.5 text-xs text-ink-700/55">↳ {req.hint}</p>
        )}
      </div>
    </li>
  )
}

function StatusSummary({ counts, total }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-clay-500/15 bg-cream-50/80 px-4 py-2 text-xs font-medium text-ink-800 shadow-soft">
      <span className="text-ink-700/60">共 {total} 项</span>
      {STATUS_KEYS.map((key) => {
        const meta = STATUS_META[key]
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${meta.countPill}`}
          >
            <span>{meta.dot}</span>
            {counts[key]}
          </span>
        )
      })}
    </div>
  )
}
