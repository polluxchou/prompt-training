export const templates = [
  {
    id: 'expo-wechat',
    title: '展会预热公众号推文',
    tag: '新媒体',
    body: `你是一位有 5 年经验的紧固件行业新媒体小编。
请为「第 {{届数}} 届上海紧固件专业展」（时间 {{日期}}，地点 {{展馆}}）写一篇微信公众号预热推文。

目标读者：{{制造商市场负责人 / 海外采购 / 行业贸易商}}
核心看点（3 选 1 作为标题钩子）：{{规模数据 / 海外买家结构 / 关键活动}}

要求：
- 标题不超过 22 字，带 1 个具体数字
- 正文 800 字以内，分 3 段：看点 / 为什么今年不同 / 如何参与
- 禁用词：重磅 / 蓄势待发 / 共襄盛举 / 干货满满
- 文末留一个注册链接占位 {{注册链接}} 和截止日期占位 {{截止日期}}`,
  },
  {
    id: 'overseas-buyer-email',
    title: '海外买家邀请邮件（英文）',
    tag: '出海',
    body: `You are a senior B2B trade-show invitation copywriter with experience in the fastener industry.

Write an English invitation email to {{buyer_persona, e.g., procurement director at a German auto distributor}} inviting them to Fastener Expo Shanghai {{year}} ({{dates}}, {{venue}}).

Constraints:
- Subject line ≤ 60 characters, no clickbait, mention one concrete number
- Body ≤ 180 words, three short paragraphs: hook (industry pain point) / value (what they\'ll get on-site) / CTA (a single calendar link {{calendar_link}})
- No "Dear Sir/Madam", no "I hope this email finds you well"
- Sign-off as {{sender_name, sender_title}}
- If any required information is missing, list the gaps before writing instead of fabricating.`,
  },
  {
    id: 'exhibitor-recruitment',
    title: '招商话术（中文电话/微信）',
    tag: '招商',
    body: `你是华人螺丝网展览公司的招商经理，需要联系一位"去年参展、今年还在观望"的紧固件厂老板。

背景信息：
- 对方公司：{{公司名}}
- 去年参展位置：{{展位号 / 馆区}}
- 去年成交意向客户数：{{N}}
- 对方犹豫点：{{价格 / ROI / 时间冲突 / 其他}}

请输出 3 段话术，分别用于：
1. 微信首次破冰（不超过 80 字，不要寒暄套话）
2. 电话拜访开场（30 秒以内，主动给出"对方为什么应当听下去"的钩子）
3. 报价后跟进（针对对方的犹豫点，给出 1 个具体解决方案，不要"我们考虑一下"）`,
  },
  {
    id: 'industry-news-rewrite',
    title: '行业资讯翻译改写',
    tag: '内容',
    body: `请把下面这条英文紧固件行业资讯改写为中文公众号短讯（200 字以内）。

要求：
- 标题：仿照示例风格，带 1 个数据或地名

  示例 1：美国对中国紧固件加征 232 条款新关税
  示例 2：欧洲车企紧固件采购正在转向越南

- 正文结构：背景 1 句 → 关键数据 1-2 句 → 对中国行业的影响 1 句
- 不要使用"据悉 / 据报道"等模糊来源，如果原文有具体出处直接保留英文机构名
- 文末用一句话给出"信心等级（高 / 中 / 低）"，标注理由（如"原文为路透首发"）

英文原文：
{{原文}}`,
  },
  {
    id: 'video-script',
    title: '展会现场短视频脚本',
    tag: '视频',
    body: `请生成一条 45 秒的展会现场短视频脚本，发布平台：{{视频号 / 抖音 / 小红书}}。

主题：{{第 X 届上海紧固件展 · 第 N 天}}
拍摄对象：{{某个明星参展商 / 某个海外买家团 / 某场配套论坛}}

输出格式（严格按以下分镜表）：
| 时间 | 画面 | 字幕（≤14 字） | 旁白（≤25 字） |
| --- | --- | --- | --- |
| 0-3s | 开场 | | |
| 3-15s | … | | |
| 15-40s | … | | |
| 40-45s | 收尾 + CTA | | |

要求：
- 不要喊口号、不要"震撼登场"
- 字幕必须能在静音播放时看懂主线
- 结尾 CTA：{{扫码看完整展商名单 / 评论区留行业 + 邮箱获邀请函}}`,
  },
  {
    id: 'exhibitor-interview',
    title: '参展商专访提纲',
    tag: '采访',
    body: `请为以下参展商生成一份 30 分钟的专访提纲，最终内容将发表在《华人螺丝》英文杂志和公众号。

参展商：{{公司名}}
主营产品：{{产品}}
今年看点：{{新品 / 新产能 / 出海动作 / 其他}}

提纲结构：
1. 开场（建立信任，1 个问题，避免假设性）
2. 业务现状（3 个问题，聚焦"过去 12 个月发生了什么"，不要问"未来"）
3. 行业判断（2 个问题，请对方对某个具体趋势表态）
4. 出海与展会（2 个问题，挖具体客户案例）
5. 收尾（1 个问题，留作金句的开放题）

每个问题后附 1 句"如果对方简短作答，可以怎样追问"。`,
  },
  {
    id: 'post-show-recap',
    title: '展后复盘新闻稿',
    tag: '公关',
    body: `请写一篇 600-900 字的展后官方新闻稿，用于公众号、官网新闻中心和发给媒体的通稿。

输入数据：
- 展会名称与届数：{{第 X 届上海紧固件专业展}}
- 时间与地点：{{日期 / 展馆}}
- 关键数字：参展商 {{N1}}、海外买家 {{N2}}、观众 {{N3}}、专业论坛 {{N4}} 场
- 重要活动 1-3 项：{{活动名称与亮点}}
- 至少 1 句来自展商或买家的引语：{{引语 + 身份}}

要求：
- 第一段 80 字以内，把"展会 + 时间 + 地点 + 最关键数字"讲完
- 后续段落按"规模 / 内容 / 国际化 / 行业影响"四块组织
- 不使用"圆满落幕 / 完美收官 / 再创新高"等套话
- 标注信心未确认的数据，留 {{待核}} 标记`,
  },
  {
    id: 'json-lead-extract',
    title: '展会线索 JSON 抽取',
    tag: '数据',
    body: `从下面的"展会名片 + 客户备注"文本中抽取销售线索信息。严格按 JSON 输出，不要输出 JSON 之外的任何字符。

Schema：
{
  "company": "string",
  "country": "string",
  "contact_name": "string",
  "title": "string",
  "email": "string",
  "interest_products": ["string"],
  "annual_volume_estimate": "string | unknown",
  "lead_score": "A | B | C",
  "next_action": "string"
}

打分规则：
- A：有具体采购数量 + 明确品类 + 2 周内有沟通计划
- B：有明确品类但数量未知
- C：仅留下名片，无具体兴趣

文本：
{{名片文本}}`,
  },
]
