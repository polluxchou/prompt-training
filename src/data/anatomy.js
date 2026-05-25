// 8 类提示词成分，每类一组配色 + 通用解释 + 类似写法
// 颜色用静态字符串写死，避免 Tailwind JIT 漏扫
export const categories = {
  role: {
    label: '角色 Persona',
    short: '角色',
    icon: '🎭',
    bg: 'bg-amber-50',
    bgSelected: 'bg-amber-100',
    border: 'border-amber-400/70',
    borderSelected: 'border-amber-500',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/15 text-amber-800',
    ring: 'ring-amber-400/40',
    whatItDoes:
      '给模型设定身份和经验背书。模型会自动匹配该身份的语气、判断尺度和专业深度——"资深"两个字往往比堆形容词更管用。',
    similarExamples: [
      '你是一位有 10 年经验的资深前端工程师，擅长 React 性能优化。',
      '假设你是 36氪资深行业记者，曾覆盖供应链、贸易摩擦类报道。',
      '请以一位 B2B 展会海外招商总监的身份回答下面的问题。',
    ],
  },
  context: {
    label: '上下文 Context',
    short: '上下文',
    icon: '🗺️',
    bg: 'bg-sky-50',
    bgSelected: 'bg-sky-100',
    border: 'border-sky-400/70',
    borderSelected: 'border-sky-500',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
    pill: 'bg-sky-500/15 text-sky-800',
    ring: 'ring-sky-400/40',
    whatItDoes:
      '把"为什么做"和"对方是谁"交代清楚。模型不知道你的同事、客户、读者画像，上下文越具体，输出越能踩到你的实际工作场景。',
    similarExamples: [
      '我们公众号读者主要是国内制造商市场负责人，反感套话与堆形容词。',
      '客户是德国一级紧固件分销商，去年参展但今年观望，对接人 Lukas (CEO)。',
      '本次报告将提交给董事会，重点关注现金流而非营收。',
    ],
  },
  task: {
    label: '任务 Task',
    short: '任务',
    icon: '🧭',
    bg: 'bg-orange-50',
    bgSelected: 'bg-orange-100',
    border: 'border-orange-400/70',
    borderSelected: 'border-orange-500',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
    pill: 'bg-orange-500/15 text-orange-800',
    ring: 'ring-orange-400/40',
    whatItDoes:
      '一句话讲清"动词 + 名词 + 目标"。一个提示词（Prompt）只交付一个核心任务——把"分析、生成、改写、对比"四类动词当一类，避免把多件事塞进一段。',
    similarExamples: [
      '请把下面的会议录音转写整理成结构化纪要。',
      '把这条英文行业资讯改写成 600 字的中文公众号短稿。',
      '为这家参展商生成一份 30 分钟的专访提纲。',
    ],
  },
  input: {
    label: '输入材料 Input',
    short: '输入',
    icon: '📥',
    bg: 'bg-violet-50',
    bgSelected: 'bg-violet-100',
    border: 'border-violet-400/70',
    borderSelected: 'border-violet-500',
    text: 'text-violet-800',
    dot: 'bg-violet-500',
    pill: 'bg-violet-500/15 text-violet-800',
    ring: 'ring-violet-400/40',
    whatItDoes:
      '把要处理的原始素材塞进提示词（Prompt）——录音转写、新闻原文、客户来邮等。用 """ 或 ``` 把它和"指令"明确分开，模型才不会把素材当成指令的一部分。',
    similarExamples: [
      '英文原文：\n"""\n{{粘贴原文}}\n"""',
      '客户来邮：\n```\n{{粘贴来邮}}\n```',
      '会议录音转写（原文带"啊嗯然后"等口语词）：\n"""\n{{粘贴转写}}\n"""',
    ],
  },
  format: {
    label: '输出格式 Format',
    short: '格式',
    icon: '📐',
    bg: 'bg-emerald-50',
    bgSelected: 'bg-emerald-100',
    border: 'border-emerald-500/70',
    borderSelected: 'border-emerald-600',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
    pill: 'bg-emerald-500/15 text-emerald-800',
    ring: 'ring-emerald-400/40',
    whatItDoes:
      '指定输出的"形状"——表格 / JSON / Markdown / 分段结构。这一步替未来的你（或下游程序）省下"二次加工"的时间，是提示词（Prompt）里 ROI 最高的一段。',
    similarExamples: [
      '严格按以下 JSON 输出，不要其他任何内容：\n{ "title": "", "summary": "" }',
      '## 标题\n**导语**（80字内）\n**正文**（3段）\n**信心评级**：高/中/低',
      '输出表格：| 维度 | 方案A | 方案B |',
    ],
  },
  constraint: {
    label: '约束 Constraint',
    short: '约束',
    icon: '🚧',
    bg: 'bg-rose-50',
    bgSelected: 'bg-rose-100',
    border: 'border-rose-400/70',
    borderSelected: 'border-rose-500',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
    pill: 'bg-rose-500/15 text-rose-800',
    ring: 'ring-rose-400/40',
    whatItDoes:
      '"不要做什么"往往比"要做什么"更能锁定输出。字数上限、禁用词、保留数字、不要寒暄——每条约束都是收敛可能性的一刀。',
    similarExamples: [
      '全文不超过 600 字；禁用词：重磅、蓄势待发、共襄盛举。',
      '不要寒暄、不要重复我的问题、不要用"作为 AI"开场。',
      '数字一律保留原文（$180M、30%、Q3 2027），不要换算。',
    ],
  },
  example: {
    label: '示例 Few-shot',
    short: '示例',
    icon: '🪞',
    bg: 'bg-indigo-50',
    bgSelected: 'bg-indigo-100',
    border: 'border-indigo-400/70',
    borderSelected: 'border-indigo-500',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
    pill: 'bg-indigo-500/15 text-indigo-800',
    ring: 'ring-indigo-400/40',
    whatItDoes:
      '1-3 个高质量样例胜过千字解释——尤其在风格和格式上。如果是公开知名风格（36氪 / 经济学人）直接点名；如果是公司内部风格，就贴 1 条最贴近的过往爆款做参考。',
    similarExamples: [
      '参考去年阅读量 Top1 推文的开头：「去年那 1000 个海外买家，今年还会来吗？」',
      '示例：\n英文：U.S. Imposes New Tariffs → 中文：美国加征新关税',
      '参考过往同类稿件结构：\n- 财新《对话宁德时代曾毓群》：场景切入 → 三段判断 → 行业反问',
    ],
  },
  fallback: {
    label: '兜底 Fallback',
    short: '兜底',
    icon: '🛟',
    bg: 'bg-stone-100',
    bgSelected: 'bg-stone-200',
    border: 'border-stone-400/70',
    borderSelected: 'border-stone-500',
    text: 'text-stone-800',
    dot: 'bg-stone-500',
    pill: 'bg-stone-500/15 text-stone-800',
    ring: 'ring-stone-400/40',
    whatItDoes:
      '告诉模型"信息不足时怎么办"——是脑补、是问回来、还是标 [需核实]。没有兜底的提示词（Prompt）在数据缺失时会偷偷编造，是 B2B 工作流的最大事故源。',
    similarExamples: [
      '如果信息不足以完成任务，输出"信息不足，请补充：xxx"，不要编造。',
      '原文未明确的字段，写「未明确」，不要脑补。',
      '任何数据点必须能在原录音中找到出处；信心不足的用「据王某口述」前置。',
    ],
  },
}

export const scenarios = [
  {
    id: 'sales',
    role: '销售',
    icon: '🤝',
    title: '海外参展商跟进微信',
    description:
      '客户去年成交但今年观望，要起一条中英双语的微信跟进，把"为什么是今年""为什么是德国买家"讲清楚',
    segments: [
      {
        kind: 'role',
        text: '你是一位有 8 年经验的紧固件展会海外招商经理，熟悉欧美一级买家与中国制造商的采购对接心理。',
      },
      {
        kind: 'context',
        text: '背景：客户「Schmidt Fasteners GmbH」是德国一家中型紧固件分销商，去年参加了我们第 15 届上海紧固件展（2 个标准展位），现场对接了 12 家中国制造商，但截至 5 月底仍未确认 2026 年参展。客户对接人 Lukas（CEO）上次微信回复在 4 月 17 日，提到"6 月内部预算评估"。',
      },
      {
        kind: 'task',
        text: '请帮我起草一条中英双语的微信跟进消息，目标是让 Lukas 在 6 月 15 日前给出明确的参展意向。',
      },
      {
        kind: 'format',
        text:
          '输出格式：\n- 中文段：≤ 80 字\n- 英文段：≤ 80 词\n- 中英分两段独立可发送，不要互相翻译式重复',
      },
      {
        kind: 'constraint',
        text:
          '约束：\n- 不要寒暄、不要"How are you"\n- 开场必须抛去年的一组数据点（如：12 家对接 / N 单意向）做钩子\n- 中段提一个今年新增的"对德国买家有利"的安排（如：欧洲专属洽谈区 / 翻译服务）\n- 结尾给一个具体的回复路径（如"回复 1 锁位 / 2 详聊 / 3 暂缓"），不要"等您消息"',
      },
      {
        kind: 'example',
        text:
          '参考语气示例：\n中：去年那 12 家长三角厂，今年我们重新邀请了 9 家。德国馆位现在还剩 4 个标准位...\n英：Of the 12 Chinese manufacturers you met last June, 9 will return in 2026...',
      },
      {
        kind: 'fallback',
        text:
          '如果上次微信记录中没有 Lukas 提及的具体痛点，直接以"询问 6 月预算评估进展"为切入；不要编造客户没说过的需求。',
      },
    ],
  },
  {
    id: 'ops',
    role: '运营',
    icon: '📰',
    title: '英文行业资讯 → 中文公众号短稿',
    description:
      '把一条欧洲车企的英文新闻改写成中文公众号推文，控制套话、保留数字、加信心评级',
    segments: [
      {
        kind: 'role',
        text: '你是一位深耕紧固件行业 6 年的公众号小编，文风偏 36氪。',
      },
      {
        kind: 'context',
        text:
          '我们公众号的读者主要是国内紧固件制造商的市场负责人和外贸经理，对关税、出海路径、海外订单数据敏感，反感"重磅 / 蓄势待发 / 共襄盛举"这类套话。',
      },
      {
        kind: 'task',
        text: '请把下面这条英文行业资讯改写成一篇中文公众号短稿。',
      },
      {
        kind: 'input',
        text:
          '英文原文：\n"""\nEuropean auto giant Volkswagen has announced a strategic shift to source 30% of standard fasteners from Vietnamese suppliers by Q3 2027, citing tariff considerations and EU\'s Carbon Border Adjustment Mechanism (CBAM). Industry analysts estimate this could redirect approximately $180M in annual orders away from Chinese manufacturers.\n"""',
      },
      {
        kind: 'format',
        text:
          '输出格式（严格按 Markdown）：\n## 标题（≤22 字，必含一个具体数字）\n**导语**（80 字内，一句话讲清"发生什么 + 对中国行业意味什么"）\n**正文**（3 段，每段一个核心信息：事件 / 数据 / 行业影响）\n**信心评级**：高 / 中 / 低 + 理由一句',
      },
      {
        kind: 'constraint',
        text:
          '约束：\n- 全文不超过 600 字\n- 禁用词：重磅、蓄势待发、共襄盛举、干货满满\n- 涉及数字一律保留原文（$180M、30%、Q3 2027），不要换算成人民币',
      },
      {
        kind: 'fallback',
        text:
          '如果原文中没有明确时间点或量化数据，对应位置写「未明确」，不要脑补；推断结论须在"信心评级"中降为"低"并说明原因。',
      },
    ],
  },
  {
    id: 'editor',
    role: '新闻采编',
    icon: '🎙️',
    title: '访谈录音 → 深度专访稿初稿',
    description:
      '把超杰股份 CEO 王某的访谈录音转写整理成 1500-1800 字深度专访稿，发表在《华人螺丝》英文杂志',
    segments: [
      {
        kind: 'role',
        text:
          '你是一位有 10 年经验的财经杂志深度报道记者，曾就职于《财新》和《第一财经》，文风克制、信息密度高，擅长把高管访谈拆解为"商业判断 + 行业洞察"。',
      },
      {
        kind: 'context',
        text:
          '下面这份采访录音转写，是我对超杰股份（紧固件上市公司）CEO 王某的访谈节选。本次访谈用于《华人螺丝》英文杂志 2026 年 6 月刊的封面专访，目标读者是欧美一级买家。',
      },
      {
        kind: 'task',
        text:
          '请把它整理成一篇 1500-1800 字的中文深度专访稿初稿（英文版后续翻译）。',
      },
      {
        kind: 'input',
        text:
          '录音转写（原文带"啊嗯然后"等口语词，需自行清洗）：\n"""\n{{此处粘贴采访录音转写}}\n"""',
      },
      {
        kind: 'format',
        text:
          '输出结构：\n1. 引子（≤ 200 字）：一个具体场景或反差数据切入，引出王某这次访谈的"核心判断"\n2. 三个小节，每节小标题 + 一句话点睛 + 3-4 段正文，每节须包含至少 1 句被引号的原话\n3. 结尾段（≤ 150 字）：把王某的判断放回行业坐标，留一个开放性问题',
      },
      {
        kind: 'constraint',
        text:
          '约束：\n- 口语词全部清洗（啊 / 嗯 / 那个 / 就是 / 对吧）\n- 原话引用必须**忠实**，不允许优化对方语句；可保留对方的口头风格\n- 一律使用"王某"指代受访者，不写公司具体股票代码\n- 不出现"专访" "深度对话"这些套词',
      },
      {
        kind: 'example',
        text:
          '参考过往同类稿件结构：\n- 财新《对话宁德时代曾毓群》：场景切入 → 三段商业判断 → 行业反问\n- FT 中文网《SHEIN 创始人许仰天访谈》：数据切入 → 业务三层拆解 → 全球坐标',
      },
      {
        kind: 'fallback',
        text:
          '如果录音中某个细节存在多种解读，在该段末尾用 [需核实] 标记，不要主观选择一种叙事；信心不足的数据用「据王某口述」前置；任何数据点必须能在原录音中找到出处。',
      },
    ],
  },
]
