import { useEffect, useMemo, useState } from 'react'
import { categories, scenarios } from '../data/anatomy.js'

export default function PromptAnatomy() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const scenario = scenarios.find((s) => s.id === scenarioId)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [hoveredKind, setHoveredKind] = useState(null)

  useEffect(() => {
    setSelectedIdx(0)
  }, [scenarioId])

  const selectedSeg = scenario.segments[selectedIdx]
  const cat = categories[selectedSeg.kind]

  // Build a sorted unique list of categories present in this scenario for the legend
  const presentKinds = useMemo(
    () => Array.from(new Set(scenario.segments.map((s) => s.kind))),
    [scenario],
  )

  return (
    <section
      id="anatomy"
      className="border-y border-clay-500/10 bg-gradient-to-b from-cream-100/40 via-cream-50 to-cream-100/30"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mb-8 max-w-2xl">
          <p className="section-eyebrow">结构</p>
          <h2 className="section-title">提示词（Prompt）爆炸图 · 看清每一块的作用</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-700">
            一个完整、可上手的<strong>提示词（Prompt）</strong>，通常由 <strong>7-8 个标准成分</strong> 组合而成。
            选一个真实工作场景，点击任意彩色块，看它在提示词里扮演什么角色——
            以及"换个写法"还可以怎么写。
          </p>
        </div>

        {/* 场景切换 */}
        <div className="mb-5 flex flex-wrap gap-2">
          {scenarios.map((s) => {
            const active = s.id === scenarioId
            return (
              <button
                key={s.id}
                onClick={() => setScenarioId(s.id)}
                className={`group inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition ${
                  active
                    ? 'border-clay-500 bg-clay-500 text-cream-50 shadow-warm'
                    : 'border-clay-500/20 bg-cream-50 text-ink-800 hover:border-clay-500/50 hover:bg-cream-100'
                }`}
              >
                <span className="text-base">{s.icon}</span>
                <div className="text-left">
                  <div className="text-sm font-semibold leading-tight">{s.role}</div>
                  <div
                    className={`text-[10px] uppercase tracking-wider ${
                      active ? 'text-cream-50/85' : 'text-ink-700/60'
                    }`}
                  >
                    {s.title}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 场景说明 */}
        <p className="mb-5 rounded-xl bg-cream-100/60 px-4 py-3 text-sm leading-relaxed text-ink-700">
          <span className="mr-2 text-base">{scenario.icon}</span>
          <strong className="text-ink-900">{scenario.title}：</strong>
          {scenario.description}
        </p>

        {/* 主舞台 */}
        <div className="card p-0 overflow-hidden">
          <div className="grid lg:grid-cols-[1.3fr_1fr]">
            {/* 左：爆炸图 */}
            <div className="border-b border-clay-500/10 p-6 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-clay-600">
                  📦 完整提示词 · 按成分着色
                </span>
                <span className="font-mono text-[11px] text-ink-700/60">
                  {scenario.segments.length} 块成分
                </span>
              </div>

              <div className="space-y-3">
                {scenario.segments.map((seg, i) => {
                  const c = categories[seg.kind]
                  const isSelected = i === selectedIdx
                  const isDimmed =
                    hoveredKind && hoveredKind !== seg.kind && !isSelected
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedIdx(i)}
                      className={`relative block w-full rounded-xl border-l-4 px-4 py-3 text-left transition-all ${
                        isSelected ? c.bgSelected : c.bg
                      } ${
                        isSelected ? c.borderSelected : c.border
                      } ${
                        isSelected ? `ring-2 ${c.ring} shadow-soft` : 'hover:shadow-soft'
                      } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${c.pill}`}
                        >
                          <span>{c.icon}</span>
                          {c.label}
                        </span>
                        <span className="font-mono text-[10px] text-ink-700/50">
                          #{String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-ink-900">
                        {seg.text}
                      </pre>
                    </button>
                  )
                })}
              </div>

              {/* 图例 */}
              <div className="mt-5 border-t border-clay-500/10 pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-700/70">
                  本场景出现的成分（hover 高亮 · 点击跳转第一块）
                </p>
                <div className="flex flex-wrap gap-2">
                  {presentKinds.map((kind) => {
                    const c = categories[kind]
                    const firstIdx = scenario.segments.findIndex(
                      (s) => s.kind === kind,
                    )
                    return (
                      <button
                        key={kind}
                        type="button"
                        onMouseEnter={() => setHoveredKind(kind)}
                        onMouseLeave={() => setHoveredKind(null)}
                        onClick={() => setSelectedIdx(firstIdx)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${c.pill} hover:ring-2 hover:${c.ring}`}
                      >
                        <span>{c.icon}</span>
                        {c.short}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 右：详情面板 */}
            <div className={`p-6 ${cat.bg}`}>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-2xl">{cat.icon}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${cat.pill}`}
                >
                  {cat.label}
                </span>
                <span className="ml-auto font-mono text-[11px] text-ink-700/60">
                  第 {selectedIdx + 1} / {scenario.segments.length} 块
                </span>
              </div>

              <h3
                className={`mb-4 font-display text-xl font-bold leading-tight ${cat.text}`}
              >
                这部分起什么作用？
              </h3>

              <p className="mb-6 text-[14px] leading-relaxed text-ink-800">
                {cat.whatItDoes}
              </p>

              {/* 原文回显 */}
              <div className="mb-6 rounded-xl border border-clay-500/10 bg-cream-50/80 p-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-700/60">
                  当前提示词（Prompt）里的这一块
                </p>
                <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-ink-900">
                  {selectedSeg.text}
                </pre>
              </div>

              {/* 类似写法 */}
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${cat.text}`}>
                🔁 同一类成分 · 还可以这样写
              </p>
              <ul className="space-y-2">
                {cat.similarExamples.map((ex, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-clay-500/10 bg-cream-50/80 p-3"
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-700/60">
                        写法 {i + 1}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-ink-900">
                      {ex}
                    </pre>
                  </li>
                ))}
              </ul>

              {/* 上下切换 */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() =>
                    setSelectedIdx((i) => Math.max(0, i - 1))
                  }
                  disabled={selectedIdx === 0}
                  className="btn-ghost text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← 上一块
                </button>
                <button
                  onClick={() =>
                    setSelectedIdx((i) =>
                      Math.min(scenario.segments.length - 1, i + 1),
                    )
                  }
                  disabled={selectedIdx === scenario.segments.length - 1}
                  className="btn-primary text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  下一块 →
                </button>
              </div>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="border-t border-clay-500/10 bg-cream-100/40 px-6 py-3 text-[11.5px] text-ink-700/80">
            💡 培训现场玩法：换一个场景 → 让学员盲选某个块猜它是什么成分 → 翻底牌验证；之后让大家比较"同一类成分"的 3 种写法，选自己以后会用的那种
          </div>
        </div>
      </div>
    </section>
  )
}
