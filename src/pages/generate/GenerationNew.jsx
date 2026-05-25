import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AutoGrowTextarea from '../../components/AutoGrowTextarea.jsx'
import PromptScoreCard from '../../components/PromptScoreCard.jsx'
import TaskTypePicker from './_TaskTypePicker.jsx'
import { streamChat } from '../../lib/api.js'
import { createGeneration } from '../../lib/generationsStore.js'
import { scorePrompt } from '../../lib/scorePrompt.js'
import { summarizeTaskType } from '../../data/taskTypes.js'
import { useConfig } from '../../lib/useConfig.js'
import {
  addUsage,
  buildCalibrationMessages,
  buildGenerationMessages,
} from '../../lib/promptPipeline.js'

const MODEL_OPTIONS = [
  { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash · 快' },
  { value: 'deepseek-v4-pro',   label: 'DeepSeek V4 Pro · 长文' },
]

export default function GenerationNew() {
  const navigate = useNavigate()
  const { config } = useConfig()

  const [taskType, setTaskType] = useState({
    scenario: '',
    platform: 'wechat-article',
    role: 'buyer',
    region: 'cn',
    gender: '',
  })
  const [industryRaw, setIndustryRaw] = useState('紧固件, 制造业')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(config.model || 'deepseek-v4-flash')
  const [taskTypeOpen, setTaskTypeOpen] = useState(true)

  // stage: idle | calibrating | generating | done | error
  const [stage, setStage] = useState('idle')
  const [calibrated, setCalibrated] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [usage, setUsage] = useState(null)
  const abortRef = useRef(null)
  const startedRef = useRef(0)
  const timerRef = useRef(null)

  const isRunning = stage === 'calibrating' || stage === 'generating'

  const industryKeywords = useMemo(
    () => industryRaw.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean),
    [industryRaw],
  )

  const generate = async () => {
    if (isRunning || !prompt.trim()) return
    setCalibrated('')
    setOutput('')
    setError('')
    setUsage(null)
    setElapsed(0)
    startedRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedRef.current) / 100) / 10)
    }, 100)
    abortRef.current = new AbortController()

    // ── Stage 1 · 校准 ───────────────────────────
    setStage('calibrating')
    let calibratedAcc = ''
    let calibrationUsage = null
    try {
      const r1 = await streamChat({
        model,
        temperature: 0.3, // 校准要稳，温度调低
        max_tokens: config.max_tokens,
        messages: buildCalibrationMessages({
          rawPrompt: prompt,
          taskType,
          industryKeywords,
        }),
        onDelta: (t) => {
          calibratedAcc += t
          setCalibrated((prev) => prev + t)
        },
        signal: abortRef.current.signal,
      })
      calibrationUsage = r1.usage
    } catch (err) {
      clearInterval(timerRef.current)
      if (err.name === 'AbortError') {
        setStage('idle')
        return
      }
      setError(`校准失败：${err.message}`)
      setStage('error')
      return
    }

    const calibratedPrompt = calibratedAcc.trim() || prompt
    // 校准空了就降级用原 prompt，不阻断流程

    // ── Stage 2 · 生成 ───────────────────────────
    setStage('generating')
    let contentAcc = ''
    let generationUsage = null
    try {
      const r2 = await streamChat({
        model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        messages: buildGenerationMessages({
          calibratedPrompt,
          taskType,
          industryKeywords,
          baseSystemPrompt: config.systemPrompt,
        }),
        onDelta: (t) => {
          contentAcc += t
          setOutput((prev) => prev + t)
        },
        signal: abortRef.current.signal,
      })
      generationUsage = r2.usage
      setStage('done')
    } catch (err) {
      clearInterval(timerRef.current)
      if (err.name === 'AbortError') {
        setStage('done') // 已有部分内容，按完成保存
      } else {
        setError(`生成失败：${err.message}`)
        setStage('error')
        return
      }
    } finally {
      clearInterval(timerRef.current)
    }

    const totalUsage = addUsage(calibrationUsage, generationUsage)
    setUsage(totalUsage)

    if (contentAcc.trim()) {
      const score = scorePrompt({ prompt, taskType, industryKeywords })
      const gen = createGeneration({
        prompt,
        calibratedPrompt,
        content: contentAcc,
        model,
        tokenUsage: totalUsage,
        calibrationUsage,
        taskType,
        industryKeywords,
        score,
      })
      setTimeout(() => navigate(`/generate/${gen.id}`), 600)
    }
  }

  const stop = () => abortRef.current?.abort()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 pb-32 sm:py-16 sm:pb-36">
      <header className="mb-6">
        <Link to="/generate" className="text-xs text-ink-700/60 hover:text-ink-900">
          ← 返回历史列表
        </Link>
        <h1 className="section-title mt-1">新建生成</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 左：表单 */}
        <div className="space-y-6">
          <CollapsibleCard
            title="任务类型"
            hint={'平台 + 受众，决定文风和评分的"类型匹配度"项'}
            summary={summarizeTaskType(taskType)}
            open={taskTypeOpen}
            onToggle={() => setTaskTypeOpen((o) => !o)}
          >
            <TaskTypePicker value={taskType} onChange={setTaskType} />
          </CollapsibleCard>

          <Card title="行业标签" hint={'逗号或空格分隔；用于"行业相关性"评分'}>
            <input
              type="text"
              value={industryRaw}
              onChange={(e) => setIndustryRaw(e.target.value)}
              placeholder="例如：紧固件, 制造业, 出海"
              className="w-full rounded-xl border border-clay-500/25 bg-cream-50 px-3 py-2.5 text-sm outline-none transition focus:border-clay-500/60"
            />
            {industryKeywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {industryKeywords.map((k) => (
                  <span key={k} className="chip">{k}</span>
                ))}
              </div>
            )}
          </Card>

          <Card title="提示词（Prompt）" hint="包含 角色 · 任务 · 上下文 · 输出格式 · 约束 · 示例 评分会更高">
            <AutoGrowTextarea
              value={prompt}
              onChange={setPrompt}
              collapsedPx={240}
              fadeFrom="from-cream-50"
              buttonTone="clay"
              placeholder="例如：你是一位 8 年经验的紧固件行业资深小编，请为微信公众号写一篇 800 字内的展会预热推文..."
              spellCheck={false}
              className="block w-full rounded-xl border border-clay-500/25 bg-cream-50 p-3 font-mono text-sm leading-relaxed text-ink-900 outline-none transition focus:border-clay-500/60"
            />
          </Card>

          {error && (
            <div className="rounded-3xl border border-red-300/60 bg-red-50/50 p-5">
              <p className="text-xs font-semibold text-red-700">✗ {error}</p>
            </div>
          )}

          {(calibrated || stage === 'calibrating') && (
            <StagePanel
              icon="🔧"
              title="第 1 步 · 校准后的提示词（Prompt）"
              hint="DeepSeek 基于任务类型把原始提示词补全为工程级"
              streaming={stage === 'calibrating'}
              elapsed={elapsed}
              text={calibrated}
              model={model}
              tone="calibration"
            />
          )}

          {(output || stage === 'generating' || stage === 'done') && (
            <StagePanel
              icon="✍️"
              title="第 2 步 · 生成的内容"
              hint="使用校准后的提示词（Prompt）调用 DeepSeek"
              streaming={stage === 'generating'}
              elapsed={elapsed}
              text={output}
              model={model}
              tone="generation"
            />
          )}
        </div>

        {/* 右：评分 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PromptScoreCard
            prompt={prompt}
            taskType={taskType}
            industryKeywords={industryKeywords}
          />
        </aside>
      </div>

      {/* 常驻底部操作栏：模型 + 生成 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-clay-500/15 bg-cream-50/95 backdrop-blur supports-[backdrop-filter]:bg-cream-50/80">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
          <label className="flex flex-1 items-center gap-2 sm:flex-none sm:w-80">
            <span className="hidden text-xs font-semibold text-ink-700/70 sm:inline">模型</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-xl border border-clay-500/25 bg-cream-50 px-3 py-2 text-sm outline-none transition focus:border-clay-500/60"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          {usage && (
            <span className="hidden font-mono text-[11px] text-ink-700/70 md:inline">
              tokens: {usage.prompt_tokens} → {usage.completion_tokens}
            </span>
          )}
          {stage === 'done' && output && (
            <span className="hidden rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-800 md:inline">
              ✓ 已存档，即将跳转
            </span>
          )}

          <div className="ml-auto">
            {isRunning ? (
              <button onClick={stop} className="btn-ghost text-sm">
                ⏹ 停止 · {stage === 'calibrating' ? '校准中' : '生成中'} · {elapsed.toFixed(1)}s
              </button>
            ) : (
              <button
                onClick={generate}
                disabled={!prompt.trim()}
                className="btn-primary text-sm disabled:opacity-50"
                title={!prompt.trim() ? '请先填写提示词（Prompt）' : '先校准，再生成'}
              >
                ▶ 校准并生成
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StagePanel({ icon, title, hint, streaming, elapsed, text, model, tone }) {
  const accent =
    tone === 'calibration'
      ? 'border-sky-500/30 bg-sky-50/40'
      : 'border-clay-500/15 bg-cream-50/80'
  return (
    <div className={`rounded-3xl border p-5 shadow-soft ${accent}`}>
      <div className="mb-2 flex flex-wrap items-baseline gap-2 text-xs font-semibold text-clay-700">
        <span>{streaming ? '⏳' : '✓'}</span>
        <span>{icon} {title}</span>
        {streaming && (
          <span className="font-mono text-[10px] text-ink-700/60">
            {elapsed.toFixed(1)}s
          </span>
        )}
        {!streaming && text && (
          <span className="font-mono text-[10px] text-ink-700/60">
            {text.length} 字
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] text-ink-700/60">{model}</span>
      </div>
      {hint && <p className="mb-2 text-[11px] text-ink-700/60">{hint}</p>}
      <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-ink-900">
        {text || ' '}
        {streaming && (
          <span className="ml-0.5 inline-block w-[2px] bg-clay-500 align-middle animate-blink">
            &nbsp;
          </span>
        )}
      </pre>
    </div>
  )
}

function Card({ title, hint, children }) {
  return (
    <div className="rounded-3xl border border-clay-500/15 bg-cream-50/80 p-5 shadow-soft">
      <div className="mb-3">
        <h3 className="font-display text-base font-bold text-ink-900">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-ink-700/70">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function CollapsibleCard({ title, hint, summary, open, onToggle, children }) {
  return (
    <div className="rounded-3xl border border-clay-500/15 bg-cream-50/80 p-5 shadow-soft">
      <button
        type="button"
        onClick={onToggle}
        className="-m-1 flex w-full items-start gap-3 rounded-2xl p-1 text-left transition hover:bg-clay-500/5"
        aria-expanded={open}
      >
        <div className="flex-1">
          <h3 className="font-display text-base font-bold text-ink-900">{title}</h3>
          {open ? (
            hint && <p className="mt-0.5 text-xs text-ink-700/70">{hint}</p>
          ) : (
            <p className="mt-1 text-sm text-ink-800">{summary}</p>
          )}
        </div>
        <span
          className={`mt-1 select-none text-ink-700/50 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}
