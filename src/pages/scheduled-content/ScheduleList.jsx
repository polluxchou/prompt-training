import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ACTIVE_QUOTA,
  countActive,
  deleteSchedule,
  formatInTimezone,
  formatRelative,
  listRunsBySchedule,
  seedIfEmpty,
  updateSchedule,
} from '../../lib/schedulesStore.js'
import { useSchedulesState } from '../../lib/useSchedules.js'
import PageHeader from './_PageHeader.jsx'

export default function ScheduleList() {
  useEffect(() => {
    seedIfEmpty()
  }, [])

  const state = useSchedulesState()
  const schedules = state.schedules

  const sorted = useMemo(
    () =>
      schedules
        .slice()
        .sort(
          (a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0)
          || (a.next_run_at || '').localeCompare(b.next_run_at || ''),
        ),
    [schedules],
  )

  const active = countActive(state)
  const quotaFull = active >= ACTIVE_QUOTA

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <PageHeader
        eyebrow="定时内容"
        title="我的 schedule"
        subtitle="每条 schedule 会在你设定的时间，按提示词（Prompt）自动生成一篇文章并存档"
        right={
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                quotaFull
                  ? 'bg-amber-500/15 text-amber-800'
                  : 'bg-clay-500/15 text-clay-700'
              }`}
              title="MVP 每个用户最多同时启用 5 个 schedule"
            >
              已启用 {active} / {ACTIVE_QUOTA}
            </span>
            <Link
              to="/scheduled-content/new"
              className={`btn-primary text-sm ${quotaFull ? 'opacity-60' : ''}`}
              title={quotaFull ? '已达启用上限，可先停用再新建' : '新建 schedule'}
            >
              + 新建 schedule
            </Link>
          </div>
        }
      />

      <div className="mt-3 rounded-2xl border border-clay-500/15 bg-cream-100/40 px-4 py-2.5 text-xs text-ink-700/80">
        🧪 原型模式 · 数据存在浏览器 localStorage（刷新不丢，仅当前设备可见）·
        "立即试跑" 走真实 DeepSeek 后端
      </div>

      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 space-y-3">
          {sorted.map((s) => (
            <ScheduleRow key={s.id} schedule={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-3xl border border-dashed border-clay-500/30 bg-cream-100/40 px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-clay-500/15 text-2xl">
        📅
      </div>
      <h3 className="font-display text-xl font-bold text-ink-900">
        还没有 schedule
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-700">
        创建第一个 schedule，让 AI 每天固定时间帮你生成一篇文章
      </p>
      <Link
        to="/scheduled-content/new"
        className="btn-primary mt-5 inline-flex text-sm"
      >
        + 创建第一个 schedule
      </Link>
    </div>
  )
}

function ScheduleRow({ schedule }) {
  const runs = listRunsBySchedule(schedule.id)
  const lastRun = runs[0]

  const onToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      updateSchedule(schedule.id, { active: !schedule.active })
    } catch (err) {
      alert(err.message)
    }
  }

  const onDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const ok = window.confirm(
      `确认删除 schedule「${schedule.name}」？相关 ${runs.length} 条运行记录与文章也会一并删除`,
    )
    if (ok) deleteSchedule(schedule.id)
  }

  return (
    <Link
      to={`/scheduled-content/${schedule.id}`}
      className={`block rounded-2xl border bg-cream-50 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-warm ${
        schedule.active ? 'border-clay-500/20' : 'border-clay-500/10 opacity-70'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-ink-900 truncate">
              {schedule.name}
            </h3>
            <StatusBadge schedule={schedule} lastRun={lastRun} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-ink-700/85">
            {schedule.prompt}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[12px] text-ink-700/70">
            <Meta label="时间">
              每日 {schedule.schedule_time} ·{' '}
              <span className="text-ink-700/60">{schedule.timezone}</span>
            </Meta>
            <Meta label="模型">
              {schedule.provider}/{schedule.model}
            </Meta>
            {schedule.active ? (
              <Meta label="下次">
                {formatInTimezone(schedule.next_run_at, schedule.timezone)}
                <span className="ml-1 text-ink-700/50">
                  ({formatRelative(schedule.next_run_at)})
                </span>
              </Meta>
            ) : (
              <Meta label="状态">已停用</Meta>
            )}
            <Meta label="上次">
              {schedule.last_run_at
                ? formatRelative(schedule.last_run_at)
                : '从未运行'}
            </Meta>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onToggle}
            className={`relative h-6 w-11 rounded-full transition ${
              schedule.active ? 'bg-clay-500' : 'bg-ink-700/20'
            }`}
            aria-label={schedule.active ? '停用' : '启用'}
            title={schedule.active ? '点击停用' : '点击启用'}
          >
            <span
              className={`absolute top-0.5 inline-block h-5 w-5 rounded-full bg-cream-50 shadow transition-transform ${
                schedule.active ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <button
            onClick={onDelete}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-700/70 transition hover:bg-red-50 hover:text-red-700"
            title="删除"
          >
            🗑
          </button>
        </div>
      </div>
    </Link>
  )
}

function Meta({ label, children }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[10px] uppercase tracking-wider text-ink-700/50">
        {label}
      </span>
      <span>{children}</span>
    </span>
  )
}

function StatusBadge({ schedule, lastRun }) {
  if (!schedule.active) {
    return (
      <span className="rounded-full bg-ink-700/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-700/70">
        已停用
      </span>
    )
  }
  if (!lastRun) {
    return (
      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sky-700">
        待运行
      </span>
    )
  }
  if (lastRun.status === 'completed') {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">
        ✓ 已生成
      </span>
    )
  }
  if (lastRun.status === 'failed') {
    return (
      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-700">
        ✗ 失败
      </span>
    )
  }
  return (
    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800">
      运行中
    </span>
  )
}
