// 生成历史的统计与时间分组工具
// 全部纯函数，无副作用

// ── 时间边界 ───────────────────────────────────────

export function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// ISO 周（周一为一周起始）
export function startOfWeek(d) {
  const x = startOfDay(d)
  const day = x.getDay() // 0=周日..6=周六
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

export function startOfMonth(d) {
  const x = startOfDay(d)
  x.setDate(1)
  return x
}

// ── Key 生成（用作 groupBy 的字符串） ───────────────

function pad(n) {
  return String(n).padStart(2, '0')
}

export function dayKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ISO 8601 周编号
function isoWeek(d) {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNr = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((target - firstThursday) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    )
  return { year: target.getUTCFullYear(), week }
}

export function weekKey(d) {
  const { year, week } = isoWeek(d)
  return `${year}-W${pad(week)}`
}

export function monthKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// ── 漂亮 label ─────────────────────────────────────

const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function formatDayLabel(d) {
  const today = startOfDay(new Date())
  const target = startOfDay(d)
  const diffDays = Math.round((today - target) / 86400000)
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} · ${WEEKDAY[d.getDay()]}`
  if (diffDays === 0) return `${base} · 今天`
  if (diffDays === 1) return `${base} · 昨天`
  if (diffDays === 2) return `${base} · 前天`
  return base
}

export function formatWeekLabel(d) {
  const s = startOfWeek(d)
  const e = new Date(s)
  e.setDate(s.getDate() + 6)
  const { year, week } = isoWeek(d)
  const range = `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
  // 本周判定：start 等于本周 start
  const thisWeekStart = startOfWeek(new Date())
  const isThisWeek = +s === +thisWeekStart
  const isLastWeek =
    +s === +new Date(thisWeekStart.getTime() - 7 * 86400000)
  let suffix = ''
  if (isThisWeek) suffix = ' · 本周'
  else if (isLastWeek) suffix = ' · 上周'
  return `${year} 第 ${week} 周（${range}）${suffix}`
}

export function formatMonthLabel(d) {
  const ym = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
  const now = new Date()
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
    return `${ym} · 本月`
  return ym
}

// ── 汇总统计 ───────────────────────────────────────

export function summarize(generations) {
  const now = new Date()
  const dayCut = startOfDay(now)
  const weekCut = startOfWeek(now)
  const monthCut = startOfMonth(now)

  let today = 0, week = 0, month = 0
  let tokensIn = 0, tokensOut = 0

  for (const g of generations) {
    const t = new Date(g.created_at || 0)
    if (t >= dayCut) today += 1
    if (t >= weekCut) week += 1
    if (t >= monthCut) month += 1
    if (g.token_usage) {
      tokensIn += Number(g.token_usage.prompt_tokens || 0)
      tokensOut += Number(g.token_usage.completion_tokens || 0)
    }
  }

  return {
    total: generations.length,
    today,
    week,
    month,
    tokensIn,
    tokensOut,
  }
}

// ── 分组 ───────────────────────────────────────────

const KEY_FNS = {
  day: dayKey,
  week: weekKey,
  month: monthKey,
}

const LABEL_FNS = {
  day: formatDayLabel,
  week: formatWeekLabel,
  month: formatMonthLabel,
}

// ── 团队排名 ───────────────────────────────────────

/**
 * 按 created_by 聚合，返回 [{ user, count, tokensIn, tokensOut, tokensTotal }]
 * 调用方再按需要的字段排序
 */
export function leaderboardByUser(generations) {
  const map = new Map()
  for (const g of generations) {
    const user = g.created_by || '未署名'
    if (!map.has(user)) {
      map.set(user, { user, count: 0, tokensIn: 0, tokensOut: 0 })
    }
    const e = map.get(user)
    e.count += 1
    if (g.token_usage) {
      e.tokensIn += Number(g.token_usage.prompt_tokens || 0)
      e.tokensOut += Number(g.token_usage.completion_tokens || 0)
    }
  }
  return Array.from(map.values()).map((e) => ({
    user: e.user,
    count: e.count,
    tokensIn: e.tokensIn,
    tokensOut: e.tokensOut,
    tokensTotal: e.tokensIn + e.tokensOut,
  }))
}

/**
 * 按粒度分组并返回 [{ key, label, anchor, items }]，按时间倒序
 * granularity: 'day' | 'week' | 'month'
 */
export function groupByTime(generations, granularity = 'day') {
  const keyFn = KEY_FNS[granularity] || dayKey
  const labelFn = LABEL_FNS[granularity] || formatDayLabel

  const map = new Map()
  for (const g of generations) {
    const t = new Date(g.created_at || 0)
    const k = keyFn(t)
    if (!map.has(k)) {
      map.set(k, { key: k, anchor: t, label: labelFn(t), items: [] })
    }
    map.get(k).items.push(g)
  }

  const groups = Array.from(map.values())
  groups.sort((a, b) => b.anchor - a.anchor) // 新→旧
  for (const grp of groups) {
    grp.items.sort(
      (a, b) => (b.created_at || '').localeCompare(a.created_at || ''),
    )
  }
  return groups
}
