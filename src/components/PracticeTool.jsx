import { useState } from 'react'
import { exercises } from '../data/exercises.js'
import AiRunner from './AiRunner.jsx'
import AutoGrowTextarea from './AutoGrowTextarea.jsx'

export default function PracticeTool() {
  const [exerciseId, setExerciseId] = useState(exercises[0].id)
  const exercise = exercises.find((e) => e.id === exerciseId)
  const [step, setStep] = useState(0)
  const [copied, setCopied] = useState(false)
  const [edits, setEdits] = useState({}) // { [key]: string }

  const switchExercise = (id) => {
    setExerciseId(id)
    setStep(0)
  }

  const currentStep = exercise.steps[step]
  const isFinal = step === exercise.steps.length - 1

  const badKey = `${exerciseId}-bad`
  const stepKey = `${exerciseId}-step-${step}`
  const badText = edits[badKey] ?? exercise.bad
  const stepText = edits[stepKey] ?? currentStep.prompt
  const badEdited = badKey in edits && edits[badKey] !== exercise.bad
  const stepEdited = stepKey in edits && edits[stepKey] !== currentStep.prompt

  const setEdit = (key, value) => setEdits((prev) => ({ ...prev, [key]: value }))
  const resetEdit = (key) =>
    setEdits((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })

  const copyCurrent = async () => {
    try {
      await navigator.clipboard.writeText(stepText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <section id="practice" className="bg-gradient-to-b from-transparent via-cream-100/40 to-transparent py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <p className="section-eyebrow">互动练习</p>
          <h2 className="section-title">把"一句话"调成"一份交底"</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-700">
            选一个场景，一步步看模糊提示词如何被加工——
            每一步都可以直接修改文本，体会"每加一个约束，输出就稳一分"。
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {exercises.map((e) => (
            <button
              key={e.id}
              onClick={() => switchExercise(e.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                e.id === exerciseId
                  ? 'bg-clay-500 text-cream-50 shadow-warm'
                  : 'bg-cream-50 text-ink-700 border border-clay-500/20 hover:border-clay-500/50'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-clay-500/10 bg-red-50/40 p-6 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-700">
                  <span>✗</span> 起点 · 模糊提示词
                  {badEdited && (
                    <span className="rounded-full bg-red-200/60 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                      已修改
                    </span>
                  )}
                </div>
                {badEdited && (
                  <button
                    onClick={() => resetEdit(badKey)}
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-red-700/80 transition hover:bg-red-100"
                  >
                    ↩ 还原
                  </button>
                )}
              </div>
              <AutoGrowTextarea
                value={badText}
                onChange={(v) => setEdit(badKey, v)}
                spellCheck={false}
                collapsedPx={140}
                fadeFrom="from-red-50"
                buttonTone="red"
                className="block w-full rounded-xl border border-transparent bg-transparent p-2 font-mono text-sm leading-relaxed text-ink-900 outline-none transition focus:border-red-300/60 focus:bg-red-50"
              />
              <div className="mt-3 border-t border-red-200/40 pt-3">
                <AiRunner
                  key={`${exerciseId}-bad-runner`}
                  prompt={badText}
                  cacheKey={`practice:${exerciseId}:bad`}
                  label="▶ 跑起点版本看效果"
                  compact
                />
              </div>
            </div>

            <div className="p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-clay-700">
                  <span>{isFinal ? '✓' : '→'}</span>
                  {currentStep.title}
                  {stepEdited && (
                    <span className="rounded-full bg-clay-500/15 px-1.5 py-0.5 text-[10px] font-medium text-clay-700">
                      已修改
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {stepEdited && (
                    <button
                      onClick={() => resetEdit(stepKey)}
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-clay-700/80 transition hover:bg-clay-500/10"
                    >
                      ↩ 还原
                    </button>
                  )}
                  <button
                    onClick={copyCurrent}
                    className="rounded-full px-3 py-1 text-xs font-medium text-clay-700 transition hover:bg-clay-500/10"
                  >
                    {copied ? '✓ 已复制' : '复制此版本'}
                  </button>
                </div>
              </div>
              <AutoGrowTextarea
                value={stepText}
                onChange={(v) => setEdit(stepKey, v)}
                spellCheck={false}
                collapsedPx={160}
                fadeFrom="from-cream-50"
                buttonTone="clay"
                className="block w-full rounded-xl border border-transparent bg-transparent p-2 font-mono text-sm leading-relaxed text-ink-900 outline-none transition focus:border-clay-500/40 focus:bg-cream-50/60"
              />
              <p className="mt-4 rounded-xl bg-cream-100/60 px-3 py-2 text-xs leading-relaxed text-ink-700">
                💡 {currentStep.note}
              </p>

              <div className="mt-4 border-t border-clay-500/10 pt-4">
                <AiRunner
                  key={stepKey}
                  prompt={stepText}
                  cacheKey={`practice:${stepKey}`}
                  label="▶ 用 AI 跑这一版"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-clay-500/10 bg-cream-100/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {exercise.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`第 ${i + 1} 步`}
                  className={`h-2 rounded-full transition-all ${
                    i === step
                      ? 'w-10 bg-clay-500'
                      : i < step
                      ? 'w-2 bg-clay-500/60'
                      : 'w-2 bg-clay-500/20'
                  }`}
                />
              ))}
              <span className="ml-2 font-mono text-xs text-ink-700/70">
                {step + 1} / {exercise.steps.length}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="btn-ghost text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← 上一步
              </button>
              <button
                onClick={() =>
                  setStep((s) => Math.min(exercise.steps.length - 1, s + 1))
                }
                disabled={isFinal}
                className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isFinal ? '已是最终版' : '下一步 →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
