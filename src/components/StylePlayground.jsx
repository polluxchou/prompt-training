import { useState } from 'react'
import { styles, defaultTopic } from '../data/styles.js'
import AiRunner from './AiRunner.jsx'
import AutoGrowTextarea from './AutoGrowTextarea.jsx'

export default function StylePlayground() {
  const [topic, setTopic] = useState(defaultTopic)
  const [activeId, setActiveId] = useState(styles[0].id)
  const topicEdited = topic !== defaultTopic
  const active = styles.find((s) => s.id === activeId)

  const fullPrompt = `主题：${topic.trim()}\n\n${active.promptLine}`

  return (
    <section
      id="styles"
      className="border-y border-clay-500/10 bg-gradient-to-b from-cream-100/30 via-cream-50 to-cream-100/30"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="section-eyebrow">速成</p>
          <h2 className="section-title">风格借力 · 一句话借走十年功力</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-700">
            模型在训练时已经"读过"亿万字的 36氪 / 小红书 / 经济学人——
            与其自己粘 few-shot，不如<strong>直接点名风格</strong>。
            下方换一个标签，看同一个主题瞬间换皮。
          </p>
        </div>

        {/* 主题输入 */}
        <div className="card mb-6 p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-clay-600">
              📌 主题（可修改成你自己的）
            </span>
            {topicEdited && (
              <button
                onClick={() => setTopic(defaultTopic)}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-700/80 transition hover:bg-cream-100 hover:text-ink-900"
              >
                ↩ 还原默认
              </button>
            )}
          </div>
          <AutoGrowTextarea
            value={topic}
            onChange={setTopic}
            spellCheck={false}
            collapsedPx={120}
            fadeFrom="from-cream-50"
            buttonTone="clay"
            className="block w-full rounded-xl border border-transparent bg-transparent p-2 font-mono text-sm leading-relaxed text-ink-900 outline-none transition focus:border-clay-500/40 focus:bg-cream-50/60"
          />
        </div>

        {/* 风格切换器 */}
        <div className="mb-5 flex flex-wrap gap-2">
          {styles.map((s) => {
            const isActive = s.id === activeId
            return (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`group inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition ${
                  isActive
                    ? 'border-clay-500 bg-clay-500 text-cream-50 shadow-warm'
                    : 'border-clay-500/20 bg-cream-50 text-ink-800 hover:border-clay-500/50 hover:bg-cream-100'
                }`}
              >
                <span className="text-base">{s.icon}</span>
                <div className="text-left">
                  <div className="text-sm font-semibold leading-tight">{s.name}</div>
                  <div
                    className={`text-[10px] uppercase tracking-wider ${
                      isActive ? 'text-cream-50/80' : 'text-ink-700/60'
                    }`}
                  >
                    {s.badge}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 双栏：提示词 + 样本 */}
        <div
          key={activeId}
          className={`card relative overflow-hidden p-0 animate-fade-in-up`}
        >
          {/* 风格主题色装饰条 */}
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${active.accent.replace('via-', 'via-').replace('to-transparent', 'to-clay-500/40')}`} />

          <div className="grid lg:grid-cols-[1fr_1.3fr]">
            {/* 左：完整提示词 */}
            <div className="border-b border-clay-500/10 p-6 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-clay-600">
                  📝 完整提示词
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${active.pillBg}`}>
                  {active.icon} {active.name}
                </span>
              </div>

              <pre className="whitespace-pre-wrap break-words rounded-2xl bg-ink-900/95 p-4 font-mono text-[12.5px] leading-relaxed text-cream-100">
                {fullPrompt}
              </pre>

              <p className="mt-3 text-[11px] text-ink-700/60">
                注意：核心是<strong className="text-ink-800">"用 XX 风格"</strong>这一句——
                模型已经熟悉这些公开风格，**不需要**你再粘示例
              </p>

              <div className="mt-4 border-t border-clay-500/10 pt-4">
                <AiRunner
                  key={activeId}
                  prompt={fullPrompt}
                  cacheKey={`style:${activeId}`}
                  label="▶ 用 AI 真实跑当前风格"
                />
              </div>
            </div>

            {/* 右：样本输出 */}
            <div className={`bg-gradient-to-br ${active.accent} p-6`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-clay-600">
                  ✨ 该风格典型样本
                </span>
                <span className="font-mono text-[10px] text-ink-700/60">
                  课件预生成 · 真实运行见左栏 ▶
                </span>
              </div>

              <article className="rounded-2xl border border-clay-500/15 bg-cream-50/85 p-5 backdrop-blur">
                {active.sampleTitle && (
                  <h4 className={`mb-3 font-display text-lg font-bold ${active.accentText}`}>
                    {active.sampleTitle}
                  </h4>
                )}
                <pre className="whitespace-pre-wrap break-words font-sans text-[13.5px] leading-[1.7] text-ink-900">
                  {active.sampleBody}
                </pre>
              </article>

              {/* 风格 DNA */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-clay-600">
                  🧬 风格 DNA · 它为什么是这种感觉
                </p>
                <ul className="space-y-1.5">
                  {active.dna.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-800"
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${active.pillBg.split(' ')[0]}`}
                      />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="border-t border-clay-500/10 bg-cream-100/40 px-6 py-3 text-[11.5px] text-ink-700/80">
            💡 培训现场玩法：换一个主题 → 4 个风格各跑一遍 →
            让学员选出"哪个最适合发到我们公众号"，再讨论为什么
          </div>
        </div>
      </div>
    </section>
  )
}
