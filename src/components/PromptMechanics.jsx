import { useEffect, useRef, useState } from 'react'
import { mechanicsScenes, lineKindStyles } from '../data/mechanics.js'

const SCENE_DURATION = 5200 // ms

export default function PromptMechanics() {
  const [sceneIdx, setSceneIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!playing) return
    timerRef.current = setTimeout(() => {
      setSceneIdx((i) => (i + 1) % mechanicsScenes.length)
    }, SCENE_DURATION)
    return () => clearTimeout(timerRef.current)
  }, [sceneIdx, playing])

  const scene = mechanicsScenes[sceneIdx]
  const isFinal = sceneIdx === mechanicsScenes.length - 1

  return (
    <section
      id="mechanics"
      className="border-y border-clay-500/10 bg-gradient-to-b from-cream-100/60 via-cream-50 to-cream-100/30"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="section-eyebrow">工作原理</p>
          <h2 className="section-title">模型只能看到你写下来的</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-700">
            30 秒动画看清：每加一条约束，<strong>"可能性空间"</strong> 就缩一圈，
            输出就稳一分。这就是为什么"工作交底式"提示词比"一句话"靠谱得多。
          </p>
        </div>

        {/* 主舞台 */}
        <div className="card p-0 overflow-hidden">
          {/* 进度条 */}
          <div className="flex items-center gap-1 border-b border-clay-500/10 bg-cream-100/50 px-6 py-3">
            {mechanicsScenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  setSceneIdx(i)
                  setPlaying(false)
                }}
                className="group flex flex-1 items-center gap-2"
                aria-label={`第 ${i + 1} 步：${s.label}`}
              >
                <div
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i === sceneIdx
                      ? 'bg-clay-500'
                      : i < sceneIdx
                      ? 'bg-clay-500/60'
                      : 'bg-clay-500/15 group-hover:bg-clay-500/30'
                  }`}
                />
                <span
                  className={`whitespace-nowrap font-mono text-[11px] font-medium transition ${
                    i === sceneIdx ? 'text-clay-700' : 'text-ink-700/50'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            ))}
            <div className="ml-3 flex items-center gap-1.5">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="grid h-7 w-7 place-items-center rounded-full text-ink-700 transition hover:bg-clay-500/15 hover:text-ink-900"
                aria-label={playing ? '暂停' : '播放'}
              >
                {playing ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 5v14l12-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  setSceneIdx(0)
                  setPlaying(true)
                }}
                className="grid h-7 w-7 place-items-center rounded-full text-ink-700 transition hover:bg-clay-500/15 hover:text-ink-900"
                aria-label="从头开始"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>
          </div>

          {/* 三栏舞台 */}
          <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.8fr_1.1fr] md:gap-4">
            {/* 左：你的输入 */}
            <div className="rounded-2xl border border-clay-500/15 bg-cream-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-clay-600">
                  📝 你写给模型的
                </span>
                <span className="font-mono text-[11px] text-ink-700/60">
                  {scene.inputLines.length} 行
                </span>
              </div>
              <div className="space-y-1.5">
                {scene.inputLines.map((line, i) => {
                  const isNew = i === scene.inputLines.length - 1
                  const style = lineKindStyles[line.kind]
                  return (
                    <div
                      key={`${sceneIdx}-${i}`}
                      className={`flex items-start gap-2 rounded-lg px-2 py-1.5 transition-all ${
                        isNew
                          ? 'bg-clay-500/10 animate-fade-in-up'
                          : 'bg-transparent'
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${style.dot}`}
                        title={style.label}
                      />
                      <pre className="flex-1 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-ink-900">
                        {line.text}
                      </pre>
                    </div>
                  )
                })}
              </div>
              <Legend />
            </div>

            {/* 中：模型 + 收敛指示 */}
            <div className="relative flex flex-col items-center justify-center rounded-2xl border border-clay-500/15 bg-gradient-to-b from-ink-900/95 to-ink-800/95 p-6 text-cream-100">
              {/* 流入粒子（向右）*/}
              <div className="pointer-events-none absolute -left-3 top-1/2 hidden h-1 w-8 -translate-y-1/2 md:block">
                <div className="absolute inset-0 animate-pulse rounded-full bg-clay-400/60" />
              </div>

              <div className="text-4xl">🧠</div>
              <p className="mt-2 font-display text-base font-bold">DeepSeek</p>
              <p className="mb-4 text-[11px] uppercase tracking-widest text-cream-100/60">
                可能性空间
              </p>

              {/* 收敛进度环 */}
              <ConvergenceRing percent={scene.convergence} />

              <p className="mt-3 font-mono text-xs text-cream-100/80">
                确定度 {scene.convergence}%
              </p>

              {/* 流出粒子（向右） */}
              <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-1 w-8 -translate-y-1/2 md:block">
                <div
                  className="absolute inset-0 animate-pulse rounded-full"
                  style={{ background: `rgba(217, 119, 87, ${0.3 + scene.convergence / 200})` }}
                />
              </div>
            </div>

            {/* 右：候选输出云 */}
            <div className="rounded-2xl border border-clay-500/15 bg-cream-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-clay-600">
                  💭 模型可能输出
                </span>
                <span className="font-mono text-[11px] text-ink-700/60">
                  {scene.samples.length} 候选
                </span>
              </div>
              <div className="space-y-2">
                {scene.samples.map((s, i) => (
                  <div
                    key={`${sceneIdx}-${i}`}
                    className={`rounded-xl border p-2.5 text-[12px] leading-relaxed transition-all animate-fade-in-up ${
                      isFinal
                        ? 'border-emerald-300/60 bg-emerald-50/60 text-ink-900'
                        : scene.samples.length <= 2
                        ? 'border-clay-500/30 bg-cream-100 text-ink-800'
                        : 'border-clay-500/15 bg-cream-100/60 text-ink-700/85'
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          isFinal ? 'bg-emerald-500' : 'bg-clay-500/60'
                        }`}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-700/60">
                        {s.tag}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap break-words font-mono text-[12px]">
                      {s.text}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 注释 */}
          <div className="border-t border-clay-500/10 bg-cream-100/40 px-6 py-4">
            <div className="flex items-start gap-3">
              <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-clay-500/15 font-mono text-xs font-bold text-clay-700">
                {sceneIdx + 1}
              </span>
              <p className="text-sm leading-relaxed text-ink-800">{scene.note}</p>
            </div>
          </div>
        </div>

        {/* 结论 */}
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-clay-500/15 bg-cream-100/40 px-6 py-5 text-center">
          <p className="font-display text-lg leading-relaxed text-ink-900">
            提示词不是「请求」，是给模型的<strong className="text-clay-700">工作交底</strong>。
          </p>
          <p className="mt-1.5 text-sm text-ink-700">
            每加一个约束，可能性空间就少一圈，输出就稳一分。
          </p>
        </div>
      </div>
    </section>
  )
}

function ConvergenceRing({ percent }) {
  const size = 110
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - percent / 100)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255, 252, 247, 0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F2994A" />
            <stop offset="100%" stopColor="#D97757" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-2xl font-bold">{percent}</span>
        <span className="absolute bottom-3 text-[10px] uppercase tracking-widest text-cream-100/60">
          %
        </span>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-clay-500/10 pt-3">
      {Object.entries(lineKindStyles).map(([key, { dot, label }]) => (
        <div key={key} className="flex items-center gap-1.5 text-[11px] text-ink-700/70">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}
