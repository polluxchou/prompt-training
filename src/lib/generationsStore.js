// 即时生成的历史存档
//
// 数据模型：
//   - 同步 API（listGenerations / getGeneration / createGeneration / ...）
//     永远从浏览器 localStorage 读写，调用方拿到的是同步结果。
//   - 登录后由 auth 层调用 setSyncContext + hydrateFromCloud，把云端拉下来
//     合进 localStorage，之后每个写操作"先本地、后云端"双写。
//   - 未登录用户：完全走 localStorage（离线草稿）。
//   - 登出：本地数据清空，避免共用浏览器的数据残留。

import { supabase } from './supabase.js'

const KEY = 'gen-state-v1'
const DEFAULT_STATE = { generations: [] }

// 路径外的 mock 团队（在没有真实用户的时候排行榜也有点料看）
export const MOCK_TEAM = ['张工', '李工', '王工', '陈工', '赵工']
// 当前登录用户的展示名（email 前缀），登出后回到 '我'。
// 用 let + 命名导出，搭配 ES module live binding 让旧 import 自动看到最新值。
export let CURRENT_USER = '我'

let syncUserId = null

function backfillCreatedBy(gen) {
  if (gen.created_by) return gen
  const s = gen.id || ''
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0
  const idx = Math.abs(hash) % MOCK_TEAM.length
  return { ...gen, created_by: MOCK_TEAM[idx] }
}

const listeners = new Set()

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw)
    return { generations: parsed.generations || [] }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function write(next) {
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((fn) => {
    try { fn(next) } catch { /* ignore */ }
  })
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getState() {
  return read()
}

// ── CRUD（同步 API，调用方无需变更） ────────────────────

export function listGenerations() {
  return read().generations
    .map(backfillCreatedBy)
    .slice()
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
}

export function getGeneration(id) {
  const g = read().generations.find((g) => g.id === id)
  return g ? backfillCreatedBy(g) : null
}

/**
 * @param input {
 *   prompt, model, content, tokenUsage,
 *   taskType:{ platform, role, region, gender },
 *   industryKeywords:string[], score:{total,grade,...}
 * }
 */
export function createGeneration(input) {
  const state = read()
  const now = new Date().toISOString()
  const gen = {
    id: crypto.randomUUID(),
    prompt: input.prompt || '',
    calibrated_prompt: input.calibratedPrompt || '',
    content: input.content || '',
    model: input.model || null,
    token_usage: input.tokenUsage || null,
    calibration_usage: input.calibrationUsage || null,
    task_type: input.taskType || {},
    industry_keywords: input.industryKeywords || [],
    score: input.score || null,
    title: input.title || extractTitle(input.content),
    created_by: input.createdBy || CURRENT_USER,
    created_at: now,
    updated_at: now,
  }
  state.generations.push(gen)
  write(state)
  _cloudUpsert(gen)
  return gen
}

export function updateGeneration(id, patch) {
  const state = read()
  const idx = state.generations.findIndex((g) => g.id === id)
  if (idx === -1) throw new Error('generation not found')
  const prev = state.generations[idx]
  const merged = {
    ...prev,
    ...patch,
    updated_at: new Date().toISOString(),
  }
  // 内容改了 → 标题没显式给 → 重新提取
  if (patch.content !== undefined && patch.title === undefined) {
    merged.title = prev.title || extractTitle(patch.content)
  }
  state.generations[idx] = merged
  write(state)
  _cloudUpsert(merged)
  return merged
}

/**
 * 标记一条 generation 为"已使用"（复制或下载时调用）
 * 幂等：已标记的不会再次更新时间戳
 */
export function markUsed(id) {
  const state = read()
  const idx = state.generations.findIndex((g) => g.id === id)
  if (idx === -1) return null
  if (state.generations[idx].used_at) return state.generations[idx]
  const updated = {
    ...state.generations[idx],
    used_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  state.generations[idx] = updated
  write(state)
  _cloudUpsert(updated)
  return updated
}

/**
 * 写入英文翻译结果（与中文 content 1:1 对照）
 */
export function setEnglishContent(id, englishContent, englishTitle) {
  return updateGeneration(id, {
    english_content: englishContent || '',
    english_title: englishTitle || extractTitle(englishContent || ''),
  })
}

export function deleteGeneration(id) {
  const state = read()
  state.generations = state.generations.filter((g) => g.id !== id)
  write(state)
  _cloudDelete(id)
}

// ── Cloud sync 层（仅在 syncUserId 存在时活跃） ──────────

function toCloudRow(gen) {
  return {
    id: gen.id,
    user_id: syncUserId,
    prompt: gen.prompt || '',
    calibrated_prompt: gen.calibrated_prompt || '',
    title: gen.title || '(未命名)',
    content: gen.content || '',
    english_title: gen.english_title || '',
    english_content: gen.english_content || '',
    model: gen.model || null,
    token_usage: gen.token_usage || null,
    calibration_usage: gen.calibration_usage || null,
    task_type: gen.task_type || {},
    industry_keywords: gen.industry_keywords || [],
    score: gen.score || null,
    used_at: gen.used_at || null,
    created_at: gen.created_at,
    updated_at: gen.updated_at,
  }
}

function fromCloudRow(row) {
  return {
    id: row.id,
    prompt: row.prompt || '',
    calibrated_prompt: row.calibrated_prompt || '',
    title: row.title || '(未命名)',
    content: row.content || '',
    english_title: row.english_title || '',
    english_content: row.english_content || '',
    model: row.model,
    token_usage: row.token_usage,
    calibration_usage: row.calibration_usage,
    task_type: row.task_type || {},
    industry_keywords: row.industry_keywords || [],
    score: row.score,
    used_at: row.used_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // created_by 不入云（按 user_id 关联），列表展示用本地缓存补
    created_by: CURRENT_USER,
  }
}

async function _cloudUpsert(gen) {
  if (!syncUserId) return
  const { error } = await supabase.from('generations').upsert(toCloudRow(gen))
  if (error) console.error('[generations] cloud upsert failed', error)
}

async function _cloudDelete(id) {
  if (!syncUserId) return
  const { error } = await supabase.from('generations').delete().eq('id', id)
  if (error) console.error('[generations] cloud delete failed', error)
}

/**
 * 设置当前同步上下文。auth 状态变化时调用。
 * - 登录：传 { userId, email }
 * - 登出：传 null 或 {}
 */
export function setSyncContext(ctx) {
  const wasLoggedIn = !!syncUserId
  if (!ctx || !ctx.userId) {
    syncUserId = null
    CURRENT_USER = '我'
    // 仅当原本登录、现在登出时清空本地缓存（避免同浏览器跨账号串数据）
    // 首次冷启动且未登录的情况下，不该清离线草稿
    if (wasLoggedIn) write({ ...DEFAULT_STATE })
    return
  }
  syncUserId = ctx.userId
  if (ctx.email) {
    CURRENT_USER = ctx.email.split('@')[0] || ctx.email
  }
}

/**
 * 登录后调用：把云端的 generations 拉下来合进本地。
 * 合并策略：本地有但云端没有 → 推到云端（迁移离线草稿）；
 *           双方都有 → 比较 updated_at，新的赢。
 */
export async function hydrateFromCloud() {
  if (!syncUserId) return
  const { data: cloudRows, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', syncUserId)
  if (error) {
    console.error('[generations] hydrate failed', error)
    return
  }

  const cloudById = new Map((cloudRows || []).map((r) => [r.id, fromCloudRow(r)]))
  const localItems = read().generations

  const merged = new Map(cloudById)
  const toUpload = []

  for (const local of localItems) {
    const cloud = cloudById.get(local.id)
    if (!cloud) {
      // 本地独有 → 离线草稿，要上传
      toUpload.push(local)
      merged.set(local.id, { ...local, created_by: CURRENT_USER })
      continue
    }
    const localTs = local.updated_at || local.created_at || ''
    const cloudTs = cloud.updated_at || cloud.created_at || ''
    if (localTs > cloudTs) {
      toUpload.push(local)
      merged.set(local.id, { ...local, created_by: CURRENT_USER })
    }
  }

  write({ generations: Array.from(merged.values()) })

  if (toUpload.length > 0) {
    const rows = toUpload.map(toCloudRow)
    const { error: upErr } = await supabase.from('generations').upsert(rows)
    if (upErr) console.error('[generations] batch upload failed', upErr)
  }
}

// ── helpers ──────────────────────────────────────────

function extractTitle(content) {
  if (!content) return '(未命名)'
  const first = (content.split('\n').find((l) => l.trim().length > 0) || '').trim()
  return cleanTitleText(first).slice(0, 60) || '(未命名)'
}

// 把首行可能带的 markdown 标记清掉，得到纯文本标题。
// 处理：# 标题、**加粗**、*斜体* / _斜体_、`代码`、[文本](url)
export function cleanTitleText(line) {
  if (!line) return ''
  let s = line.trim()
  s = s.replace(/^#+\s*/, '').replace(/\s+#+\s*$/, '')
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  s = s.replace(/`+([^`]+)`+/g, '$1')
  for (let i = 0; i < 2; i++) {
    s = s
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
  }
  return s.trim()
}
