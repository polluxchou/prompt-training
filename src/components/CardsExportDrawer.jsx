import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { splitToCards, FORM_META } from '../lib/cardSplitter.js'
import {
  downloadCardImage,
  downloadAllCardImages,
  copyCardToClipboard,
} from '../lib/downloadAs.js'

const FORMS = [
  { key: 'xhs',      label: '小红书',  hint: '3:4 竖图 · 封面+内页' },
  { key: 'square',   label: '方图',    hint: '1:1 朋友圈 / IG Feed' },
  { key: 'vertical', label: '竖屏',    hint: '9:16 抖音 / Reels' },
  { key: 'long',     label: '长图',    hint: '一图到底 · 公众号风格' },
]

export default function CardsExportDrawer({ open, onClose, title, content }) {
  const [form, setForm] = useState('xhs')
  const [active, setActive] = useState(0)
  const [busy, setBusy] = useState('')
  const [hint, setHint] = useState('')
  const [editTitle, setEditTitle] = useState(title || '')
  const [editContent, setEditContent] = useState(content || '')
  const [editorOpen, setEditorOpen] = useState(false)
  const cardNodes = useRef([])

  // 抽屉打开 / 外部 title/content 变化时同步一次本地编辑态
  useEffect(() => {
    if (open) {
      setEditTitle(title || '')
      setEditContent(content || '')
    }
  }, [open, title, content])

  const cards = useMemo(() => {
    if (!editContent) return []
    return splitToCards({ content: editContent, title: editTitle, form })
  }, [editContent, editTitle, form])

  // 切形态后重置 refs 和 active
  useEffect(() => {
    cardNodes.current = []
    setActive(0)
  }, [form, cards.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const setNode = (i, el) => { cardNodes.current[i] = el }

  const flash = (msg) => {
    setHint(msg)
    setTimeout(() => setHint(''), 1800)
  }

  const filenameStem = `${editTitle || 'cards'}-${form}`
  const dirty = editTitle !== (title || '') || editContent !== (content || '')

  const handleDownloadOne = async (format = 'png') => {
    const node = cardNodes.current[active]
    if (!node) return
    setBusy(`download-one-${format}`)
    try {
      await downloadCardImage({
        node,
        title: filenameStem,
        index: active + 1,
        total: cards.length,
        format,
      })
      flash('已下载当前图')
    } catch (e) {
      flash(`失败：${e.message}`)
    } finally { setBusy('') }
  }

  const handleDownloadAll = async (format) => {
    const nodes = cardNodes.current.slice(0, cards.length).filter(Boolean)
    if (nodes.length === 0) return
    setBusy(`download-all-${format}`)
    try {
      await downloadAllCardImages({ nodes, title: filenameStem, format })
      flash(`已下载 ${nodes.length} 张`)
    } catch (e) {
      flash(`失败：${e.message}`)
    } finally { setBusy('') }
  }

  const handleCopy = async () => {
    const node = cardNodes.current[active]
    if (!node) return
    setBusy('copy')
    try {
      await copyCardToClipboard({ node })
      flash('已复制到剪贴板，可直接粘贴')
    } catch (e) {
      flash(`失败：${e.message}`)
    } finally { setBusy('') }
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-5xl flex-col bg-cream-50 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* 顶栏 */}
        <div className="flex items-start justify-between border-b border-clay-500/10 px-7 py-5">
          <div>
            <p className="font-mono text-xs font-semibold tracking-widest text-clay-600/70">
              CARDS EXPORT
            </p>
            <h3 className="font-display text-2xl font-bold text-ink-900">导出图文卡片</h3>
            <p className="mt-1 text-sm text-ink-700">
              一键把当前正文渲染成 4 种主流图文形态，预览后下载或复制到剪贴板
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-700 transition hover:bg-clay-500/10"
            aria-label="关闭"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* 形态 tabs */}
        <div className="flex flex-wrap gap-2 border-b border-clay-500/10 px-7 py-3">
          {FORMS.map((f) => {
            const on = f.key === form
            return (
              <button
                key={f.key}
                onClick={() => setForm(f.key)}
                className={`flex flex-col items-start rounded-2xl border px-4 py-2 text-left transition ${
                  on
                    ? 'border-clay-500 bg-clay-500 text-cream-50 shadow-warm'
                    : 'border-clay-500/15 bg-cream-100/50 text-ink-800 hover:border-clay-500/40'
                }`}
              >
                <span className="text-sm font-semibold">{f.label}</span>
                <span className={`text-[11px] ${on ? 'text-cream-50/80' : 'text-ink-700/60'}`}>
                  {f.hint}
                </span>
              </button>
            )
          })}
        </div>

        {/* 正文编辑（折叠） */}
        <div className="border-b border-clay-500/10 bg-cream-50">
          <button
            type="button"
            onClick={() => setEditorOpen((v) => !v)}
            className="flex w-full items-center justify-between px-7 py-2 text-left text-xs font-medium text-ink-700 transition hover:bg-clay-500/5"
          >
            <span className="flex items-center gap-2">
              <span>{editorOpen ? '▾' : '▸'}</span>
              <span>✎ 编辑正文（仅影响图文卡，不写回生成）</span>
              {dirty && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                  已修改
                </span>
              )}
            </span>
            {dirty && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditTitle(title || '')
                  setEditContent(content || '')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    setEditTitle(title || '')
                    setEditContent(content || '')
                  }
                }}
                className="cursor-pointer rounded-full border border-clay-500/30 px-2 py-0.5 text-[11px] text-clay-700 transition hover:bg-clay-500/10"
              >
                还原原文
              </span>
            )}
          </button>
          {editorOpen && (
            <div className="space-y-2 px-7 pb-4">
              <label className="block text-[11px] font-mono font-semibold tracking-widest text-ink-700/60">
                标题
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="（可空）卡片封面用的标题"
                className="w-full rounded-xl border border-clay-500/20 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-clay-500/60"
              />
              <label className="block pt-1 text-[11px] font-mono font-semibold tracking-widest text-ink-700/60">
                正文（支持 markdown：# 标题 · - 列表 · &gt; 引用）
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full resize-y rounded-xl border border-clay-500/20 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed text-ink-900 outline-none focus:border-clay-500/60"
              />
              <p className="text-[11px] text-ink-700/60">
                改完会实时重渲卡片，不会回写到原生成记录。
              </p>
            </div>
          )}
        </div>

        {/* 主体：左 列表 / 右 预览 */}
        <div className="flex min-h-0 flex-1">
          {form !== 'long' && cards.length > 1 && (
            <div className="hidden w-44 shrink-0 overflow-y-auto border-r border-clay-500/10 bg-cream-100/40 px-3 py-4 md:block">
              <p className="mb-2 px-1 font-mono text-[10px] font-semibold tracking-widest text-ink-700/60">
                {cards.length} 张
              </p>
              <div className="space-y-2">
                {cards.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`block w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                      active === i
                        ? 'border-clay-500 bg-clay-500/10 text-clay-700'
                        : 'border-clay-500/15 bg-cream-50 text-ink-700 hover:border-clay-500/40'
                    }`}
                  >
                    <div className="font-mono text-[10px] text-ink-700/60">#{i + 1}</div>
                    <div className="line-clamp-2">
                      {c.kind === 'cover'
                        ? `封面 · ${c.title}`
                        : c.kind === 'long'
                        ? '长图'
                        : (c.blocks?.[0]?.text || '正文') }
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex-1 overflow-auto bg-gradient-to-br from-cream-100/40 to-cream-200/20 p-6">
              {!cards.length ? (
                <div className="flex h-full items-center justify-center text-sm text-ink-700/60">
                  暂无内容
                </div>
              ) : (
                <PreviewScaled card={cards[active]} form={form} />
              )}
              {form !== 'long' && cards.length > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3 text-xs text-ink-700/70">
                  <button
                    onClick={() => setActive(Math.max(0, active - 1))}
                    disabled={active === 0}
                    className="rounded-full border border-clay-500/30 px-3 py-1 transition hover:bg-clay-500/10 disabled:opacity-40"
                  >← 上一张</button>
                  <span className="font-mono">{active + 1} / {cards.length}</span>
                  <button
                    onClick={() => setActive(Math.min(cards.length - 1, active + 1))}
                    disabled={active === cards.length - 1}
                    className="rounded-full border border-clay-500/30 px-3 py-1 transition hover:bg-clay-500/10 disabled:opacity-40"
                  >下一张 →</button>
                </div>
              )}
            </div>

            {/* 底部下载条 */}
            <div className="flex flex-wrap items-center gap-2 border-t border-clay-500/10 bg-cream-50 px-7 py-4">
              <ActionMenu
                label="⬇ 当前"
                primary
                disabled={!cards.length || !!busy}
                items={[
                  { id: 'png',  icon: '🖼', label: 'PNG 图片', hint: '无损位图', onClick: () => handleDownloadOne('png') },
                  { id: 'jpg',  icon: '🏞', label: 'JPG 图片', hint: '压缩位图，体积小', onClick: () => handleDownloadOne('jpg') },
                  { id: 'copy', icon: '📋', label: '复制到剪贴板', hint: '可直接粘贴到聊天 / 编辑器', onClick: handleCopy },
                ]}
              />
              {form !== 'long' && cards.length > 1 && (
                <ActionMenu
                  label={`⬇ 全部（${cards.length}）`}
                  disabled={!!busy}
                  items={[
                    { id: 'all-png', icon: '🖼', label: 'PNG · 批量', hint: `顺序下载 ${cards.length} 张`, onClick: () => handleDownloadAll('png') },
                    { id: 'all-jpg', icon: '🏞', label: 'JPG · 批量', hint: '体积更小', onClick: () => handleDownloadAll('jpg') },
                  ]}
                />
              )}
              {busy && (
                <span className="font-mono text-xs text-ink-700/70">
                  {busy.startsWith('download-all') ? '批量导出中...' : '处理中...'}
                </span>
              )}
              {hint && <span className="ml-auto text-xs font-medium text-clay-700">{hint}</span>}
            </div>
          </div>
        </div>

        {/* 截图源：始终全分辨率挂在屏外，refs 由 setNode 收集 */}
        {open && (
          <div
            aria-hidden="true"
            style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}
          >
            {cards.map((card, i) => (
              <div key={`${form}-${i}`} ref={(el) => setNode(i, el)}>
                <CardBody card={card} form={form} />
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  )
}

// ─────────────────────────────────────────────────────────
//   预览（缩放显示） — 重新渲染一份，跟截图源解耦
// ─────────────────────────────────────────────────────────
function PreviewScaled({ card, form }) {
  const meta = FORM_META[form]
  const previewMaxW = form === 'long' ? 540 : form === 'vertical' ? 320 : 420
  const scale = previewMaxW / meta.width
  const innerRef = useRef(null)
  // 长图高度未知，scale transform 不影响布局，需测量后回写父高度
  const [autoH, setAutoH] = useState(null)

  useLayoutEffect(() => {
    if (meta.height) {
      setAutoH(null)
      return
    }
    const el = innerRef.current
    if (!el) return
    const measure = () => setAutoH(el.offsetHeight * scale)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [meta.height, scale, card])

  const h = meta.height ? meta.height * scale : (autoH ?? 'auto')

  return (
    <div
      style={{
        width: previewMaxW,
        height: h,
        margin: '0 auto',
        overflow: 'hidden',
        borderRadius: 28,
        boxShadow: '0 10px 30px -10px rgba(217,119,87,.35)',
      }}
    >
      <div
        ref={innerRef}
        style={{ width: meta.width, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <CardBody card={card} form={form} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//   下载/操作 下拉菜单
// ─────────────────────────────────────────────────────────
function ActionMenu({ label, items, primary = false, disabled = false }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
          primary
            ? 'bg-clay-500 text-cream-50 shadow-warm hover:bg-clay-600'
            : 'border border-clay-500/30 bg-cream-100 text-clay-700 hover:bg-clay-500/10'
        }`}
      >
        {label} ▾
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-60 overflow-hidden rounded-2xl border border-clay-500/15 bg-cream-50 shadow-warm">
          <ul className="py-1">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => { setOpen(false); it.onClick() }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-ink-800 transition hover:bg-clay-500/10"
                >
                  <span className="mt-0.5 text-base">{it.icon}</span>
                  <span className="flex-1">
                    <span className="font-semibold">{it.label}</span>
                    {it.hint && <p className="text-[11px] text-ink-700/60">{it.hint}</p>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//   单卡渲染（同一份组件被预览和截图源共用）
// ─────────────────────────────────────────────────────────
function CardBody({ card, form }) {
  if (form === 'long') return <LongCard card={card} />
  if (card.kind === 'cover') return <CoverCard card={card} form={form} />
  return <ContentCard card={card} form={form} />
}

// ─── 封 面 ───
function CoverCard({ card, form }) {
  const meta = FORM_META[form]
  const isVertical = form === 'vertical'
  return (
    <div
      style={{
        width: meta.width,
        height: meta.height,
        background:
          'linear-gradient(135deg, #FFF8EE 0%, #FBEFD9 35%, #E8A87C 100%)',
        color: '#26190F',
        fontFamily: '"PingFang SC","Noto Sans SC",sans-serif',
        padding: isVertical ? '120px 90px' : '90px 80px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div>
        <h1 style={{
          fontSize: isVertical ? 110 : 84,
          lineHeight: 1.15,
          fontWeight: 800,
          fontFamily: '"Playfair Display","Noto Serif SC",serif',
          margin: 0,
          color: '#26190F',
          wordBreak: 'break-word',
        }}>{card.title}</h1>
        {card.subtitle && (
          <p style={{
            marginTop: 32,
            fontSize: isVertical ? 34 : 30,
            lineHeight: 1.6,
            color: '#5C4A3A',
            fontWeight: 400,
          }}>{card.subtitle}</p>
        )}
      </div>
    </div>
  )
}

// ─── 正 文 ───
function ContentCard({ card, form }) {
  const meta = FORM_META[form]
  const isVertical = form === 'vertical'
  const isSquare = form === 'square'
  const padding = isVertical ? 90 : isSquare ? 75 : 80
  const baseFont = isVertical ? 40 : isSquare ? 34 : 34

  return (
    <div
      style={{
        width: meta.width,
        height: meta.height,
        background: '#FFFCF7',
        backgroundImage:
          'radial-gradient(circle at 20% -10%, rgba(232,168,124,.20), transparent 50%), radial-gradient(circle at 110% 110%, rgba(217,119,87,.12), transparent 55%)',
        color: '#26190F',
        fontFamily: '"PingFang SC","Noto Sans SC",sans-serif',
        padding,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        fontSize: 20, fontFamily: 'ui-monospace,monospace',
        color: '#A0522D', letterSpacing: 3,
      }}>
        <span>
          {String(card.page).padStart(2, '0')} / {String(card.total).padStart(2, '0')}
        </span>
      </div>
      <div style={{ marginTop: 18, height: 2, width: 60, background: 'rgba(217,119,87,.4)' }} />

      <div style={{
        flex: 1, marginTop: 40,
        display: 'flex', flexDirection: 'column', gap: 24,
        overflow: 'hidden',
      }}>
        {(card.blocks || []).map((b, i) => (
          <RenderBlock key={i} block={b} baseFont={baseFont} />
        ))}
      </div>
    </div>
  )
}

// ─── 长 图 ───
function LongCard({ card }) {
  return (
    <div
      style={{
        width: FORM_META.long.width,
        background: '#FFFCF7',
        backgroundImage:
          'radial-gradient(circle at 0% 0%, rgba(232,168,124,.18), transparent 40%)',
        padding: '100px 90px 110px',
        color: '#26190F',
        fontFamily: '"PingFang SC","Noto Sans SC",sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{
        fontSize: 68, fontWeight: 800,
        fontFamily: '"Playfair Display","Noto Serif SC",serif',
        lineHeight: 1.2, margin: '0 0 16px',
      }}>{card.title || '未命名'}</h1>
      {card.subtitle && (
        <p style={{ fontSize: 28, color: '#5C4A3A', lineHeight: 1.6, margin: '0 0 40px' }}>
          {card.subtitle}
        </p>
      )}
      <div style={{ height: 2, background: 'rgba(217,119,87,.25)', margin: '0 0 40px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {(card.blocks || []).map((b, i) => (
          <RenderBlock key={i} block={b} baseFont={32} />
        ))}
      </div>
    </div>
  )
}

// ─── 块渲染 ───
function RenderBlock({ block, baseFont }) {
  const { type, text } = block
  if (type === 'h1') {
    return <h2 style={{
      margin: 0, fontSize: baseFont * 1.7, fontWeight: 800, lineHeight: 1.25,
      fontFamily: '"Playfair Display","Noto Serif SC",serif', color: '#26190F',
    }}>{text}</h2>
  }
  if (type === 'h2') {
    return <h3 style={{
      margin: 0, fontSize: baseFont * 1.35, fontWeight: 700, lineHeight: 1.3, color: '#26190F',
    }}>{text}</h3>
  }
  if (type === 'h3') {
    return <h4 style={{
      margin: 0, fontSize: baseFont * 1.1, fontWeight: 700, lineHeight: 1.35, color: '#3D2F22',
    }}>{text}</h4>
  }
  if (type === 'hr') {
    return <div style={{ height: 1, background: 'rgba(217,119,87,.25)' }} />
  }
  if (type === 'quote') {
    return <blockquote style={{
      margin: 0, paddingLeft: 22,
      borderLeft: '4px solid rgba(217,119,87,.5)',
      fontSize: baseFont * 0.95, lineHeight: 1.7, color: '#5C4A3A', fontStyle: 'italic',
    }}>{text}</blockquote>
  }
  if (type === 'li' || type === 'ol') {
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
        <span style={{
          flex: '0 0 auto',
          width: 12, height: 12, marginTop: baseFont * 0.55,
          borderRadius: '50%', background: '#D97757',
        }} />
        <span style={{ fontSize: baseFont, lineHeight: 1.65, color: '#3D2F22' }}>{text}</span>
      </div>
    )
  }
  return <p style={{
    margin: 0, fontSize: baseFont, lineHeight: 1.7, color: '#3D2F22',
  }}>{text}</p>
}
