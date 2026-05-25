import { useEffect, useState } from 'react'

const pairs = [
  {
    bad: '帮我写个展会预热推文',
    good:
      '为第 16 届上海紧固件专业展（2026/6/24-26）写一篇公众号预热推文，标题含具体数字，分「看点/为什么今年不同/如何参与」三段，禁用"重磅、共襄盛举"。',
  },
  {
    bad: '整理一下展商座谈会记录',
    good:
      '把记录整理为：5 条核心决议 + 待办（任务/负责人/截止）+ 未决诉求（标注提出公司），原文未明确的写「未明确」不要编造。',
  },
  {
    bad: 'Help me write an invitation email',
    good:
      '以海外招商经理身份写英文招展邮件：主题≤60字符含具体数字，正文≤180词三段（钩子/价值/单一CTA），动笔前先复述对象画像和邮件目标。',
  },
]

function useTypewriter(text, speed = 35) {
  const [out, setOut] = useState('')
  useEffect(() => {
    setOut('')
    let i = 0
    const id = setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return out
}

export default function Hero() {
  const [idx, setIdx] = useState(0)
  const current = pairs[idx]
  const badText = useTypewriter(current.bad, 50)
  const goodText = useTypewriter(current.good, 25)

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % pairs.length), 5200)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:py-20 md:grid-cols-2 md:py-28">
        <div className="animate-fade-in-up">
          <p className="section-eyebrow">华人螺丝网 · AI 提示词（Prompt）实战训练</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink-900 sm:text-5xl md:text-6xl">
            把模型当
            <span className="bg-gradient-to-r from-clay-500 to-ember-500 bg-clip-text text-transparent">
              {' '}
              聪明的实习生{' '}
            </span>
            来用
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700">
            为新媒体运营 & 展会营销团队定制的 12 模块训练课 ——
            从一句"帮我写个展会推文"，到一份让模型稳定产出的工作交底。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#modules" className="btn-primary">
              浏览课程模块
            </a>
            <a href="#practice" className="btn-ghost">
              直接动手练 →
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-ink-700">
            <Stat n="12" label="核心模块" />
            <Divider />
            <Stat n="8+" label="可复制模板" />
            <Divider />
            <Stat n="3" label="互动练习案例" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-clay-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-ember-500/15 blur-3xl" />
          <div className="relative card p-0">
            <div className="border-b border-clay-500/10 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-clay-600">
                好 vs. 不好 · 实时对比
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-red-200/60 bg-red-50/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-red-700">
                  <span>✗</span>
                  <span>模糊提示词</span>
                </div>
                <p className="font-mono text-sm leading-relaxed text-ink-800">
                  {badText}
                  <span className="ml-0.5 inline-block w-[2px] bg-red-400 align-middle animate-blink">
                    &nbsp;
                  </span>
                </p>
              </div>

              <div className="flex justify-center text-2xl text-clay-500">↓</div>

              <div className="rounded-2xl border border-clay-500/20 bg-gradient-to-br from-cream-100 to-cream-200/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-clay-700">
                  <span>✓</span>
                  <span>清晰交底</span>
                </div>
                <p className="font-mono text-sm leading-relaxed text-ink-900">
                  {goodText}
                  <span className="ml-0.5 inline-block w-[2px] bg-clay-500 align-middle animate-blink">
                    &nbsp;
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-2">
                {pairs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`切换示例 ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === idx ? 'w-8 bg-clay-500' : 'w-2 bg-clay-500/25'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold text-ink-900">{n}</div>
      <div className="text-xs uppercase tracking-wider text-ink-700/70">{label}</div>
    </div>
  )
}

function Divider() {
  return <span className="h-8 w-px bg-clay-500/20" />
}
