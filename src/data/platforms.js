// 平台约束预设：点击 chip 会把对应块插入到 Prompt 里
// marker 用 HTML 注释，Markdown 渲染时不显示，且可被正则精确识别用于"切换"
// 切勿手改 marker 文本，会破坏切换逻辑

export const platforms = [
  {
    id: 'xhs',
    name: '小红书',
    icon: '🌸',
    summary: '短句 + emoji + 痛点钩子',
    accent: 'bg-rose-500/15 text-rose-700 border-rose-400/40',
    accentActive: 'bg-rose-500 text-cream-50 border-rose-500',
    body: `## 平台约束 · 小红书
- 标题不超过 22 字，必含 1 个具体数字
- 正文 200-300 字
- 适量使用 emoji，每段 0-2 个，不要堆
- 短句分行，每行 ≤ 15 字，避免大段密文
- 第一段必须是"痛点钩子"或反差句
- 文末附 3 个 hashtag（可不带 # 号）
- 不用"yyds、绝绝子"等过时网络词`,
  },
  {
    id: 'wechat',
    name: '微信公众号',
    icon: '📰',
    summary: '三段式 + 加粗 + CTA',
    accent: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/40',
    accentActive: 'bg-emerald-600 text-cream-50 border-emerald-600',
    body: `## 平台约束 · 微信公众号
- 标题不超过 22 字（手机端两行折行限制），含一个具体数字
- 正文 600-1200 字
- 三段式结构：①导语（≤ 50 字点题）②主体（2-3 个核心要点，每点 1 段）③收尾（CTA）
- 段与段之间空行分割，每段 60-150 字
- 关键句用 **加粗** 标记
- 禁用词：重磅、蓄势待发、共襄盛举、干货满满、不容错过`,
  },
  {
    id: 'wechat-moments',
    name: '个人朋友圈',
    icon: '💬',
    summary: '80 字 + 1 钩子 + 1 CTA',
    accent: 'bg-amber-500/15 text-amber-800 border-amber-400/40',
    accentActive: 'bg-amber-500 text-cream-50 border-amber-500',
    body: `## 平台约束 · 个人朋友圈
- 全文 80-150 字
- 不要标题，第一行就是钩子（设问或一个具体数字）
- 中间 3 行竖排关键信息，每行只放一个信息点
- 结尾给 1 个明确动作（留言「+1」/ 私信 / 扫码）
- 最多 1-2 个 emoji，不要堆叠`,
  },
  {
    id: 'douyin',
    name: '抖音/视频号脚本',
    icon: '🎬',
    summary: '45 秒分镜表',
    accent: 'bg-violet-500/15 text-violet-700 border-violet-400/40',
    accentActive: 'bg-violet-500 text-cream-50 border-violet-500',
    body: `## 平台约束 · 抖音 / 视频号短视频脚本
- 总时长 30-60 秒
- 输出为分镜表（Markdown 表格）：| 时间 | 画面 | 字幕（≤14字） | 旁白（≤25字） |
- 前 3 秒必须是钩子（数字、反常识、悬念）
- 字幕必须能在静音下看懂主线
- 结尾 5 秒留 CTA（评论关键词 / 扫码 / 关注）
- 不要"震撼登场、不看后悔、错过等一年"等口号`,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    summary: '英文 · 短段 · 第三人称',
    accent: 'bg-sky-500/15 text-sky-700 border-sky-400/40',
    accentActive: 'bg-sky-600 text-cream-50 border-sky-600',
    body: `## Platform Constraints · LinkedIn
- Write in English
- 100-200 words total
- Short paragraphs (1-2 sentences each), separated by blank lines
- First line must be the hook (a specific number, a counter-intuitive claim, or a question)
- Use third-person framing; avoid "I think" / "I believe"
- End with a single clear CTA (link in comment / DM me / share your view)
- No emojis except 1 optional at the very end`,
  },
  {
    id: 'email',
    name: '邮件',
    icon: '✉️',
    summary: '主题 + 三段 + 单 CTA',
    accent: 'bg-indigo-500/15 text-indigo-700 border-indigo-400/40',
    accentActive: 'bg-indigo-600 text-cream-50 border-indigo-600',
    body: `## 平台约束 · 邮件
- 主题行 ≤ 60 字符，必含一个具体数字
- 正文 3 段：①钩子（具体痛点或数据）②价值（收件人能拿到什么）③单一 CTA（一个明确链接或回复路径）
- 不要 "Dear Sir/Madam"、"How are you"、"I hope this email finds you well" 等寒暄
- 全文 ≤ 200 字（中文）或 ≤ 180 词（英文）
- 签名行简洁，不要广告语`,
  },
]

// 用 HTML 注释做 marker，Markdown 渲染时不可见，且正则识别稳定
function markers(id) {
  return {
    open: `<!-- platform:${id} -->`,
    close: `<!-- /platform:${id} -->`,
  }
}

function blockFor(p) {
  const m = markers(p.id)
  return `${m.open}\n${p.body}\n${m.close}`
}

const blockRegexCache = new Map()
function blockRegex(id) {
  if (!blockRegexCache.has(id)) {
    blockRegexCache.set(
      id,
      new RegExp(
        `\\n*<!--\\s*platform:${id}\\s*-->[\\s\\S]*?<!--\\s*/platform:${id}\\s*-->\\n*`,
        'g',
      ),
    )
  }
  return blockRegexCache.get(id)
}

export function isPlatformApplied(prompt, id) {
  return blockRegex(id).test(prompt || '')
}

export function appliedPlatforms(prompt) {
  return platforms.filter((p) => isPlatformApplied(prompt, p.id)).map((p) => p.id)
}

export function togglePlatform(prompt, p) {
  const current = prompt || ''
  if (isPlatformApplied(current, p.id)) {
    // remove 块及其前后多余空行
    return current.replace(blockRegex(p.id), '\n\n').replace(/\n{3,}/g, '\n\n').trim()
  }
  // 追加到末尾，确保用一个空行隔开
  const separator = current.trim().length > 0 ? '\n\n' : ''
  return (current.trimEnd() + separator + blockFor(p)).trimStart()
}
