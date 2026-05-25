import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import AutoGrowTextarea from '../../components/AutoGrowTextarea.jsx'
import PlatformChips from '../../components/PlatformChips.jsx'
import {
  ACTIVE_QUOTA,
  countActive,
  createSchedule,
  defaultTimezone,
  getSchedule,
  TIMEZONES,
  updateSchedule,
} from '../../lib/schedulesStore.js'
import { useSchedulesState } from '../../lib/useSchedules.js'
import PageHeader from './_PageHeader.jsx'
import TryRun from './_TryRun.jsx'

const MODEL_OPTIONS = [
  { provider: 'deepseek', model: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash · 快' },
  { provider: 'deepseek', model: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro · 长文' },
]

export default function ScheduleForm({ mode }) {
  const isEdit = mode === 'edit'
  const navigate = useNavigate()
  const { id } = useParams()
  const state = useSchedulesState()
  const existing = isEdit ? getSchedule(id) : null

  // 当用户在另一个 tab 删了这条，自动回退到列表
  if (isEdit && !existing) {
    return <Navigate to="/scheduled-content" replace />
  }

  const [form, setForm] = useState(() => ({
    name: existing?.name || '',
    prompt: existing?.prompt || '',
    schedule_time: existing?.schedule_time || '09:00',
    timezone: existing?.timezone || defaultTimezone(),
    provider: existing?.provider || 'deepseek',
    model: existing?.model || 'deepseek-v4-flash',
    active: existing?.active ?? true,
  }))

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const active = useMemo(() => countActive(state), [state])
  const wouldExceedQuota =
    form.active && !existing?.active && active >= ACTIVE_QUOTA

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('请填写名称')
    if (!form.prompt.trim()) return setError('请填写提示词（Prompt）')
    if (!/^\d{2}:\d{2}$/.test(form.schedule_time)) return setError('时间格式应为 HH:MM')

    setSubmitting(true)
    try {
      if (isEdit) {
        updateSchedule(id, form)
        navigate(`/scheduled-content/${id}`)
      } else {
        const created = createSchedule(form)
        navigate(`/scheduled-content/${created.id}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-3xl px-6 py-12 sm:py-16"
      noValidate
    >
      <PageHeader
        eyebrow={isEdit ? '编辑' : '新建'}
        title={isEdit ? '编辑 schedule' : '新建 schedule'}
        subtitle="到点后会按下面的提示词（Prompt）自动生成一篇文章，存档到「历史文章」里"
        back={{
          to: isEdit ? `/scheduled-content/${id}` : '/scheduled-content',
          label: isEdit ? '返回详情' : '返回列表',
        }}
      />

      <div className="mt-8 space-y-6 rounded-3xl border border-clay-500/15 bg-cream-50/80 p-6 shadow-soft">
        <Field
          label="名称"
          hint="给这个 schedule 起个识别名，如「每日紧固件早报」"
        >
          <input
            type="text"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="例如：每日紧固件行业要闻"
            className="sc-input"
            maxLength={60}
          />
        </Field>

        <Field
          label="提示词（Prompt）"
          hint="这是每天会发给 AI 的提示词。建议包含：角色 · 任务 · 输出格式 · 约束 · 兜底（参见「结构」一节的爆炸图）"
        >
          <AutoGrowTextarea
            value={form.prompt}
            onChange={(v) => set({ prompt: v })}
            collapsedPx={220}
            fadeFrom="from-cream-50"
            buttonTone="clay"
            placeholder="例如：你是一位紧固件行业的资深分析师，请用 600 字内总结昨日全球最重要 3 条新闻..."
            spellCheck={false}
            className="block w-full rounded-xl border border-clay-500/25 bg-cream-50 p-3 font-mono text-sm leading-relaxed text-ink-900 outline-none transition focus:border-clay-500/60 focus:bg-cream-50"
          />
          <PlatformChips
            value={form.prompt}
            onChange={(next) => set({ prompt: next })}
            className="mt-3"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="每天运行时间">
            <input
              type="time"
              value={form.schedule_time}
              onChange={(e) => set({ schedule_time: e.target.value })}
              className="sc-input"
            />
          </Field>

          <Field label="时区">
            <select
              value={form.timezone}
              onChange={(e) => set({ timezone: e.target.value })}
              className="sc-input"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="模型"
          hint="原型只接 DeepSeek 后端；真实集成时这里会读 model-config 的 provider 列表"
        >
          <select
            value={`${form.provider}/${form.model}`}
            onChange={(e) => {
              const [provider, model] = e.target.value.split('/')
              set({ provider, model })
            }}
            className="sc-input"
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.model} value={`${m.provider}/${m.model}`}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="状态">
          <label className="inline-flex cursor-pointer items-center gap-3">
            <span
              onClick={(e) => {
                e.preventDefault()
                set({ active: !form.active })
              }}
              className={`relative inline-block h-6 w-11 rounded-full transition ${
                form.active ? 'bg-clay-500' : 'bg-ink-700/20'
              }`}
              role="checkbox"
              aria-checked={form.active}
            >
              <span
                className={`absolute top-0.5 inline-block h-5 w-5 rounded-full bg-cream-50 shadow transition-transform ${
                  form.active ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </span>
            <span className="text-sm text-ink-800">
              {form.active ? '启用（到点自动跑）' : '已停用（仅保存配置，不会触发）'}
            </span>
          </label>
          {wouldExceedQuota && (
            <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
              ⚠ 已启用 {active} / {ACTIVE_QUOTA} 个 schedule，将无法启用此条，请先停用其他 schedule
            </p>
          )}
        </Field>
      </div>

      {/* 立即试跑：保存前先用真实 LLM 跑一次看看效果 */}
      <div className="mt-6 rounded-3xl border border-clay-500/15 bg-cream-100/40 p-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-ink-900">
              立即试跑（不保存）
            </h3>
            <p className="mt-0.5 text-xs text-ink-700/75">
              直接调 DeepSeek 跑一次当前提示词（Prompt），验证效果后再保存。
              {isEdit && '本次试跑会以 manual 触发存档为一篇文章。'}
            </p>
          </div>
        </div>
        <TryRun
          prompt={form.prompt}
          model={form.model}
          persistTo={isEdit ? id : null}
          disabledReason={!form.prompt.trim() ? '请先填写提示词（Prompt）' : ''}
          compact={false}
        />
      </div>

      {/* 底部操作 */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={isEdit ? `/scheduled-content/${id}` : '/scheduled-content'}
          className="btn-ghost text-sm"
        >
          取消
        </Link>

        <div className="flex items-center gap-3">
          {error && (
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-700">
              {error}
            </span>
          )}
          <button
            type="submit"
            className="btn-primary text-sm disabled:opacity-50"
            disabled={submitting || wouldExceedQuota}
          >
            {submitting ? '保存中...' : isEdit ? '保存修改' : '保存 schedule'}
          </button>
        </div>
      </div>

      <style>{`
        .sc-input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(217, 119, 87, 0.25);
          background: rgb(255, 252, 247);
          padding: 10px 12px;
          font-size: 14px;
          color: rgb(38, 25, 15);
          outline: none;
          transition: border-color .15s, box-shadow .15s, background .15s;
        }
        .sc-input:focus {
          border-color: rgba(217, 119, 87, 0.6);
          box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.12);
        }
      `}</style>
    </form>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink-900">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-700/70">{hint}</p>}
    </div>
  )
}
