// 两阶段提示词管线
//   Stage 1 · 校准：把"任务类型 + 行业 + 原始 prompt"丢给 DeepSeek，让它产出校准后的 prompt
//   Stage 2 · 生成：用校准后的 prompt + 任务类型上下文，再调 DeepSeek 产出最终内容
//
// 设计要点：
//   - 任务类型的所有条件（场景/平台/受众角色/区域/性别）必须显式传给 DeepSeek，不能只用作本地评分
//   - 两阶段都流式，便于 UI 实时展示
//   - 校准失败时降级：直接使用原始 prompt 进入 stage 2

import {
  describeTaskType,
  formatPlatformLimits,
  summarizeTaskType,
  SCENARIOS,
  PLATFORMS,
  AUDIENCE_ROLES,
  AUDIENCE_REGIONS,
  AUDIENCE_GENDERS,
} from '../data/taskTypes.js'

// 把任务类型铺成清晰的 key-value 块，给 LLM 当背景看
export function buildTaskContextBlock(taskType = {}, industryKeywords = []) {
  const lines = []
  const summary = summarizeTaskType(taskType)
  if (summary && summary !== '尚未配置任务类型') {
    lines.push(`【任务一句话】${summary}`)
  }
  const scen = SCENARIOS.find((x) => x.id === taskType.scenario)
  const plat = PLATFORMS.find((x) => x.id === taskType.platform)
  const role = AUDIENCE_ROLES.find((x) => x.id === taskType.role)
  const reg  = AUDIENCE_REGIONS.find((x) => x.id === taskType.region)
  const gen  = AUDIENCE_GENDERS.find((x) => x.id === taskType.gender)

  const kv = []
  if (scen?.id) kv.push(`应用场景: ${scen.label}`)
  if (plat) kv.push(`平台: ${plat.label}${plat.hint ? `（${plat.hint}）` : ''}`)
  if (role) kv.push(`受众角色: ${role.label}`)
  if (reg)  kv.push(`受众区域: ${reg.label}`)
  if (gen?.id) kv.push(`受众性别: ${gen.label}`)
  if (industryKeywords?.length) kv.push(`行业关键词: ${industryKeywords.join(' / ')}`)

  if (kv.length) lines.push(kv.map((s) => `- ${s}`).join('\n'))

  // 平台字数硬限制：单独成块、最高优先级、写在最醒目位置
  const limits = formatPlatformLimits(taskType.platform)
  if (limits) {
    const header = limits.hard
      ? '⚠️【平台硬性字数限制 · 必须严格遵守，超出即视为不合格】'
      : '【平台推荐字数范围 · 尽量贴近】'
    lines.push(
      `${header}\n${limits.lines.map((s) => `- ${s}`).join('\n')}\n` +
      (limits.hard
        ? `生成完后请自检：标题与正文是否在以上字数内。若超出，必须删减、压缩、改写后再输出，不允许返回超长结果。`
        : ''),
    )
  }

  const tags = describeTaskType(taskType)
  if (tags) lines.push(`【聚合标签】${tags}`)

  return lines.join('\n\n')
}

// ── Stage 1 · 校准 ────────────────────────────────────

export const CALIBRATION_SYSTEM = `你是一位资深提示词工程师，专门帮非技术用户把"草稿提示词"改写成"工程级提示词"。

用户会提交：① 任务类型与行业背景  ② 原始提示词。请基于①对②做"校准"：
- 补全可能缺失的部件：角色 / 任务动词 / 上下文 / 输出格式 / 约束 / 必要示例
- 让平台特性（字数、版式、文风、emoji 用法等）和受众特征（语种、专业度、关注点）显式化
- 行业关键词要自然嵌入，避免堆砌
- 严格保留用户原意，不要替他增加新的业务诉求或夸大数据
- 不允许寒暄、解释、元评论、Markdown 代码块包裹

【关于字数限制 · 极重要】
- 若①中给出"平台硬性字数限制"，校准后的提示词必须把这些限制原样写入"输出格式 / 约束"段，并使用"标题不超过 X 字、正文不超过 Y 字"这种可被模型严格遵守的措辞
- 同时追加一句类似"如有超出，请删减后重新组织语言，禁止返回超长内容"
- 即使原始提示词没提字数，校准后也必须把平台限制补进去——这是不可省略的硬约束

输出格式：纯文本，只包含"校准后的完整提示词"本身。`

export function buildCalibrationMessages({ rawPrompt, taskType, industryKeywords }) {
  const ctx = buildTaskContextBlock(taskType, industryKeywords)
  return [
    { role: 'system', content: CALIBRATION_SYSTEM },
    {
      role: 'user',
      content:
        `${ctx}\n\n【原始提示词】\n${rawPrompt.trim()}\n\n请输出校准后的提示词全文。`,
    },
  ]
}

// ── Stage 2 · 生成 ────────────────────────────────────

export function buildGenerationMessages({
  calibratedPrompt,
  taskType,
  industryKeywords,
  baseSystemPrompt,
}) {
  const ctx = buildTaskContextBlock(taskType, industryKeywords)
  const limits = formatPlatformLimits(taskType?.platform)

  // 把字数硬限制单独写在 prompt 尾部"FINAL CHECK"段，比埋在中段更不容易被忽略
  const finalCheck =
    limits && limits.hard
      ? `\n\n【输出前最终自检 · 必须执行】\n${limits.lines.map((s) => `- ${s}`).join('\n')}\n若任一项不达标，请删减压缩后再输出，禁止返回超长结果。`
      : ''

  const userContent = ctx
    ? `${ctx}\n\n【请按以下提示词执行】\n${calibratedPrompt.trim()}${finalCheck}`
    : `${calibratedPrompt.trim()}${finalCheck}`

  return [
    { role: 'system', content: baseSystemPrompt },
    { role: 'user', content: userContent },
  ]
}

// ── 翻译（中→英，严格 1:1） ───────────────────────────

export const TRANSLATION_SYSTEM = `You are a professional translator working on B2B industrial marketing content (fasteners, manufacturing, trade shows).

Translate the user's Chinese text into English with these STRICT rules:
1. Do NOT add any new information, sentences, marketing copy, or "improvements". Faithful 1:1 mapping only.
2. Do NOT skip, summarize, or merge any content. Every Chinese sentence/list item must have an English counterpart.
3. PRESERVE the markdown structure exactly: heading levels (#, ##, ###), lists (-, 1.), bold (**), italics (*), horizontal rules (---), blockquotes (>), code fences.
4. Use natural professional English appropriate for the industry. Render Chinese industry terms with their standard English equivalents (e.g. 紧固件 → fasteners, 经销商 → distributor, 采购商 → buyer).
5. Keep numbers, dates, units, and proper nouns unchanged when possible.
6. Output ONLY the English translation. Do NOT include the original Chinese, do NOT add explanations, prefaces, or "Translation:" labels.`

export function buildTranslationMessages({ chineseContent, taskType, industryKeywords }) {
  const ctx = buildTaskContextBlock(taskType, industryKeywords)
  const contextNote = ctx
    ? `Context (background only — do not translate this block; use it to pick the right terminology):\n${ctx}\n\n`
    : ''
  return [
    { role: 'system', content: TRANSLATION_SYSTEM },
    {
      role: 'user',
      content:
        `${contextNote}Translate the following Chinese text into English, following all the strict rules:\n\n${chineseContent.trim()}`,
    },
  ]
}

// ── 合并两阶段 token 用量 ─────────────────────────────

export function addUsage(a, b) {
  if (!a && !b) return null
  const x = a || {}
  const y = b || {}
  return {
    prompt_tokens:     (x.prompt_tokens     || 0) + (y.prompt_tokens     || 0),
    completion_tokens: (x.completion_tokens || 0) + (y.completion_tokens || 0),
    total_tokens:      (x.total_tokens      || 0) + (y.total_tokens      || 0),
  }
}
