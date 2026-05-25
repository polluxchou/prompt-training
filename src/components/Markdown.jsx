import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { cleanTitleText } from '../lib/generationsStore.js'

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

// 去掉与给定 title 重复的开头标题行（避免页面顶部已有大标题、正文又一次出现同样的标题）
// 支持三种首行形态：
//   1. # 标题  /  ## 标题  （ATX 标题）
//   2. **标题** / __标题__   （加粗整行）
//   3. 纯文本一行   —— 只在文本与 title 高度相似时才剥
export function stripLeadingTitle(source = '', title = '') {
  if (!source) return ''
  const lines = source.split('\n')
  let i = 0
  while (i < lines.length && lines[i].trim() === '') i++
  if (i >= lines.length) return source

  const raw = lines[i]
  const isAtxHeading = /^#{1,6}\s+/.test(raw)
  const isBoldOnly =
    /^\s*\*\*[^*]+\*\*\s*$/.test(raw) || /^\s*__[^_]+__\s*$/.test(raw)
  const cleanedFirst = cleanTitleText(raw)

  // 三种情况都按"去掉 md 标记后的文本"做与 title 的相似度比较：
  //   ATX 标题：宽松匹配（允许 a/b 互相包含，因为 title 是截过 60 字的）
  //   加粗整行：宽松匹配
  //   纯文本：必须 title 完全包含 cleanedFirst 或反过来，且 cleanedFirst 不能太短
  const norm = (s) => s.replace(/\s+/g, '').toLowerCase()
  const a = norm(cleanedFirst)
  const b = norm(title)

  let isTitleLine = false
  if (isAtxHeading || isBoldOnly) {
    if (!title) isTitleLine = true
    else if (a && b && (a === b || a.includes(b) || b.includes(a))) {
      isTitleLine = true
    }
  } else if (title && a && b && cleanedFirst.length >= 4) {
    // 纯文本：要求严格相似，避免把正文首句误识为标题
    if (a === b || a.includes(b) || b.includes(a)) isTitleLine = true
  }

  if (!isTitleLine) return source

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
