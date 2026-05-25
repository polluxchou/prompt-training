// 即时生成的历史存档（localStorage，仅本机）
// 未来用户系统接通后，这层会替换为 fetch('/api/generations/...')。

const KEY = 'gen-state-v1'

const DEFAULT_STATE = { generations: [] }

// 原型阶段没有真实账号体系；用一组 mock 团队成员让"团队排名"有数据可看
// 新生成的条目默认作者 = "我"；历史条目按 id 哈希分配到 mock 成员
export const MOCK_TEAM = ['张工', '李工', '王工', '陈工', '赵工']
export const CURRENT_USER = '我'

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

// ── CRUD ─────────────────────────────────────────────

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
  state.generations[idx] = {
    ...state.generations[idx],
    used_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  write(state)
  return state.generations[idx]
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
}

// ── helpers ──────────────────────────────────────────

function extractTitle(content) {
  if (!content) return '(未命名)'
  const first = (content.split('\n').find((l) => l.trim().length > 0) || '').trim()
  return first.replace(/^#+\s*/, '').slice(0, 60) || '(未命名)'
}
