// 生成内容的多格式导出
// 纯文本格式（md/html）零依赖；图片/PDF 依赖 html2canvas + jspdf

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { renderMarkdown, stripLeadingTitle } from '../components/Markdown.jsx'

// ── 工具 ─────────────────────────────────────────────

function sanitizeFilename(s) {
  return (s || 'generation').replace(/[\\/:*?"<>|\n\r]/g, '_').trim().slice(0, 80) || 'generation'
}

function blobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function escapeHtml(s) {
  return (s || '').replace(/[<>&"']/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]),
  )
}

// ── Markdown / HTML（纯 Blob） ────────────────────────

export function downloadMd({ title, content, meta }) {
  const stripped = stripLeadingTitle(content || '', title)
  const head = [`# ${title || '未命名'}`]
  if (meta) head.push('', `> ${meta}`)
  const md = `${head.join('\n')}\n\n${stripped}\n`
  blobDownload(
    new Blob([md], { type: 'text/markdown;charset=utf-8' }),
    `${sanitizeFilename(title)}.md`,
  )
}

export function downloadHtml({ title, content, meta }) {
  const safeTitle = escapeHtml(title || '未命名')
  const body = renderMarkdown(stripLeadingTitle(content || '', title))

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  :root { color-scheme: light; }
  body { max-width: 760px; margin: 40px auto; padding: 0 28px;
         font: 16px/1.8 -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
         color: #1f1f1f; background: #fffcf7; }
  .doc-title { font-size: 28px; margin: 0 0 8px; font-weight: 700; }
  .doc-meta  { color: #888; font-size: 13px; margin: 0 0 32px; }
  h1, h2, h3, h4 { color: #26190f; margin: 1.4em 0 .6em; line-height: 1.35; }
  h1 { font-size: 24px; }
  h2 { font-size: 20px; }
  h3 { font-size: 18px; }
  h4 { font-size: 16px; }
  p  { margin: 0 0 14px; }
  ul, ol { margin: 14px 0; padding-left: 1.6em; }
  li { margin: 4px 0; }
  blockquote { margin: 14px 0; padding: 8px 14px;
               border-left: 4px solid rgba(217,119,87,.4);
               background: rgba(217,119,87,.06); color: #5c4a3a; }
  hr { border: 0; border-top: 1px solid rgba(217,119,87,.2); margin: 28px 0; }
  code { background: rgba(92,74,58,.10); padding: 1px 4px; border-radius: 4px;
         font-family: ui-monospace, "JetBrains Mono", monospace; font-size: .9em; }
  pre  { background: #1a120c; color: #fffcf7; padding: 14px;
         border-radius: 12px; overflow-x: auto; font-size: 13px; }
  pre code { background: transparent; padding: 0; color: inherit; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0; }
  th, td { border: 1px solid rgba(217,119,87,.25); padding: 8px 10px; text-align: left; }
  th { background: rgba(217,119,87,.10); }
  a { color: #a0522d; text-decoration: underline; }
  img { max-width: 100%; border-radius: 12px; margin: 14px 0; }
</style>
</head>
<body>
<h1 class="doc-title">${safeTitle}</h1>
${meta ? `<p class="doc-meta">${escapeHtml(meta)}</p>` : ''}
${body}
</body>
</html>
`
  blobDownload(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
    `${sanitizeFilename(title)}.html`,
  )
}

// ── 图片 / PDF（html2canvas + jspdf） ────────────────

async function renderElement(element, scale = 2, title = '') {
  if (!element) throw new Error('待截图的 DOM 节点不存在')

  // 把目标节点放进带标题的临时离屏 wrapper，确保导出图带 H1
  const wrapper = document.createElement('div')
  const width = element.offsetWidth || 760
  wrapper.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${width}px`,
    'background:#fffcf7',
    'padding:28px 28px 32px',
    'box-sizing:border-box',
    'font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    'color:#26190f',
  ].join(';')

  if (title) {
    const h = document.createElement('h1')
    h.textContent = title
    h.style.cssText = [
      'font-family:"Playfair Display","Noto Serif SC",serif',
      'font-size:26px',
      'font-weight:700',
      'line-height:1.3',
      'color:#26190f',
      'margin:0 0 18px',
      'padding:0 0 12px',
      'border-bottom:1px solid rgba(217,119,87,.2)',
    ].join(';')
    wrapper.appendChild(h)
  }
  const clone = element.cloneNode(true)
  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  try {
    return await html2canvas(wrapper, {
      scale,
      backgroundColor: '#fffcf7',
      useCORS: true,
      logging: false,
      windowWidth: Math.max(wrapper.scrollWidth, wrapper.clientWidth),
      windowHeight: Math.max(wrapper.scrollHeight, wrapper.clientHeight),
    })
  } finally {
    document.body.removeChild(wrapper)
  }
}

export async function downloadPng({ element, title }) {
  const canvas = await renderElement(element, 2, title)
  await new Promise((resolve) =>
    canvas.toBlob(
      (blob) => {
        if (blob) blobDownload(blob, `${sanitizeFilename(title)}.png`)
        resolve()
      },
      'image/png',
    ),
  )
}

export async function downloadJpg({ element, title }) {
  const canvas = await renderElement(element, 2, title)
  await new Promise((resolve) =>
    canvas.toBlob(
      (blob) => {
        if (blob) blobDownload(blob, `${sanitizeFilename(title)}.jpg`)
        resolve()
      },
      'image/jpeg',
      0.92,
    ),
  )
}

export async function downloadPdf({ element, title }) {
  const canvas = await renderElement(element, 2, title)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 10
  const imgW = pageW - margin * 2
  const fullImgH = (canvas.height * imgW) / canvas.width
  const usableH = pageH - margin * 2

  if (fullImgH <= usableH) {
    // 单页
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(dataUrl, 'JPEG', margin, margin, imgW, fullImgH)
  } else {
    // 多页：按可用高度切片
    const ratio = canvas.width / imgW // mm → px
    const sliceHeightPx = Math.floor(usableH * ratio)
    let sy = 0
    let first = true
    while (sy < canvas.height) {
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = Math.min(sliceHeightPx, canvas.height - sy)
      const ctx = slice.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, slice.width, slice.height)
      ctx.drawImage(canvas, 0, sy, slice.width, slice.height, 0, 0, slice.width, slice.height)
      const sliceData = slice.toDataURL('image/jpeg', 0.92)
      const sliceImgH = (slice.height * imgW) / slice.width
      if (!first) pdf.addPage()
      pdf.addImage(sliceData, 'JPEG', margin, margin, imgW, sliceImgH)
      sy += slice.height
      first = false
    }
  }
  pdf.save(`${sanitizeFilename(title)}.pdf`)
}
