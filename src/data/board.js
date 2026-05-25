// 需求管理白板 · 第一块：网站菜单 + 需求目录
//
// 华网正式需求三大块：
//   ① 内容生成容器（即时 + 定时 + 历史回看/编辑/删除）
//   ② 用户系统与用量（邮箱密码登录、共享公司 DeepSeek 余量、按天/按任务类型用量统计、排行榜、提示词打分）
//   ③ 提示词库（用户自有，可增删改查）
//
// 提示词打分权重：行业相关性 40% · 提示词完整性 40% · 内容类型匹配度 20%
//
// status: done | partial | planned

export const boardMenu = [
  // ─────────────────────────────────────────────────────────
  {
    id: 'content-gen',
    label: '① 内容生成',
    icon: '',
    path: '/generate · /scheduled-content',
    summary: '用户按不同类型提示词生成内容，并回看 / 编辑 / 删除历史',
    children: [
      {
        id: 'content-gen.on-demand',
        label: '即时生成（按提示词类型）',
        path: '/generate',
        requirements: [
          { id: 'r-gen-on-1', title: '独立"即时生成"入口', status: 'done' },
          { id: 'r-gen-on-2', title: '用户填参 → 调 LLM → 立即返回（流式）', status: 'done' },
          { id: 'r-gen-on-3', title: '任务类型 = 平台 × 受众（角色/区域/性别）选择器', status: 'done' },
          { id: 'r-gen-on-4', title: '生成前实时显示评分面板', status: 'done' },
          { id: 'r-gen-on-5', title: '生成完成自动存档到历史', status: 'done' },
        ],
      },
      {
        id: 'content-gen.scheduled',
        label: '定时生成',
        path: '/scheduled-content',
        requirements: [
          { id: 'r-gen-sch-1', title: 'schedule 列表 / 新建 / 启停 / 删除', status: 'done' },
          { id: 'r-gen-sch-2', title: '到点自动跑（后端 cron worker）', status: 'planned', hint: '当前 next_run_at 只在前端推演，无真实触发' },
        ],
      },
      {
        id: 'content-gen.history',
        label: '已生成内容的回看与管理',
        path: '/generate',
        requirements: [
          { id: 'r-gen-his-1', title: '历史列表 + 详情查看', status: 'done' },
          { id: 'r-gen-his-2', title: '编辑单篇内容（标题 + 正文）', status: 'done', hint: '/generate/:id 内联编辑' },
          { id: 'r-gen-his-3', title: '删除单篇内容', status: 'done' },
          { id: 'r-gen-his-4', title: '一键复制正文', status: 'done' },
          { id: 'r-gen-his-5', title: '导出 Markdown / PDF', status: 'done', hint: '/generate/:id 详情页已接 downloadMd / downloadPdf' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'user-system',
    label: '② 用户系统与用量',
    icon: '👤',
    summary: '邮箱密码登录 · 共享公司 DeepSeek 余量 · 按天/任务类型计量 · 全公司排行榜 · 提示词打分',
    children: [
      {
        id: 'user-system.auth',
        label: '登录与账号',
        requirements: [
          { id: 'r-usr-auth-1', title: '邮箱 + 密码注册 / 登录', status: 'done', hint: '/register · /login · /verify-email 已接 Supabase Auth' },
          { id: 'r-usr-auth-2', title: 'session / token 维护', status: 'done', hint: 'useAuth.jsx + Supabase session 持久化' },
          { id: 'r-usr-auth-3', title: '角色字段：admin / group manager / user', status: 'planned', hint: 'profiles 表当前仅 id/email/invite_code/invited_by/invited_count，无 role' },
          { id: 'r-usr-auth-4', title: '邀请码注册 + 邀请关系链', status: 'done', hint: 'profiles.invite_code + invitations 表 · 注册需填邀请码' },
          { id: 'r-usr-auth-5', title: '个人中心（/profile）', status: 'done' },
        ],
      },
      {
        id: 'user-system.quota',
        label: '共享 API 余量',
        requirements: [
          { id: 'r-usr-q-1', title: '后端集中持有公司 DeepSeek key，用户不再自填', status: 'done', hint: 'server/index.js 通过 .env 持 key，前端设置抽屉已不再录入' },
          { id: 'r-usr-q-2', title: '暂不设单人调用上限', status: 'done', hint: '后端仅按 IP 做每分钟限流，无 per-user 限额' },
        ],
      },
      {
        id: 'user-system.usage',
        label: '用量统计',
        requirements: [
          { id: 'r-usr-u-1', title: '按"天"维度统计调用次数 / token 数', status: 'planned' },
          { id: 'r-usr-u-2', title: '按"任务类型"统计调用次数', status: 'planned' },
          { id: 'r-usr-u-3', title: '全公司用量排行榜', status: 'planned' },
        ],
      },
      {
        id: 'user-system.score',
        label: '提示词准确度评分',
        requirements: [
          { id: 'r-usr-s-1', title: '行业相关性评分（权重 40% · 标签 vs 提示词（Prompt）关键词重合）', status: 'done' },
          { id: 'r-usr-s-2', title: '提示词完整性评分（权重 40% · 角色/任务/上下文/格式/约束/示例 命中数）', status: 'done' },
          { id: 'r-usr-s-3', title: '内容类型匹配度评分（权重 20% · 任务类型关键词命中）', status: 'done' },
          { id: 'r-usr-s-4', title: '综合分组件：可视化展示在生成入口 + 历史详情', status: 'done', hint: 'PromptScoreCard 已接入 /generate 与 /generate/:id' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'prompt-lib',
    label: '③ 提示词库',
    icon: '📚',
    summary: '用户自己的提示词增删改查；课件模板库作为只读公共库共存',
    children: [
      {
        id: 'prompt-lib.personal',
        label: '我的提示词',
        requirements: [
          { id: 'r-lib-p-1', title: '新增 / 编辑 / 删除自己的提示词', status: 'planned' },
          { id: 'r-lib-p-2', title: '按"任务类型"分类与筛选', status: 'planned' },
          { id: 'r-lib-p-3', title: '从历史生成"另存为我的提示词"', status: 'planned' },
          { id: 'r-lib-p-4', title: '生成入口可直接选用我的提示词', status: 'planned' },
        ],
      },
      {
        id: 'prompt-lib.public',
        label: '课件模板库（只读）',
        anchor: '#templates',
        requirements: [
          { id: 'r-lib-pub-1', title: '官方课件模板浏览 + 一键复制', status: 'done' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'training',
    label: '提示词训练课件',
    icon: '',
    path: '/',
    summary: '附加资产 · 不属于产品三大需求，仅用于内部学习',
    children: [
      {
        id: 'training.course',
        label: '原理 / 结构 / 12 模块 / 风格 / 练习',
        requirements: [
          { id: 'r-tr-1', title: '六大教学板块单页浏览', status: 'done' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'admin',
    label: '管理白板',
    icon: '🗂️',
    path: '/admin/board',
    summary: '内部需求 / 字段 / 用户数据管理面板',
    children: [
      {
        id: 'admin.board.menu',
        label: '① 网站菜单与需求目录',
        path: '/admin/board',
        requirements: [
          { id: 'r-adm-m-1', title: '菜单树 + 需求清单 + 状态筛选', status: 'done' },
        ],
      },
      {
        id: 'admin.board.fields',
        label: '② 现有字段一览',
        requirements: [
          { id: 'r-adm-f-1', title: 'schedule / article / user / usage 实体字段表', status: 'planned' },
        ],
      },
      {
        id: 'admin.board.users',
        label: '③ 用户数据',
        requirements: [
          { id: 'r-adm-u-1', title: '用户列表 / 角色 / 用量 / 评分均值', status: 'planned' },
        ],
      },
      {
        id: 'admin.auth',
        label: '权限守卫',
        requirements: [
          { id: 'r-adm-a-1', title: '仅 admin / group manager 可见', status: 'planned' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  {
    id: 'settings',
    label: 'AI 配置',
    icon: '⚙️',
    path: '(齿轮抽屉)',
    summary: '后端集中化后，此抽屉会缩为模型偏好（温度 / 默认模型）',
    children: [
      {
        id: 'settings.drawer',
        label: '配置抽屉',
        requirements: [
          { id: 'r-set-1', title: '默认模型与温度选择', status: 'done' },
          { id: 'r-set-2', title: '本地填入 API key（过渡态）', status: 'done', hint: '已迁移至后端代理，前端不再录入 key' },
          { id: 'r-set-3', title: '多 provider 支持（OpenAI / Anthropic 等）', status: 'planned' },
        ],
      },
    ],
  },
]

// 颜色相关 class 都写成字面字符串，避免 Tailwind JIT 因动态拼接而漏掉
export const STATUS_META = {
  done: {
    label: '已完成',
    dot: '●',
    badge: 'bg-emerald-500/15 text-emerald-700',
    pillActive: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
    countPill: 'bg-emerald-500/15 text-emerald-700',
  },
  partial: {
    label: '部分',
    dot: '◐',
    badge: 'bg-amber-500/15 text-amber-800',
    pillActive: 'border-amber-500/40 bg-amber-500/10 text-amber-800',
    countPill: 'bg-amber-500/15 text-amber-800',
  },
  planned: {
    label: '计划中',
    dot: '○',
    badge: 'bg-sky-500/15 text-sky-700',
    pillActive: 'border-sky-500/40 bg-sky-500/10 text-sky-700',
    countPill: 'bg-sky-500/15 text-sky-700',
  },
}

export function flattenRequirements(menu = boardMenu) {
  const out = []
  const walk = (node, path) => {
    const here = [...path, node.label]
    if (node.requirements) {
      for (const r of node.requirements) out.push({ ...r, path: here, nodeId: node.id })
    }
    if (node.children) for (const c of node.children) walk(c, here)
  }
  for (const m of menu) walk(m, [])
  return out
}

export function countByStatus(menu = boardMenu) {
  const counts = { done: 0, partial: 0, planned: 0 }
  for (const r of flattenRequirements(menu)) counts[r.status] = (counts[r.status] || 0) + 1
  return counts
}
