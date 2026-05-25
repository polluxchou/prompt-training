import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  formatInTimezone,
  formatRelative,
  getArticle,
  getRunByArticle,
  getSchedule,
} from '../../lib/schedulesStore.js'
import { useSchedulesState } from '../../lib/useSchedules.js'
import PageHeader from './_PageHeader.jsx'

export default function ArticleDetail() {
  const { id, articleId } = useParams()
  useSchedulesState() // 订阅

  const article = getArticle(articleId)
  const schedule = getSchedule(id)
  const run = article ? getRunByArticle(article.id) : null

  if (!article || !schedule) {
    return <Navigate to={`/scheduled-content/${id}`} replace />
  }

  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(article.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <PageHeader
        eyebrow="文章详情"
        title={article.title}
        back={{
          to: `/scheduled-content/${schedule.id}`,
          label: `返回「${schedule.name}」`,
        }}
        right={
          <button onClick={copy} className="btn-ghost text-sm">
            {copied ? '✓ 已复制' : '复制全文'}
          </button>
        }
      />

      {/* 元信息 */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-ink-700/70">
        <Meta label="生成时间">
          {formatInTimezone(article.generated_at, schedule.timezone)}{' '}
          <span className="text-ink-700/50">
            · {formatRelative(article.generated_at)}
          </span>
        </Meta>
        <Meta label="触发">
          {run?.trigger === 'manual' ? (
            <span className="rounded-full bg-clay-500/15 px-2 py-0.5 text-[10px] font-medium text-clay-700">
              ▶ manual
            </span>
          ) : (
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-700">
              ⏰ scheduled
            </span>
          )}
        </Meta>
        <Meta label="模型">{article.model || schedule.model}</Meta>
        {run?.token_usage && (
          <Meta label="tokens">
            {run.token_usage.prompt_tokens} → {run.token_usage.completion_tokens}
          </Meta>
        )}
      </div>

      {/* 正文 */}
      <article className="mt-6 rounded-3xl border border-clay-500/15 bg-cream-50/85 p-8 shadow-soft">
        <MarkdownLite text={article.content} />
      </article>

      {/* Prompt 折叠 */}
      <details className="mt-6 rounded-2xl border border-clay-500/15 bg-cream-100/40 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink-900">
          📝 查看生成时使用的提示词（Prompt）
        </summary>
        <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-ink-900/95 p-4 font-mono text-[12px] leading-relaxed text-cream-100">
          {schedule.prompt}
        </pre>
      </details>
    </div>
  )
}

function Meta({ label, children }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-ink-700/50">
        {label}
      </span>
      <span>{children}</span>
    </span>
  )
}

/**
 * 极简 Markdown 渲染器，原型够用：
 *  - # H1 / ## H2 / ### H3
 *  - **bold**  *italic*
 *  - 行首 `- ` / `* ` 列表
 *  - 段落空行分段
 *  - ```fenced code blocks```
 */
function MarkdownLite({ text }) {
  const blocks = parseBlocks(text)
  return (
    <div className="prose-mimic text-ink-900">
      {blocks.map((b, i) => renderBlock(b, i))}
      <style>{`
        .prose-mimic h1 { font-family: var(--font-display, "Playfair Display"), serif; font-size: 1.75rem; font-weight: 700; margin: 1.25em 0 .5em; line-height: 1.2; }
        .prose-mimic h2 { font-family: var(--font-display, "Playfair Display"), serif; font-size: 1.4rem; font-weight: 700; margin: 1.2em 0 .5em; line-height: 1.25; }
        .prose-mimic h3 { font-size: 1.1rem; font-weight: 700; margin: 1em 0 .4em; }
        .prose-mimic p  { font-size: 15px; line-height: 1.75; margin: .5em 0; color: rgb(38, 25, 15); }
        .prose-mimic ul { margin: .5em 0; padding-left: 1.4em; list-style: disc; }
        .prose-mimic li { font-size: 15px; line-height: 1.75; margin: .2em 0; }
        .prose-mimic pre.code { background: rgb(38, 25, 15); color: rgb(255, 248, 238); padding: 1em; border-radius: 12px; overflow-x: auto; font-family: "JetBrains Mono", monospace; font-size: 12.5px; line-height: 1.6; margin: .8em 0; }
        .prose-mimic strong { font-weight: 700; color: rgb(26, 16, 8); }
        .prose-mimic em { font-style: italic; }
      `}</style>
    </div>
  )
}

function parseBlocks(text) {
  if (!text) return []
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const start = i + 1
      let j = start
      while (j < lines.length && !lines[j].startsWith('```')) j += 1
      blocks.push({ type: 'code', body: lines.slice(start, j).join('\n') })
      i = j + 1
      continue
    }
    if (/^#{1,3}\s/.test(line)) {
      const m = line.match(/^(#{1,3})\s+(.*)$/)
      blocks.push({ type: 'heading', level: m[1].length, body: m[2] })
      i += 1
      continue
    }
    if (/^[-*]\s/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push({ type: 'list', items })
      continue
    }
    if (line.trim() === '') {
      i += 1
      continue
    }
    // 段落：合并相邻非空、非特殊行
    const para = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i]) &&
      !lines[i].startsWith('```')
    ) {
      para.push(lines[i])
      i += 1
    }
    blocks.push({ type: 'paragraph', body: para.join('\n') })
  }
  return blocks
}

function renderBlock(b, key) {
  switch (b.type) {
    case 'heading': {
      const Tag = `h${b.level}`
      return <Tag key={key}>{renderInline(b.body)}</Tag>
    }
    case 'list':
      return (
        <ul key={key}>
          {b.items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ul>
      )
    case 'code':
      return (
        <pre key={key} className="code">
          {b.body}
        </pre>
      )
    case 'paragraph':
    default:
      return <p key={key}>{renderInline(b.body)}</p>
  }
}

function renderInline(text) {
  // 极简 **bold** / *italic*
  const parts = []
  let rest = text
  let key = 0
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/
  while (rest.length) {
    const m = rest.match(re)
    if (!m) {
      parts.push(rest)
      break
    }
    const before = rest.slice(0, m.index)
    if (before) parts.push(before)
    const t = m[0]
    if (t.startsWith('**')) parts.push(<strong key={key++}>{t.slice(2, -2)}</strong>)
    else parts.push(<em key={key++}>{t.slice(1, -1)}</em>)
    rest = rest.slice(m.index + t.length)
  }
  return parts
}
