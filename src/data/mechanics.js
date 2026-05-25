export const mechanicsScenes = [
  {
    id: 0,
    label: '起点',
    addedLine: '帮我写个推文',
    inputLines: [{ text: '帮我写个推文', kind: 'task' }],
    cloudBadges: ['咖啡店?', '行业?', '科技?', '生活?', '美食?', '采购?'],
    convergence: 5,
    samples: [
      { text: '#周末出游vlog# 今天去新开的咖啡店...', tag: '咖啡' },
      { text: '春日限定 · 新品上市，必囤！', tag: '电商' },
      { text: '90后的我，决定离开北上广', tag: '情感' },
      { text: '深度 | AI 大模型十大趋势分析', tag: '科技' },
      { text: '螺丝厂老板看了直呼内行...', tag: '行业' },
      { text: '生活就是要慢下来 ☕', tag: '生活' },
    ],
    note: '模型完全不知道你是谁、要写什么——只能从"推文"两字往各种方向猜，输出是一片散乱的可能性云',
  },
  {
    id: 1,
    label: '+ 角色',
    addedLine: '你是紧固件行业资深小编',
    inputLines: [
      { text: '帮我写个推文', kind: 'task' },
      { text: '你是紧固件行业资深小编', kind: 'role' },
    ],
    cloudBadges: ['行业新闻', '产品测评', '展会预告', '行业评论'],
    convergence: 28,
    samples: [
      { text: '紧固件行业新动态 · 本周 3 件大事', tag: '行业' },
      { text: '螺丝厂老板看了直呼内行 - 新品测评', tag: '行业' },
      { text: '行业风向 | 出海贸易壁垒下的破局', tag: '行业' },
      { text: '深度 · 紧固件展规模逆势上涨', tag: '行业' },
    ],
    note: '加角色 → 行业上下文被锁定，候选方向收敛到 4 个，但仍不知道写哪个话题、给谁看',
  },
  {
    id: 2,
    label: '+ 主题 + 读者',
    addedLine: '主题：第 16 届上海紧固件展预热\n读者：制造商市场负责人',
    inputLines: [
      { text: '帮我写个推文', kind: 'task' },
      { text: '你是紧固件行业资深小编', kind: 'role' },
      { text: '主题：第 16 届上海紧固件展预热', kind: 'context' },
      { text: '读者：制造商市场负责人', kind: 'context' },
    ],
    cloudBadges: ['展前预热稿', '采购视角稿'],
    convergence: 62,
    samples: [
      { text: '第 16 届上海紧固件展 · 制造商不可错过的 3 个信号', tag: '行业' },
      { text: '上海紧固件展 2026 预告 - 出海采购关键风向', tag: '行业' },
    ],
    note: '加主题 + 读者 → 内容方向锚定，候选只剩 2 个；但格式、字数、语气还会飘',
  },
  {
    id: 3,
    label: '+ 格式 + 禁用',
    addedLine: '标题 ≤ 22 字含 1 个数字\n800 字内分 3 段\n禁用"重磅、共襄盛举"',
    inputLines: [
      { text: '帮我写个推文', kind: 'task' },
      { text: '你是紧固件行业资深小编', kind: 'role' },
      { text: '主题：第 16 届上海紧固件展预热', kind: 'context' },
      { text: '读者：制造商市场负责人', kind: 'context' },
      { text: '标题 ≤ 22 字含 1 个数字', kind: 'format' },
      { text: '800 字内分 3 段', kind: 'format' },
      { text: '禁用"重磅、共襄盛举"', kind: 'constraint' },
    ],
    cloudBadges: ['唯一稳定输出'],
    convergence: 95,
    samples: [
      {
        text: '【去年那 1000 个海外买家，今年还会来吗？】\n\n（800 字 · 3 段 · 标题含数字 · 无禁用词）',
        tag: '✓ 可用',
      },
    ],
    note: '加格式 + 禁用 → 几乎收敛到唯一可用版本。模型不再"猜"，只是按你的交底执行',
  },
]

export const lineKindStyles = {
  task: { dot: 'bg-ink-700', label: '任务' },
  role: { dot: 'bg-amber-500', label: '角色' },
  context: { dot: 'bg-clay-500', label: '上下文' },
  format: { dot: 'bg-emerald-600', label: '格式' },
  constraint: { dot: 'bg-rose-500', label: '约束' },
}
