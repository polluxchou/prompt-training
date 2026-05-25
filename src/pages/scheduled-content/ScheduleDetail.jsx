import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  deleteSchedule,
  formatInTimezone,
  formatRelative,
  getSchedule,
  listArticlesBySchedule,
  listRunsBySchedule,
  updateSchedule,
} from '../../lib/schedulesStore.js'
import { useSchedulesState } from '../../lib/useSchedules.js'
import PageHeader from './_PageHeader.jsx'
import TryRun from './_TryRun.jsx'

export default function ScheduleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  // 订阅 store，删/改后自动重渲
  useSchedulesState()
  const schedule = getSchedule(id)

  if (!schedule) return <Navigate to="/scheduled-content" replace />

  const articles = listArticlesBySchedule(schedule.id)
  const runs = listRunsBySchedule(schedule.id)
  const failedCount = runs.filter((r) => r.status === 'failed').length

  const toggleActive = () => {
    try {
      updateSchedule(schedule.id, { active: !schedule.active })
    } catch (err) {
      alert(err.message)
    }
  }

  const onDelete = () => {
    const ok = window.confirm(
      `确认删除 schedule「${schedule.name}」？共 ${articles.length} 篇文章会一并删除`,
    )
    if (ok) {
      deleteSchedule(schedule.id)
      navigate('/scheduled-content')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <PageHeader
        eyebrow="schedule 详情"
        title={schedule.name}
        subtitle={`每天 ${schedule.schedule_time}（${schedule.timezone}） · 使用 ${schedule.provider}/${schedule.model}`}
        back={{ to: '/scheduled-content', label: '返回列表' }}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={toggleActive}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                schedule.active
                  ? 'bg-clay-500/15 text-clay-700 hover:bg-clay-500/25'
                  : 'bg-ink-700/10 text-ink-700 hover:bg-ink-700/20'
              }`}
            >
              {schedule.active ? '● 已启用 · 点击停用' : '○ 已停用 · 点击启用'}
            </button>
            <Link
              to={`/scheduled-content/${schedule.id}/edit`}
              className="btn-ghost text-sm"
            >
              编辑
            </Link>
            <button
              onClick={onDelete}
              className="rounded-full border border-red-500/30 px-4 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
            >
              🗑 删除
            </button>
          </div>
        }
      />

      {/* 概览卡片 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat
          label="下次运行"
          value={
            schedule.active
              ? formatInTimezone(schedule.next_run_at, schedule.timezone)
              : '已停用'
          }
          sub={
            schedule.active
              ? formatRelative(schedule.next_run_at)
              : '启用后将重新计算'
          }
        />
        <Stat
          label="上次运行"
          value={
            schedule.last_run_at
              ? formatInTimezone(schedule.last_run_at, schedule.timezone)
              : '从未'
          }
          sub={schedule.last_run_at ? formatRelative(schedule.last_run_at) : '—'}
        />
        <Stat label="共生成" value={`${articles.length} 篇`} sub="历史文章" />
        <Stat
          label="运行记录"
          value={`${runs.length} 次`}
          sub={failedCount > 0 ? `其中 ${failedCount} 次失败` : '全部成功'}
          warn={failedCount > 0}
        />
      </div>

      {/* Prompt 预览 */}
      <section className="mt-7 rounded-3xl border border-clay-500/15 bg-cream-50/85 p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-clay-600">
            📝 提示词（Prompt）
          </h3>
          <Link
            to={`/scheduled-content/${schedule.id}/edit`}
            className="text-xs font-medium text-clay-700 hover:underline"
          >
            修改 →
          </Link>
        </div>
        <pre className="whitespace-pre-wrap break-words rounded-2xl bg-ink-900/95 p-4 font-mono text-[12.5px] leading-relaxed text-cream-100">
          {schedule.prompt}
        </pre>
      </section>

      {/* 立即试跑（manual + 持久化） */}
      <section className="mt-6 rounded-3xl border border-clay-500/15 bg-gradient-to-br from-clay-500/5 to-ember-500/5 p-6">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="font-display text-base font-bold text-ink-900">
            立即试跑（manual）
          </h3>
          <span className="rounded-full bg-clay-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-clay-700">
            存档为文章
          </span>
        </div>
        <p className="mb-3 text-xs text-ink-700/75">
          按下面 Prompt 立即调一次 DeepSeek，生成的内容会作为一篇 manual 触发的文章存档
          —— <strong>不会推迟下次定时运行时间</strong>。
        </p>
        <TryRun
          prompt={schedule.prompt}
          model={schedule.model}
          persistTo={schedule.id}
          compact={false}
        />
      </section>

      {/* 历史文章列表 */}
      <section className="mt-7">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-clay-600">
          📚 历史文章（{articles.length}）
        </h3>
        {articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-clay-500/30 bg-cream-100/40 p-8 text-center text-sm text-ink-700/70">
            还没有文章。点上方「▶ 立即试跑」生成第一篇，或等到{' '}
            <strong>{schedule.schedule_time}</strong> 自动跑。
          </div>
        ) : (
          <div className="space-y-2.5">
            {articles.map((a) => {
              const run = runs.find((r) => r.id === a.run_id)
              return (
                <Link
                  key={a.id}
                  to={`/scheduled-content/${schedule.id}/articles/${a.id}`}
                  className="block rounded-2xl border border-clay-500/15 bg-cream-50 p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-warm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-bold text-ink-900 truncate">
                          {a.title}
                        </h4>
                        {run?.trigger === 'manual' && (
                          <span className="shrink-0 rounded-full bg-clay-500/15 px-2 py-0.5 text-[10px] font-medium text-clay-700">
                            ▶ manual
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-ink-700/85">
                        {a.content.slice(0, 200)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[11px] text-ink-700/70">
                        {formatInTimezone(a.generated_at, schedule.timezone)}
                      </div>
                      <div className="font-mono text-[10px] text-ink-700/50">
                        {formatRelative(a.generated_at)}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, sub, warn = false }) {
  return (
    <div
      className={`rounded-2xl border bg-cream-50 p-4 shadow-soft ${
        warn ? 'border-amber-400/60' : 'border-clay-500/15'
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-700/60">
        {label}
      </div>
      <div className="mt-1.5 font-display text-lg font-bold text-ink-900">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[11px] text-ink-700/60">
          {sub}
        </div>
      )}
    </div>
  )
}
