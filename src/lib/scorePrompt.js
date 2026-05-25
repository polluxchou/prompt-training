// 提示词准确度评分（纯前端、确定性、不调 LLM）
//
// 权重：
//   industry        40%  · 行业相关性：用户行业标签 vs prompt 文本里的关键词重合
//   completeness    40%  · 提示词完整性：覆盖了多少"爆炸图"部件
//   typeMatch       20%  · 内容类型匹配度：选中的平台/受众关键词在 prompt 里是否被点到
//
// 每一项独立产出 0-100 子分，再加权得到总分。
// 子分 < 60 时会附一句"怎么改"的提示，未来可渲染到 UI 上。

import { taskTypeKeywords } from '../data/taskTypes.js'

export const SCORE_WEIGHTS = { industry: 0.4, completeness: 0.4, typeMatch: 0.2 }

// 完整性检测的 6 个部件（与 PromptAnatomy 一致）
const ANATOMY_PARTS = [
  { id: 'persona',     label: '角色',     patterns: [/你是|你扮演|身为|act as|you are|persona|身份/i] },
  { id: 'task',        label: '任务',     patterns: [/请|帮我|写一篇|生成|总结|分析|翻译|改写|起草|草拟|draft|write|summari[sz]e/i] },
  { id: 'context',     label: '上下文',   patterns: [/背景|场景|目标读者|针对|面向|context|audience|目的|因为|本次|本场/i] },
  { id: 'format',      label: '输出格式', patterns: [/格式|结构|分\s*\d+\s*段|json|markdown|列表|表格|字数|不超过|以.{0,4}开头|开篇|第\s*\d+\s*段/i] },
  { id: 'constraints', label: '约束',     patterns: [/不要|不得|避免|禁用|不允许|忌|严禁|don'?t|avoid|限制|仅|只|不少于|不多于/i] },
  { id: 'examples',    label: '示例',     patterns: [/例如|例子|示例|如下|参考下面|few[- ]?shot|举例|样例/i] },
]

// 计算一个关键词列表在文本里的命中比例（小写、去重、子串包含）
function hitRatio(text, keywords) {
  const t = (text || '').toLowerCase()
  const kws = Array.from(new Set((keywords || []).filter(Boolean).map((k) => k.toLowerCase())))
  if (kws.length === 0) return { ratio: 0, hits: [], misses: [], total: 0 }
  const hits = kws.filter((k) => t.includes(k))
  return {
    ratio: hits.length / kws.length,
    hits,
    misses: kws.filter((k) => !t.includes(k)),
    total: kws.length,
  }
}

// ── 子分 ─────────────────────────────────────────────

export function scoreIndustry(prompt, industryKeywords) {
  const kws = (industryKeywords || []).filter(Boolean)
  if (kws.length === 0) {
    return { score: 0, detail: '未设置行业标签', hits: [], misses: [], skipped: true }
  }
  const { ratio, hits, misses } = hitRatio(prompt, kws)
  // 命中 ≥ 30% 即视为相关性达标；线性映射到 100
  const score = Math.round(Math.min(1, ratio / 0.3) * 100)
  return {
    score,
    hits,
    misses,
    detail: score >= 60 ? '行业关键词命中良好' : `仅命中 ${hits.length}/${kws.length} 个行业关键词，建议在 prompt 中显式提到`,
  }
}

export function scoreCompleteness(prompt) {
  const text = prompt || ''
  const parts = ANATOMY_PARTS.map((p) => ({
    id: p.id,
    label: p.label,
    hit: p.patterns.some((re) => re.test(text)),
  }))
  const hitCount = parts.filter((p) => p.hit).length
  const score = Math.round((hitCount / ANATOMY_PARTS.length) * 100)
  const missingLabels = parts.filter((p) => !p.hit).map((p) => p.label)
  return {
    score,
    parts,
    detail:
      score >= 80
        ? '结构完整'
        : `缺少：${missingLabels.join(' / ') || '—'}`,
  }
}

export function scoreTypeMatch(prompt, taskType) {
  const kws = taskTypeKeywords(taskType || {})
  if (kws.length === 0) {
    return { score: 0, detail: '未选择任务类型', hits: [], misses: [], skipped: true }
  }
  const { ratio, hits, misses } = hitRatio(prompt, kws)
  // 平台/受众关键词只要命中 25% 就视作类型扣题；过严会让评分对短 prompt 不友好
  const score = Math.round(Math.min(1, ratio / 0.25) * 100)
  return {
    score,
    hits,
    misses,
    detail:
      score >= 60
        ? '类型扣题清晰'
        : `prompt 中未明显体现「${(taskType?.platform || '所选平台')}」或受众特征，建议显式提到`,
  }
}

// ── 总分 ─────────────────────────────────────────────

export function scorePrompt({ prompt, industryKeywords, taskType }) {
  const industry     = scoreIndustry(prompt, industryKeywords)
  const completeness = scoreCompleteness(prompt)
  const typeMatch    = scoreTypeMatch(prompt, taskType)
  const total = Math.round(
    industry.score     * SCORE_WEIGHTS.industry +
    completeness.score * SCORE_WEIGHTS.completeness +
    typeMatch.score    * SCORE_WEIGHTS.typeMatch
  )
  return {
    total,
    weights: SCORE_WEIGHTS,
    breakdown: { industry, completeness, typeMatch },
    grade: total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 55 ? 'C' : 'D',
  }
}
