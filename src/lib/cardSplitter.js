// 把 AI 生成的 markdown 正文，按形态切分成若干张"卡片"用于图文导出。
//
// 输出统一形态：
//   { kind: 'cover' | 'content' | 'long', title?, lines: Array<Block> }
// 其中 Block = { type: 'h1'|'h2'|'h3'|'p'|'li'|'ol'|'quote'|'hr', text }
//
// 形态规则：
//   xhs    小红书竖版 3:4  —— 首张 cover（仅大标题 + 副标题），后续若干 content 张
//   square 1:1 方图        —— 全部 content，按字数分页（每张稍少）
//   vertical 9:16 竖图     —— 首张 cover（封面气质），后续 content（每张更少字）
//   long   长图            —— 单张 long，正文全部放一起

import { stripLeadingTitle } from '../components/Markdown.jsx'

const FORM_CONFIG = {
  xhs:      { withCover: true,  charsPerPage: 320, maxBlocksPerPage: 6 },
  square:   { withCover: false, charsPerPage: 220, maxBlocksPerPage: 5 },
  vertical: { withCover: true,  charsPerPage: 180, maxBlocksPerPage: 4 },
  long:     { withCover: false, charsPerPage: Infinity, maxBlocksPerPage: Infinity },
}

export const FORM_META = {
  xhs:      { label: '小红书 · 3:4', width: 900,  height: 1200, aspectClass: 'aspect-[3/4]'  },
  square:   { label: '方图 · 1:1',   width: 1080, height: 1080, aspectClass: 'aspect-square' },
  vertical: { label: '竖图 · 9:16',  width: 1080, height: 1920, aspectClass: 'aspect-[9/16]' },
  long:     { label: '长图',         width: 1080, height: null, aspectClass: null            },
}

// ── markdown → 段落块列表 ────────────────────────────
function parseBlocks(source) {
  const lines = (source || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trim()

    if (!line) { i++; continue }

    // headings
    const h = line.match(/^(#{1,4})\s+(.+?)\s*#*$/)
    if (h) {
      const level = Math.min(h[1].length, 3)
      blocks.push({ type: `h${level}`, text: h[2] })
      i++
      continue
    }

    // hr
    if (/^[-*_]{3,}$/.test(line)) {
      blocks.push({ type: 'hr', text: '' })
      i++
      continue
    }

    // ul item
    if (/^[-*+]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ''))
        i++
      }
      items.forEach((t) => blocks.push({ type: 'li', text: t }))
      continue
    }

    // ol item
    if (/^\d+[.)]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''))
        i++
      }
      items.forEach((t) => blocks.push({ type: 'ol', text: t }))
      continue
    }

    // blockquote
    if (line.startsWith('>')) {
      const parts = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        parts.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', text: parts.join(' ') })
      continue
    }

    // paragraph: 收集到空行/特殊行
    const buf = [line]
    i++
    while (i < lines.length) {
      const nxt = lines[i].trim()
      if (!nxt) break
      if (/^#{1,4}\s+/.test(nxt)) break
      if (/^[-*+]\s+/.test(nxt) || /^\d+[.)]\s+/.test(nxt)) break
      if (/^[-*_]{3,}$/.test(nxt)) break
      if (nxt.startsWith('>')) break
      buf.push(nxt)
      i++
    }
    blocks.push({ type: 'p', text: buf.join(' ') })
  }

  return blocks
}

// 去掉行内标记（** _ ` ~~），导出图片用纯文本更稳
function cleanInline(text) {
  return (text || '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

function cleanBlocks(blocks) {
  return blocks.map((b) => ({ ...b, text: cleanInline(b.text) }))
}

// 估算块占用"字数"（中文 1 字 ≈ 1，英文按 0.6 折）
function blockWeight(b) {
  const t = b.text || ''
  let cn = 0
  let other = 0
  for (const ch of t) {
    if (/[一-鿿]/.test(ch)) cn++
    else other++
  }
  const base = cn + other * 0.6
  // 大标题/分隔符算一点固定开销，避免一堆 h2 都被塞到一张图
  if (b.type === 'h1') return base + 40
  if (b.type === 'h2') return base + 24
  if (b.type === 'h3') return base + 16
  if (b.type === 'hr') return 12
  if (b.type === 'li' || b.type === 'ol') return base + 6
  return base
}

// 去掉常见的中文模板前缀（"标题："、"正文："）和纯文本重复标题行
function stripPrefixedTitle(blocks, title) {
  const out = []
  const normTitle = (title || '').replace(/\s+/g, '').toLowerCase()
  let skippingHead = true
  for (const b of blocks) {
    const text = (b.text || '').trim()
    // 去掉只包含"正文："/"内容："这类纯前缀的段
    if (skippingHead && /^(正文|内容|摘要|前言)[:：]\s*$/.test(text)) continue
    // 去掉"标题：xxx"前缀（仅当 xxx 与 title 几乎一致）
    const m = text.match(/^(标题|题目|主题)[:：]\s*(.+)$/)
    if (m && skippingHead) {
      const inner = m[2].replace(/\s+/g, '').toLowerCase()
      if (
        inner === normTitle ||
        (normTitle && (inner.includes(normTitle) || normTitle.includes(inner)))
      ) {
        continue
      }
    }
    // "正文：xxx" → "xxx"（剥掉前缀但保留内容）
    if (skippingHead) {
      const stripped = text.replace(/^(正文|内容|摘要|前言)[:：]\s*/, '')
      if (stripped !== text) {
        out.push({ ...b, text: stripped })
        skippingHead = false
        continue
      }
    }
    if (text) skippingHead = false
    out.push(b)
  }
  return out
}

// 把 "标题：xxx" / "题目：xxx" 这类纯文本前缀从 title 字段里也剥掉，封面显示更干净
function cleanTitleForDisplay(title) {
  if (!title) return ''
  return title.replace(/^\s*(标题|题目|主题|Title)\s*[:：]\s*/i, '').trim()
}

function normalize(s) {
  return (s || '').replace(/\s+/g, '').toLowerCase()
}

// ── 主入口 ──────────────────────────────────────────────
export function splitToCards({ content, title, form }) {
  const cfg = FORM_CONFIG[form] || FORM_CONFIG.xhs
  const displayTitle = cleanTitleForDisplay(title)
  const stripped = stripLeadingTitle(content || '', title)
  let blocks = cleanBlocks(parseBlocks(stripped))
  blocks = stripPrefixedTitle(blocks, title)

  // 取一段开头摘要做副标题（封面用），但要避开和标题重复
  const titleKey = normalize(displayTitle)
  const firstPara = blocks.find((b) => {
    if (b.type !== 'p' && b.type !== 'quote') return false
    const k = normalize(b.text)
    if (!k) return false
    if (k === titleKey) return false
    if (titleKey && (k.includes(titleKey) || titleKey.includes(k)) && Math.abs(k.length - titleKey.length) < 4) return false
    return true
  })
  const subtitle = firstPara ? firstPara.text.slice(0, 60) : ''

  if (form === 'long') {
    return [{ kind: 'long', title: displayTitle, subtitle, blocks }]
  }

  const cards = []

  if (cfg.withCover) {
    cards.push({ kind: 'cover', title: displayTitle || '未命名', subtitle, index: 1 })
  }

  // 分页：贪心累加直到达到阈值
  let bucket = []
  let weight = 0
  const flush = () => {
    if (bucket.length === 0) return
    cards.push({ kind: 'content', blocks: bucket })
    bucket = []
    weight = 0
  }

  for (const b of blocks) {
    const w = blockWeight(b)
    const tooManyBlocks = bucket.length >= cfg.maxBlocksPerPage
    const tooLong = weight + w > cfg.charsPerPage && bucket.length > 0
    if (tooManyBlocks || tooLong) flush()
    // 单段超长：硬切
    if (w > cfg.charsPerPage * 1.5 && b.type === 'p') {
      const max = Math.floor(cfg.charsPerPage * 0.9)
      let remaining = b.text
      while (remaining.length > 0) {
        const chunk = remaining.slice(0, max)
        bucket = [{ type: 'p', text: chunk }]
        cards.push({ kind: 'content', blocks: bucket })
        bucket = []
        weight = 0
        remaining = remaining.slice(max)
      }
      continue
    }
    bucket.push(b)
    weight += w
  }
  flush()

  // 标注页码（不含封面）
  let pageNo = 0
  const total = cards.filter((c) => c.kind === 'content').length
  for (const c of cards) {
    if (c.kind === 'content') {
      pageNo++
      c.page = pageNo
      c.total = total
    }
  }

  // 若内容卡数 == 0（极短文本），把 subtitle 当 p 写入第一张内容卡
  if (total === 0 && subtitle) {
    cards.push({ kind: 'content', page: 1, total: 1, blocks: [{ type: 'p', text: subtitle }] })
  }

  return cards
}
