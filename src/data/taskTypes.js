// 任务类型 = 应用场景 × 平台 × 受众（角色 + 区域 + 性别可选）
// 这里的常量会被：① 即时生成入口的选择器 ② 用量按类型聚合 ③ 评分的"类型匹配度"项 共用

// 应用场景：用户真正要解决的事，放在最前面作为"第一优先级"
export const SCENARIOS = [
  { id: '',                   label: '通用 / 自定义', icon: '·',  keywords: [] },
  { id: 'expo-warmup',        label: '展会预热',   icon: '🎪', keywords: ['展会', '预热', '展位', 'booth', 'expo', '邀请', '抢先', '亮相'] },
  { id: 'panel-notes',        label: '座谈会纪要', icon: '🗒', keywords: ['座谈', '纪要', '议题', '决议', '记录', 'panel', '会议'] },
  { id: 'exhibitor-recruit',  label: '招展邮件',   icon: '✉️', keywords: ['招展', '招募', '参展', '展商', 'exhibitor', '诚邀'] },
  { id: 'inquiry-followup',   label: '询盘沟通',   icon: '💬', keywords: ['询盘', '报价', '回复', 'inquiry', 'rfq', 'quote', 'lead'] },
]

// 每个场景对应一组合理的「平台 + 受众」预设
// 用户一旦选中场景，就不需要再纠结这些 ——「通用」时才回到完全手动模式
export const SCENARIO_PRESETS = {
  'expo-warmup':       { platform: 'wechat-article', role: 'buyer',    region: 'cn', gender: '' },
  'panel-notes':       { platform: 'meeting',        role: 'buyer',    region: 'cn', gender: '' },
  'exhibitor-recruit': { platform: 'email',          role: 'producer', region: 'eu', gender: '' },
  'inquiry-followup':  { platform: 'email',          role: 'buyer',    region: 'eu', gender: '' },
}

// 平台硬性字数限制（含 emoji 和标点 / 中文按 1 字计算）
// 取自各平台公开发布规则 + 实战阅读舒适区：
//   - 微博：单条 140 字
//   - LinkedIn Article：标题 150、正文阅读舒适 1500-3000
//   - LinkedIn Post：单条上限 3000，实战 300 内最佳
//   - 微信公众号：标题 64、正文 800-1500 是阅读舒适区
//   - 小红书图文：标题 20、正文 1000
//   - 邮件：subject 60-70（防止被裁）；正文无上限
//   - SMS / IM：SMS 70 字一段；IM 1-3 句
//   - 会议总结：无硬限
// title === null  : 该平台无独立标题字段
// hard === true   : 超出即视为不合格（平台机制会截断 / 拒发 / 阅读体验崩塌）
// sweet           : 推荐"最佳长度"，会作为辅助提示，但 hard 上限仍是 body
export const PLATFORMS = [
  {
    id: 'weibo',
    label: '新浪微博',
    icon: '📱',
    hint: '140 字感、话题标签 #...#',
    keywords: ['微博', 'weibo', '话题', '#', '热搜', '转发'],
    limits: { title: null, body: 140, hard: true },
  },
  {
    id: 'linkedin-article',
    label: '领英文章',
    icon: '📰',
    hint: '长文 1500-3000 字，多为英文',
    keywords: ['linkedin', 'article', '长文', 'english', '英文'],
    limits: { title: 150, body: 3000, hard: false },
  },
  {
    id: 'linkedin-post',
    label: '领英动态',
    icon: '✏️',
    hint: '300 字内，个人视角',
    keywords: ['linkedin', 'post', '动态', 'feed'],
    limits: { title: null, body: 3000, sweet: 300, hard: true },
  },
  {
    id: 'wechat-article',
    label: '微信公众号推文',
    icon: '💬',
    hint: '800-1500 字，开篇抓人，配图占位',
    keywords: ['公众号', '推文', '微信', '阅读', '配图', '标题'],
    limits: { title: 64, body: 1500, sweet: 1200, hard: true },
  },
  {
    id: 'xhs',
    label: '小红书图文',
    icon: '📔',
    hint: '标题 ≤20 字、正文 ≤1000 字、emoji + 标签',
    keywords: ['小红书', '种草', '笔记', '图文', 'emoji', '标签'],
    limits: { title: 20, body: 1000, hard: true },
  },
  {
    id: 'email',
    label: '邮件',
    icon: '✉️',
    hint: '主题行 + 正文 + CTA，可中英',
    keywords: ['邮件', 'email', 'subject', 'dear', '正文', '签名'],
    limits: { title: 60, body: null, hard: true },
  },
  {
    id: 'im',
    label: 'Whatsapp / 短信 / Telegram 消息',
    icon: '💬',
    hint: '1-3 句、口语化',
    keywords: ['whatsapp', '短信', 'telegram', 'sms', '消息', '口语'],
    limits: { title: null, body: 140, sweet: 70, hard: true },
  },
  {
    id: 'meeting',
    label: '会议总结',
    icon: '📋',
    hint: '结构化纪要，决议 + 负责人 + 截止时间',
    keywords: ['会议', '纪要', '决议', '负责人', '截止', 'action item'],
    limits: { title: null, body: null, hard: false },
  },
]

// 格式化平台限制为"给 LLM 看的硬约束行 + 人类可读 hint"
export function formatPlatformLimits(platformId) {
  const p = PLATFORMS.find((x) => x.id === platformId)
  if (!p?.limits) return null
  const { title, body, hard, sweet } = p.limits
  const lines = []
  if (title) lines.push(`标题（含 emoji 和标点）≤ ${title} 字`)
  if (body) {
    if (sweet) lines.push(`正文 ≤ ${body} 字（${sweet} 字内最佳）`)
    else lines.push(`正文（含 emoji 和标点）≤ ${body} 字`)
  }
  if (!lines.length) return null
  return { lines, hard: Boolean(hard), platform: p.label }
}

export const AUDIENCE_ROLES = [
  { id: 'buyer',       label: '采购商', keywords: ['采购', 'buyer', '采购商', 'sourcing'] },
  { id: 'distributor', label: '经销商', keywords: ['经销', '代理', 'distributor', 'dealer'] },
  { id: 'producer',    label: '生产商', keywords: ['生产', '工厂', 'manufacturer', 'producer', 'factory'] },
]

export const AUDIENCE_REGIONS = [
  { id: 'cn',   label: '国内',         tier: 'domestic', keywords: ['国内', '中国', 'china', 'domestic'] },
  { id: 'asia', label: '海外 · 亚洲',   tier: 'overseas', keywords: ['亚洲', 'asia', '日本', '韩国', '东南亚'] },
  { id: 'eu',   label: '海外 · 欧洲',   tier: 'overseas', keywords: ['欧洲', 'europe', '德国', '法国', '英国', '意大利'] },
  { id: 'af',   label: '海外 · 非洲',   tier: 'overseas', keywords: ['非洲', 'africa', '南非', '埃及', '尼日利亚'] },
  { id: 'oc',   label: '海外 · 大洋洲', tier: 'overseas', keywords: ['大洋洲', 'oceania', '澳大利亚', '澳洲', '新西兰'] },
  { id: 'na',   label: '海外 · 北美洲', tier: 'overseas', keywords: ['北美', 'america', '美国', '加拿大', 'usa'] },
]

export const AUDIENCE_GENDERS = [
  { id: '',       label: '不区分', keywords: [] },
  { id: 'male',   label: '男',     keywords: ['男', 'male', '先生'] },
  { id: 'female', label: '女',     keywords: ['女', 'female', '女士'] },
]

// 把一个任务组合压成一个字符串 id，方便用量聚合的 group-by 维度
export function taskTypeKey({ scenario, platform, role, region, gender }) {
  return [scenario || '_', platform || '_', role || '_', region || '_', gender || '_'].join(':')
}

export function describeTaskType({ scenario, platform, role, region, gender }) {
  const s = SCENARIOS.find((x) => x.id === scenario)
  const p = PLATFORMS.find((x) => x.id === platform)
  const r = AUDIENCE_ROLES.find((x) => x.id === role)
  const g = AUDIENCE_REGIONS.find((x) => x.id === region)
  const x = AUDIENCE_GENDERS.find((y) => y.id === gender)
  const parts = [s?.id ? s.label : null, p?.label, r?.label, g?.label, x?.id ? x.label : null].filter(Boolean)
  return parts.join(' · ')
}

// 把任务类型压成一句自然语言摘要，用于折叠态展示
// 例：「这是一条用于「展会预热」的微博，发布在新浪微博、定位为「国内」采购商」
//     「这是一条发布在新浪微博，定位为「国内」采购商的微博」（未指定场景时）
const PLATFORM_NARRATIVE = {
  'weibo':            { article: '一条', verb: '发布在', place: '新浪微博',   noun: '微博' },
  'linkedin-article': { article: '一篇', verb: '发布在', place: '领英',       noun: '文章' },
  'linkedin-post':    { article: '一条', verb: '发布在', place: '领英',       noun: '动态' },
  'wechat-article':   { article: '一篇', verb: '发布在', place: '微信公众号', noun: '推文' },
  'xhs':              { article: '一篇', verb: '发布在', place: '小红书',     noun: '图文' },
  'email':            { article: '一封', verb: '发送给', place: null,         noun: '邮件' },
  'im':               { article: '一条', verb: '发送给', place: null,         noun: '即时消息' },
  'meeting':          { article: '一份', verb: '面向',   place: null,         noun: '会议总结' },
}

export function summarizeTaskType({ scenario, platform, role, region, gender }) {
  const n = PLATFORM_NARRATIVE[platform]
  if (!n) return '尚未配置任务类型'

  const r = AUDIENCE_ROLES.find((x) => x.id === role)
  const reg = AUDIENCE_REGIONS.find((x) => x.id === region)
  const gen = AUDIENCE_GENDERS.find((x) => x.id === gender)
  const scen = SCENARIOS.find((x) => x.id === scenario)

  const tags = []
  if (gen?.id) tags.push(`「${gen.label}」`)
  if (reg) tags.push(`「${reg.label}」`)
  const audience = tags.join('') + (r?.label || '')

  // 有场景：把场景前置成主名词修饰，更直观
  if (scen?.id) {
    const head = `这是${n.article}用于「${scen.label}」的${n.noun}`
    const tail = []
    if (n.place) tail.push(`${n.verb}${n.place}`)
    if (audience) tail.push(n.place ? `定位为${audience}` : `${n.verb}${audience}`)
    return tail.length ? `${head}，${tail.join('、')}` : head
  }

  // 无场景：保留原有句式
  if (n.place) {
    const audiencePart = audience ? `，定位为${audience}` : ''
    return `这是${n.article}${n.verb}${n.place}${audiencePart}的${n.noun}`
  }
  return `这是${n.article}${n.verb}${audience || '不特定受众'}的${n.noun}`
}

// 给定一组选择，返回该任务类型期望命中的关键词集合（评分的"类型匹配度"项要用）
export function taskTypeKeywords({ scenario, platform, role, region, gender }) {
  const buckets = [
    SCENARIOS.find((x) => x.id === scenario)?.keywords || [],
    PLATFORMS.find((x) => x.id === platform)?.keywords || [],
    AUDIENCE_ROLES.find((x) => x.id === role)?.keywords || [],
    AUDIENCE_REGIONS.find((x) => x.id === region)?.keywords || [],
    AUDIENCE_GENDERS.find((x) => x.id === gender)?.keywords || [],
  ]
  return Array.from(new Set(buckets.flat().map((k) => k.toLowerCase())))
}
