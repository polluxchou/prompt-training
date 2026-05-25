// localStorage-backed mock store for scheduled-content prototype.
// 在真实集成时，这一层应替换为 fetch('/api/scheduled-content/...')。

const KEY = 'sc-state-v1'

const DEFAULT_STATE = {
  schedules: [],
  runs: [],
  articles: [],
}

const listeners = new Set()

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw)
    return {
      schedules: parsed.schedules || [],
      runs: parsed.runs || [],
      articles: parsed.articles || [],
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function write(next) {
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((fn) => {
    try {
      fn(next)
    } catch {
      /* ignore */
    }
  })
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getState() {
  return read()
}

// ---------- time helpers ----------

const TZ_OPTIONS = [
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Europe/Berlin',
  'Europe/London',
  'America/Los_Angeles',
  'America/New_York',
  'UTC',
]
export const TIMEZONES = TZ_OPTIONS

export function defaultTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return TZ_OPTIONS.includes(tz) ? tz : 'Asia/Shanghai'
  } catch {
    return 'Asia/Shanghai'
  }
}

/**
 * 计算下次运行时间。
 * 输入：schedule_time = "HH:MM"，timezone = IANA tz；from = 起算点 Date
 * 输出：ISO string
 */
export function computeNextRunAt(scheduleTime, timezone, from = new Date()) {
  const [hh, mm] = scheduleTime.split(':').map(Number)
  // 在 timezone 下取今日的 hh:mm
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    dtf.formatToParts(from).map((p) => [p.type, p.value]),
  )
  // 构造一个该时区内 YYYY-MM-DD HH:MM:00 的字符串，作为 UTC 偏移参考
  const candidateStr = `${parts.year}-${parts.month}-${parts.day}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`
  // 把这个"本地时间字符串"和时区的偏移结合：得到对应的 UTC 时刻
  const candidate = zonedTimeToUtc(candidateStr, timezone)
  if (candidate.getTime() <= from.getTime()) {
    candidate.setUTCDate(candidate.getUTCDate() + 1)
  }
  return candidate.toISOString()
}

// 简化版 zonedTimeToUtc：把"timezone 下的 wall-clock 字符串"转成 UTC Date
function zonedTimeToUtc(localStr, timezone) {
  // 先把 localStr 当作 UTC 解析
  const tentative = new Date(localStr + 'Z')
  // 求该 UTC 时刻对应该时区的偏移分钟
  const offsetMin = getTimezoneOffsetMin(tentative, timezone)
  // 真实 UTC = tentative - offset
  return new Date(tentative.getTime() - offsetMin * 60 * 1000)
}

function getTimezoneOffsetMin(date, timezone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  )
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )
  return (asUTC - date.getTime()) / (60 * 1000)
}

export function formatInTimezone(isoOrDate, timezone, opts = {}) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  if (!d || Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...opts,
  }).format(d)
}

export function formatRelative(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const abs = Math.abs(diff)
  const past = diff > 0
  const min = Math.round(abs / 60_000)
  if (min < 1) return past ? '刚刚' : '稍后'
  if (min < 60) return past ? `${min} 分钟前` : `${min} 分钟后`
  const hr = Math.round(min / 60)
  if (hr < 24) return past ? `${hr} 小时前` : `${hr} 小时后`
  const day = Math.round(hr / 24)
  return past ? `${day} 天前` : `${day} 天后`
}

// ---------- quota ----------

export const ACTIVE_QUOTA = 5

export function countActive(state = read()) {
  return state.schedules.filter((s) => s.active).length
}

// ---------- schedule CRUD ----------

export function listSchedules() {
  return read().schedules.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
}

export function getSchedule(id) {
  return read().schedules.find((s) => s.id === id) || null
}

export function createSchedule(input) {
  const state = read()
  if (input.active && countActive(state) >= ACTIVE_QUOTA) {
    throw new Error(`已达 ${ACTIVE_QUOTA} 个启用 schedule 上限`)
  }
  const now = new Date().toISOString()
  const sched = {
    id: crypto.randomUUID(),
    name: input.name,
    prompt: input.prompt,
    provider: input.provider || 'deepseek',
    model: input.model || 'deepseek-v4-flash',
    schedule_time: input.schedule_time,
    timezone: input.timezone,
    active: input.active !== false,
    last_run_at: null,
    next_run_at: computeNextRunAt(input.schedule_time, input.timezone),
    created_at: now,
    updated_at: now,
  }
  state.schedules.push(sched)
  write(state)
  return sched
}

export function updateSchedule(id, patch) {
  const state = read()
  const idx = state.schedules.findIndex((s) => s.id === id)
  if (idx === -1) throw new Error('schedule not found')
  const prev = state.schedules[idx]

  // 配额检查（只在 active=false→true 时）
  if (patch.active === true && !prev.active && countActive(state) >= ACTIVE_QUOTA) {
    throw new Error(`已达 ${ACTIVE_QUOTA} 个启用 schedule 上限`)
  }

  const merged = { ...prev, ...patch, updated_at: new Date().toISOString() }
  if (
    patch.schedule_time !== undefined ||
    patch.timezone !== undefined ||
    (patch.active === true && !prev.active)
  ) {
    merged.next_run_at = computeNextRunAt(merged.schedule_time, merged.timezone)
  }
  state.schedules[idx] = merged
  write(state)
  return merged
}

export function deleteSchedule(id) {
  const state = read()
  state.schedules = state.schedules.filter((s) => s.id !== id)
  // 级联：MVP 里同时删掉 runs / articles
  state.runs = state.runs.filter((r) => r.schedule_id !== id)
  state.articles = state.articles.filter((a) => a.schedule_id !== id)
  write(state)
}

// ---------- runs / articles ----------

export function listRunsBySchedule(scheduleId) {
  return read()
    .runs.filter((r) => r.schedule_id === scheduleId)
    .sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))
}

export function listArticlesBySchedule(scheduleId) {
  return read()
    .articles.filter((a) => a.schedule_id === scheduleId)
    .sort((a, b) => (b.generated_at || '').localeCompare(a.generated_at || ''))
}

export function getArticle(id) {
  return read().articles.find((a) => a.id === id) || null
}

export function getRunByArticle(articleId) {
  return read().runs.find((r) => r.article_id === articleId) || null
}

/**
 * 创建一次 run（manual 或 scheduled），先返回 run 的 ID
 */
export function startRun(scheduleId, trigger = 'manual') {
  const state = read()
  const run = {
    id: crypto.randomUUID(),
    schedule_id: scheduleId,
    status: 'running',
    article_id: null,
    error: null,
    token_usage: null,
    trigger,
    started_at: new Date().toISOString(),
    completed_at: null,
  }
  state.runs.push(run)
  write(state)
  return run
}

export function completeRun(runId, { content, title, tokenUsage, model }) {
  const state = read()
  const runIdx = state.runs.findIndex((r) => r.id === runId)
  if (runIdx === -1) throw new Error('run not found')
  const run = state.runs[runIdx]

  const article = {
    id: crypto.randomUUID(),
    schedule_id: run.schedule_id,
    run_id: run.id,
    title: title || extractTitle(content),
    content,
    model: model || null,
    generated_at: new Date().toISOString(),
  }
  state.articles.push(article)

  state.runs[runIdx] = {
    ...run,
    status: 'completed',
    article_id: article.id,
    token_usage: tokenUsage || null,
    completed_at: new Date().toISOString(),
  }

  // 同步更新 schedule.last_run_at（仅对 scheduled 触发；manual 不更新调度状态）
  if (run.trigger === 'scheduled') {
    const sIdx = state.schedules.findIndex((s) => s.id === run.schedule_id)
    if (sIdx !== -1) {
      const s = state.schedules[sIdx]
      state.schedules[sIdx] = {
        ...s,
        last_run_at: new Date().toISOString(),
        next_run_at: computeNextRunAt(s.schedule_time, s.timezone),
      }
    }
  }

  write(state)
  return article
}

export function failRun(runId, error) {
  const state = read()
  const idx = state.runs.findIndex((r) => r.id === runId)
  if (idx === -1) return
  state.runs[idx] = {
    ...state.runs[idx],
    status: 'failed',
    error: String(error || 'unknown error'),
    completed_at: new Date().toISOString(),
  }
  write(state)
}

function extractTitle(content) {
  if (!content) return '(未命名)'
  const firstLine = content.split('\n').find((l) => l.trim().length > 0) || ''
  return firstLine.replace(/^#+\s*/, '').trim().slice(0, 60) || '(未命名)'
}

// ---------- demo seed ----------

/**
 * 第一次进入时塞 1 条样例 schedule，让原型看起来不像空白页
 */
export function seedIfEmpty() {
  const state = read()
  if (state.schedules.length > 0) return
  const tz = defaultTimezone()
  const schedule = {
    id: crypto.randomUUID(),
    name: '每日紧固件行业要闻',
    prompt:
      '你是一位紧固件行业的资深分析师。请用 600 字以内总结昨日全球紧固件 / 制造业 / 关税相关的最重要 3 条新闻，包含来源、关键数据和对中国厂商的潜在影响。语气克制、避免"重磅"等套话。',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    schedule_time: '09:00',
    timezone: tz,
    active: true,
    last_run_at: null,
    next_run_at: computeNextRunAt('09:00', tz),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  write({ ...state, schedules: [schedule] })
}
