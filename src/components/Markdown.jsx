import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// 全局配置 marked：换行转 <br>、启用 GFM（表格/删除线/任务列表）、不生成自动 id（避免锚点冲突）
marked.use({
  gfm: true,
  breaks: true,
  pedantic: false,
})

export function renderMarkdown(source = '') {
  const raw = marked.parse(source || '', { async: false })
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['target', 'rel'],
  })
}

// 去掉与给定 title 重复的开头 H1（避免页面顶部已有大标题、正文又一次出现 # 标题 的情况）
export function stripLeadingTitle(source = '', title = '') {
  if (!source) return ''
  const lines = source.split('\n')
  let i = 0
  while (i < lines.length && lines[i].trim() === '') i++
  if (i >= lines.length) return source
  const m = lines[i].match(/^#\s+(.+?)\s*#*\s*$/)
  if (!m) return source
  if (title) {
    const norm = (s) => s.replace(/\s+/g, '').toLowerCase()
    const a = norm(m[1])
    const b = norm(title)
    // 允许互相包含（gen.title 是从首行截 60 字得来，可能比原 H1 短）
    if (a !== b && !a.includes(b) && !b.includes(a)) return source
  }
  let j = i + 1
  while (j < lines.length && lines[j].trim() === '') j++
  return lines.slice(j).join('\n')
}

export default function Markdown({ source = '', className = '' }) {
  const html = useMemo(() => renderMarkdown(source), [source])
  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
