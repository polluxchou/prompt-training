import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CURRENT_USER, listGenerations, deleteGeneration } from '../../lib/generationsStore.js'
import { useGenerationsState } from '../../lib/useGenerations.js'
import { useAuth } from '../../lib/useAuth.jsx'
import { describeTaskType } from '../../data/taskTypes.js'
import { formatRelative } from '../../lib/schedulesStore.js'
import {
  groupByTime,
  summarize,
  leaderboardByUser,
  dayKey,
  startOfDay,
} from '../../lib/generationStats.js'
import TrendCharts from '../../components/TrendCharts.jsx'

const VIEW_MODES = [
  { id: 'detail', label: '详情' },
  { id: 'title',  label: '仅标题' },
]
const PAGE_SIZES = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 0,  label: '全部' },
]

export default function GenerationList() {
  useGenerationsState() // subscribe for re-render
  const { user } = useAuth()
  const items = listGenerations()
  const [boardTab, setBoardTab] = useState(null) // null = closed, 'tokens' | 'score' = which tab
  const [viewMode, setViewMode] = useState('detail')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(0)

  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const pagedItems = pageSize === 0
    ? items
    : items.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const groups = useMemo(() => groupByTime(pagedItems, 'day'), [pagedItems])

  const handlePageSize = (n) => {
    setPageSize(n)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">即时生成</p>
          <h1 className="section-title">按提示词类型生成内容</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-700/85">
            选平台 + 受众 → 写提示词 → 即时调用 DeepSeek。所有历史会自动存档，可随时回看 / 编辑 / 删除。
          </p>
        </div>
        <Link to="/generate/new" className="btn-primary text-sm">
          + 新建生成
        </Link>
      </header>

      <StatsBoard items={items} onOpenLeaderboard={(tab) => setBoardTab(tab)} />

      {items.length > 0 && (
        <div className="mt-4">
          <TrendCharts items={items} />
        </div>
      )}

      <LeaderboardModal
        items={items}
        open={boardTab !== null}
        initialTab={boardTab || 'tokens'}
        onClose={() => setBoardTab(null)}
      />

      <div className="mb-4 mt-4 rounded-2xl border border-clay-500/15 bg-cream-100/40 px-4 py-2.5 text-xs text-ink-700/80">
        {user ? (
          <>
            ☁️ 已登录为 <span className="font-mono text-clay-700">{user.email}</span>{' '}
            · 生成历史已同步到云端，跨设备可见 · 调用走真实 DeepSeek 后端
          </>
        ) : (
          <>
            🧪 离线草稿模式 · 数据仅存当前浏览器 localStorage（刷新不丢，仅当前设备可见）·{' '}
            <Link to="/login" className="text-clay-700 underline-offset-2 hover:underline">
              登录
            </Link>{' '}
            后自动同步到云端 · 调用走真实 DeepSeek 后端
          </>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ListControls
            viewMode={viewMode}
            onViewMode={setViewMode}
            pageSize={pageSize}
            onPageSize={handlePageSize}
            page={safePage}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            totalItems={items.length}
            visibleItems={pagedItems.length}
          />
          <div className="space-y-6">
            {groups.map((grp) => (
              <Group key={grp.key} group={grp} compact={viewMode === 'title'} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ListControls({
  viewMode, onViewMode,
  pageSize, onPageSize,
  page, totalPages, onPrev, onNext,
  totalItems, visibleItems,
}) {
  const showPager = pageSize > 0 && totalPages > 1
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TogglePill label="视图" value={viewMode} options={VIEW_MODES} onChange={onViewMode} />
        <TogglePill
          label="每页"
          value={pageSize}
          options={PAGE_SIZES}
          onChange={onPageSize}
          valueKey="value"
        />
      </div>

      <div className="flex items-center gap-3 font-mono text-[11px] text-ink-700/60">
        <span>
          {pageSize === 0
            ? `共 ${totalItems} 篇`
            : `${page * pageSize + 1}–${page * pageSize + visibleItems} / ${totalItems}`}
        </span>
        {showPager && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              disabled={page === 0}
              className="rounded-full border border-clay-500/15 bg-cream-50 px-2.5 py-1 transition hover:bg-clay-500/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cream-50"
            >
              ← 上一页
            </button>
            <span className="px-1.5">{page + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={onNext}
              disabled={page >= totalPages - 1}
              className="rounded-full border border-clay-500/15 bg-cream-50 px-2.5 py-1 transition hover:bg-clay-500/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cream-50"
            >
              下一页 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TogglePill({ label, value, options, onChange, valueKey = 'id' }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-clay-500/15 bg-cream-50 p-1">
      <span className="px-2 text-[10px] uppercase tracking-wider text-ink-700/55">{label}</span>
      {options.map((o) => {
        const v = o[valueKey]
        const active = value === v
        return (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? 'bg-clay-500 text-cream-50 shadow-warm'
                : 'text-ink-700 hover:bg-clay-500/10 hover:text-ink-900'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const LB_TABS = [
  { id: 'tokens', label: 'Token 用量' },
  { id: 'score',  label: 'Prompt 平均分' },
]

function TeamLeaderboard({ items, initialTab = 'tokens' }) {
  const [tab, setTab] = useState(initialTab)
  useEffect(() => { setTab(initialTab) }, [initialTab])

  const rows = useMemo(() => leaderboardByUser(items), [items])
  const sorted = useMemo(() => {
    const r = rows.slice()
    if (tab === 'tokens') {
      r.sort((a, b) => b.tokensTotal - a.tokensTotal)
    } else {
      r.sort((a, b) => (b.avgPromptScore ?? -1) - (a.avgPromptScore ?? -1))
    }
    return r
  }, [rows, tab])

  const totalScored = rows.reduce((acc, r) => acc + (r.scoredCount || 0), 0)

  return (
    <div className="rounded-3xl border border-clay-500/15 bg-cream-50/80 p-5 shadow-soft">
      <div className="mb-4 pr-10">
        <h3 className="font-display text-base font-bold text-ink-900">团队排名</h3>
        <p className="mt-0.5 text-[11px] text-ink-700/60">
          按作者聚合 · {items.length} 篇生成 · {rows.length} 位成员
          {tab === 'score' && <> · 已评分 {totalScored} / {items.length} 篇</>}
        </p>
        <div className="mt-3 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-clay-500/15 bg-cream-50 p-1">
            {LB_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  tab === t.id
                    ? 'bg-clay-500 text-cream-50 shadow-warm'
                    : 'text-ink-700 hover:bg-clay-500/10 hover:text-ink-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-700/55">还没有可排名的数据</p>
      ) : (
        <ol className="space-y-1">
          {sorted.map((row, i) => (
            <li
              key={row.user}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-clay-500/5"
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full font-display text-xs font-bold ${
                  i === 0
                    ? 'bg-amber-500/25 text-amber-900'
                    : i === 1
                    ? 'bg-slate-400/25 text-slate-800'
                    : i === 2
                    ? 'bg-orange-500/20 text-orange-800'
                    : 'bg-clay-500/10 text-ink-700'
                }`}
              >
                {i + 1}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-ink-900">
                {row.user}
              </span>
              <span className="font-mono text-[11px] text-ink-700/55">
                {row.count} 篇
                {tab === 'score' && row.scoredCount > 0 && row.scoredCount < row.count && (
                  <span className="ml-1 text-ink-700/40">（评 {row.scoredCount}）</span>
                )}
              </span>
              <span
                className="w-24 text-right font-mono text-sm font-semibold text-ink-900"
                title={
                  tab === 'score'
                    ? row.avgPromptScore === null
                      ? '该成员还没有可评分的 prompt'
                      : `Prompt 自动评分 0-100 的平均值（${row.scoredCount} / ${row.count} 篇）`
                    : 'Token 用量合计（prompt + completion）'
                }
              >
                {tab === 'tokens'
                  ? formatTokens(row.tokensTotal)
                  : row.avgPromptScore === null
                  ? '—'
                  : row.avgPromptScore}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function StatsBoard({ items, onOpenLeaderboard }) {
  const today = useMemo(() => startOfDay(new Date()), [])

  // 生成总数：按 prompt 内容去重 —— 同一个 prompt 多次跑只算 1 篇
  const totalCount = useMemo(() => {
    const set = new Set()
    for (const g of items) set.add((g.prompt || '').trim())
    return set.size
  }, [items])

  const usedCount = useMemo(
    () => items.reduce((n, g) => n + (g.used_at ? 1 : 0), 0),
    [items],
  )

  const { myTokens, myTokenRank, myPromptScore, myScoreRank, myScoredCount, teamSize } = useMemo(() => {
    const rows = leaderboardByUser(items)

    const byTokens = rows.slice().sort((a, b) => b.tokensTotal - a.tokensTotal)
    const tIdx = byTokens.findIndex((r) => r.user === CURRENT_USER)

    // Prompt 均分排名时，把"没评过"的成员排到底，避免他们占据 1 / N 的位置
    const byScore = rows.slice().sort(
      (a, b) => (b.avgPromptScore ?? -1) - (a.avgPromptScore ?? -1),
    )
    const sIdx = byScore.findIndex((r) => r.user === CURRENT_USER)
    const mine = sIdx >= 0 ? byScore[sIdx] : null

    return {
      myTokens: tIdx >= 0 ? byTokens[tIdx].tokensTotal : 0,
      myTokenRank: tIdx >= 0 ? tIdx + 1 : null,
      myPromptScore: mine?.avgPromptScore ?? null,
      myScoreRank: mine?.avgPromptScore != null ? sIdx + 1 : null,
      myScoredCount: mine?.scoredCount ?? 0,
      teamSize: rows.length,
    }
  }, [items])

  const activeDaysThisMonth = useMemo(() => {
    const year = today.getFullYear()
    const month = today.getMonth()
    const set = new Set()
    for (const g of items) {
      const t = new Date(g.created_at || 0)
      if (t.getFullYear() === year && t.getMonth() === month) set.add(dayKey(t))
    }
    return set.size
  }, [items, today])

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <Tile label="生成总数" value={totalCount} hint="同一 prompt 多次算 1" />
      <Tile
        label="使用总数"
        value={usedCount}
        hint="复制 / 下载 算已使用，每篇唯一"
      />
      <Tile
        label={`${today.getMonth() + 1} 月活跃`}
        value={`${activeDaysThisMonth} 天`}
        hint="当月有生成的天数"
      />
      <RankTile
        label="我的 Prompt 均分"
        value={myPromptScore === null ? '—' : myPromptScore}
        hint={
          myPromptScore === null
            ? '还没有评分数据'
            : myScoreRank
            ? `团队第 ${myScoreRank} / ${teamSize} · 查看榜单 →`
            : '查看团队榜单 →'
        }
        onClick={() => onOpenLeaderboard('score')}
      />
      <RankTile
        label="我的 token"
        value={formatTokens(myTokens)}
        hint={
          myTokenRank
            ? `团队第 ${myTokenRank} / ${teamSize} · 查看榜单 →`
            : '查看团队榜单 →'
        }
        onClick={() => onOpenLeaderboard('tokens')}
      />
    </div>
  )
}

function RankTile({ label, value, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-clay-500/25 bg-clay-500/5 p-3 text-left transition hover:bg-clay-500/15 hover:shadow-soft"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-700/55">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="mt-0.5 text-[10px] text-clay-700">{hint}</p>
    </button>
  )
}

function Tile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-clay-500/15 bg-cream-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-700/55">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-ink-900">{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-ink-700/55">{hint}</p>}
    </div>
  )
}

function LeaderboardModal({ items, open, initialTab, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink-900/30 px-4 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-ink-900/10 text-base leading-none text-ink-700 transition hover:bg-ink-900/20"
          aria-label="关闭"
        >
          ×
        </button>
        <TeamLeaderboard items={items} initialTab={initialTab} />
      </div>
    </div>
  )
}

function Group({ group, compact = false }) {
  const groupSummary = useMemo(() => summarize(group.items), [group.items])
  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h2 className="font-display text-sm font-bold text-ink-900">
          {group.label}
        </h2>
        <span className="font-mono text-[11px] text-ink-700/60">
          {group.items.length} 篇
          {groupSummary.tokensIn + groupSummary.tokensOut > 0 && (
            <> · {formatTokens(groupSummary.tokensIn + groupSummary.tokensOut)} tokens</>
          )}
        </span>
      </header>
      <ul className={compact ? 'space-y-1.5' : 'space-y-3'}>
        {group.items.map((g) => (
          <li key={g.id}>
            <GenerationRow gen={g} compact={compact} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-clay-500/30 bg-cream-100/40 px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-clay-500/15 text-2xl">
        ✍️
      </div>
      <h3 className="font-display text-xl font-bold text-ink-900">
        还没有生成历史
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-700">
        新建第一篇，体验"任务类型选择 → 评分 → 调 DeepSeek"全流程
      </p>
      <Link to="/generate/new" className="btn-primary mt-5 inline-flex text-sm">
        + 创建第一篇生成
      </Link>
    </div>
  )
}

function GenerationRow({ gen, compact = false }) {
  const onDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm(`确认删除「${gen.title}」？`)) deleteGeneration(gen.id)
  }
  const tt = describeTaskType(gen.task_type || {}) || '—'

  if (compact) {
    return (
      <Link
        to={`/generate/${gen.id}`}
        className="group flex items-center gap-3 rounded-xl border border-clay-500/15 bg-cream-50 px-3 py-2 transition hover:border-clay-500/40 hover:bg-clay-500/5"
      >
        <h3 className="min-w-0 flex-1 truncate font-display text-sm font-medium text-ink-900">
          {gen.title || '(未命名)'}
        </h3>
        {gen.score && <ScoreBadge score={gen.score} />}
        <span className="hidden font-mono text-[10px] text-ink-700/55 sm:inline">
          {formatRelative(gen.created_at)}
        </span>
        <button
          onClick={onDelete}
          className="rounded-full px-2 py-0.5 text-[11px] font-medium text-ink-700/60 opacity-0 transition hover:bg-red-50 hover:text-red-700 focus:opacity-100 group-hover:opacity-100"
          title="删除"
        >
          🗑
        </button>
      </Link>
    )
  }

  return (
    <Link
      to={`/generate/${gen.id}`}
      className="group block rounded-2xl border border-clay-500/15 bg-cream-50 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-warm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold text-ink-900">
              {gen.title || '(未命名)'}
            </h3>
            {gen.score && <ScoreBadge score={gen.score} />}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-ink-700/85">{gen.content}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[12px] text-ink-700/70">
            <Meta label="类型">{tt}</Meta>
            <Meta label="模型">{gen.model || '—'}</Meta>
            <Meta label="时间">{formatRelative(gen.created_at)}</Meta>
            {gen.token_usage && (
              <Meta label="tokens">
                {gen.token_usage.prompt_tokens} → {gen.token_usage.completion_tokens}
              </Meta>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="self-start rounded-full px-2.5 py-1 text-xs font-medium text-ink-700/70 opacity-0 transition hover:bg-red-50 hover:text-red-700 focus:opacity-100 group-hover:opacity-100"
          title="删除"
        >
          🗑
        </button>
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

function ScoreBadge({ score }) {
  const colorByGrade = {
    A: 'bg-emerald-500/15 text-emerald-700',
    B: 'bg-sky-500/15 text-sky-700',
    C: 'bg-amber-500/15 text-amber-800',
    D: 'bg-red-500/15 text-red-700',
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        colorByGrade[score.grade] || 'bg-ink-700/10 text-ink-700'
      }`}
      title={`Prompt 质量自动评分 ${score.total} / 100（不进团队排名）`}
    >
      P {score.grade} · {score.total}
    </span>
  )
}

function formatTokens(n) {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}
