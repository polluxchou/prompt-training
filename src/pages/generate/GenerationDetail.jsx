import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import PromptScoreCard from '../../components/PromptScoreCard.jsx'
import Markdown, { stripLeadingTitle } from '../../components/Markdown.jsx'
import SelectionRetranslate from '../../components/SelectionRetranslate.jsx'
import CardsExportDrawer from '../../components/CardsExportDrawer.jsx'
import {
  deleteGeneration,
  getGeneration,
  markUsed,
  setEnglishContent,
  updateGeneration,
} from '../../lib/generationsStore.js'
import { streamChat } from '../../lib/api.js'
import { buildTranslationMessages } from '../../lib/promptPipeline.js'
import { useConfig } from '../../lib/useConfig.js'
import { useGenerationsState } from '../../lib/useGenerations.js'
import { describeTaskType } from '../../data/taskTypes.js'
import { formatRelative } from '../../lib/schedulesStore.js'
import {
  downloadHtml,
  downloadJpg,
  downloadMd,
  downloadPdf,
  downloadPng,
} from '../../lib/downloadAs.js'

export default function GenerationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { config } = useConfig()
  useGenerationsState() // re-render on external changes
  const gen = getGeneration(id)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: '', content: '' })
  const [calibratedOpen, setCalibratedOpen] = useState(false)
  const [originalOpen, setOriginalOpen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloading, setDownloading] = useState('')
  const [cardsOpen, setCardsOpen] = useState(false)

  // 视图模式：'zh' | 'en' | 'compare'
  // 默认：有英文 → compare（中英对照），否则 zh
  const [viewMode, setViewMode] = useState('zh')
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState('')
  const translateAbortRef = useRef(null)

  const contentRef = useRef(null)
  const zhRef = useRef(null) // 中文容器 → 给 SelectionRetranslate 监听选区
  const downloadMenuRef = useRef(null)

  useEffect(() => {
    if (gen) setDraft({ title: gen.title || '', content: gen.content || '' })
  }, [gen?.id])

  // 切换条目时根据有无英文设默认视图
  useEffect(() => {
    if (gen?.english_content) setViewMode('compare')
    else setViewMode('zh')
  }, [gen?.id, Boolean(gen?.english_content)])

  // 点外面关下载菜单
  useEffect(() => {
    if (!downloadOpen) return
    const onDocClick = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setDownloadOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [downloadOpen])

  // 左侧菜单项（条件包含校准 section）
  const menuItems = useMemo(() => {
    const items = [{ id: 'sec-content', label: '正文', icon: '📄' }]
    if (gen?.calibrated_prompt) {
      items.push({ id: 'sec-calibrated', label: '校准后', icon: '🔧', controls: 'calibrated' })
    }
    items.push({ id: 'sec-original', label: '原始', icon: '📝', controls: 'original' })
    return items
  }, [gen?.calibrated_prompt])

  if (!gen) return <Navigate to="/generate" replace />

  const onSave = () => {
    updateGeneration(gen.id, { title: draft.title, content: draft.content })
    setEditing(false)
  }
  const onCancel = () => {
    setDraft({ title: gen.title || '', content: gen.content || '' })
    setEditing(false)
  }
  const onDelete = () => {
    if (window.confirm(`确认删除「${gen.title}」？`)) {
      deleteGeneration(gen.id)
      navigate('/generate', { replace: true })
    }
  }
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(gen.content || '')
      markUsed(gen.id)
    } catch { /* ignore */ }
  }

  const doTranslate = async () => {
    if (translating || !gen.content?.trim()) return
    setTranslating(true)
    setTranslateError('')
    translateAbortRef.current = new AbortController()
    let acc = ''
    try {
      await streamChat({
        model: gen.model || config.model || 'deepseek-v4-flash',
        temperature: 0.2, // 翻译要稳，温度低
        max_tokens: config.max_tokens,
        messages: buildTranslationMessages({
          chineseContent: gen.content,
          taskType: gen.task_type,
          industryKeywords: gen.industry_keywords,
        }),
        onDelta: (t) => {
          acc += t
          // 流式写回 store 让 UI 实时显示
          setEnglishContent(gen.id, acc)
        },
        signal: translateAbortRef.current.signal,
      })
      // 落定（防止最后一段被吞）
      setEnglishContent(gen.id, acc)
      setViewMode('compare')
    } catch (err) {
      if (err.name !== 'AbortError') setTranslateError(err.message)
    } finally {
      setTranslating(false)
    }
  }

  const stopTranslate = () => translateAbortRef.current?.abort()

  const doDownload = async (format) => {
    if (!gen || downloading) return
    setDownloadOpen(false)
    setDownloading(format)
    const meta = describeTaskType(gen.task_type || {})
    const payload = { title: gen.title, content: gen.content, meta }
    try {
      if (format === 'md')   downloadMd(payload)
      else if (format === 'html') downloadHtml(payload)
      else if (format === 'pdf')  await downloadPdf({ element: contentRef.current, title: gen.title })
      else if (format === 'png')  await downloadPng({ element: contentRef.current, title: gen.title })
      else if (format === 'jpg')  await downloadJpg({ element: contentRef.current, title: gen.title })
      markUsed(gen.id)
    } catch (e) {
      alert(`下载失败：${e.message || e}`)
    } finally {
      setDownloading('')
    }
  }

  const goTo = (item) => () => {
    if (item.controls === 'calibrated') setCalibratedOpen(true)
    if (item.controls === 'original') setOriginalOpen(true)
    // 等一帧 DOM 展开，再滚动
    requestAnimationFrame(() => {
      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <DetailSidebar items={menuItems} onGo={goTo} />

      <header className="mb-6">
        <Link to="/generate" className="text-xs text-ink-700/60 hover:text-ink-900">
          ← 返回历史列表
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          {editing ? (
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="flex-1 rounded-xl border border-clay-500/25 bg-cream-50 px-3 py-2 font-display text-2xl font-bold text-ink-900 outline-none focus:border-clay-500/60"
              maxLength={120}
            />
          ) : (
            <h1 className="section-title">{gen.title || '(未命名)'}</h1>
          )}
          <div className="flex shrink-0 items-center gap-2">
            {editing ? (
              <>
                <button onClick={onCancel} className="btn-ghost text-sm">取消</button>
                <button onClick={onSave} className="btn-primary text-sm">保存</button>
              </>
            ) : (
              <>
                <button onClick={onCopy} className="btn-ghost text-sm" title="复制正文">
                  复制
                </button>
                <button
                  onClick={() => setCardsOpen(true)}
                  className="btn-ghost text-sm"
                  title="把正文渲染成小红书 / 朋友圈 / 抖音 / 长图 等图文卡片，可预览并下载"
                >
                  🖼 导出图文
                </button>
                <DownloadMenu
                  refEl={downloadMenuRef}
                  open={downloadOpen}
                  setOpen={setDownloadOpen}
                  downloading={downloading}
                  onPick={doDownload}
                />
                <button onClick={() => setEditing(true)} className="btn-ghost text-sm">
                  编辑
                </button>
                <button
                  onClick={onDelete}
                  className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                >
                  删除
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12px] text-ink-700/70">
          <Meta label="类型">{describeTaskType(gen.task_type || {}) || '—'}</Meta>
          <Meta label="模型">{gen.model || '—'}</Meta>
          <Meta label="生成">{formatRelative(gen.created_at)}</Meta>
          {gen.updated_at && gen.updated_at !== gen.created_at && (
            <Meta label="更新">{formatRelative(gen.updated_at)}</Meta>
          )}
          {gen.token_usage && (
            <Meta label="tokens">
              {gen.token_usage.prompt_tokens} → {gen.token_usage.completion_tokens}
            </Meta>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* 正文 */}
          <section
            id="sec-content"
            className="scroll-mt-24 rounded-3xl border border-clay-500/15 bg-cream-50/80 p-5 shadow-soft"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-ink-900">📄 正文</h3>
              <div className="flex items-center gap-2">
                {editing ? (
                  <span className="text-[11px] text-ink-700/60">{draft.content.length} 字</span>
                ) : (
                  <>
                    <ViewModeTabs
                      mode={viewMode}
                      setMode={setViewMode}
                      hasEnglish={Boolean(gen.english_content)}
                    />
                    <TranslateButton
                      hasEnglish={Boolean(gen.english_content)}
                      translating={translating}
                      onStart={doTranslate}
                      onStop={stopTranslate}
                    />
                  </>
                )}
              </div>
            </div>

            {translateError && !editing && (
              <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-700">
                翻译失败：{translateError}
              </p>
            )}

            {editing ? (
              <textarea
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                className="block min-h-[300px] w-full rounded-xl border border-clay-500/25 bg-cream-50 p-3 font-mono text-sm leading-relaxed text-ink-900 outline-none transition focus:border-clay-500/60"
              />
            ) : (
              <ContentView
                refEl={contentRef}
                zhRef={zhRef}
                gen={gen}
                mode={viewMode}
                translating={translating}
              />
            )}
          </section>

          {/* 校准后的 prompt（如果有） */}
          {gen.calibrated_prompt && (
            <Collapsible
              id="sec-calibrated"
              icon="🔧"
              title="校准后的提示词（Prompt）"
              open={calibratedOpen}
              onToggle={() => setCalibratedOpen((o) => !o)}
            >
              <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ink-700">
                {gen.calibrated_prompt}
              </pre>
              <p className="mt-2 text-[11px] text-ink-700/55">
                DeepSeek 基于你的任务类型对原始提示词（Prompt）做的校准，最终内容是按这版生成的。
              </p>
            </Collapsible>
          )}

          {/* 原始 prompt */}
          <Collapsible
            id="sec-original"
            icon="📝"
            title="原始提示词（Prompt）"
            open={originalOpen}
            onToggle={() => setOriginalOpen((o) => !o)}
          >
            <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ink-700">
              {gen.prompt}
            </pre>
            {gen.industry_keywords?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {gen.industry_keywords.map((k) => (
                  <span key={k} className="chip">{k}</span>
                ))}
              </div>
            )}
          </Collapsible>
        </div>

        {/* 右侧栏：提示词（Prompt）准确度评分（自动算，不评结果好坏） */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <PromptScoreCard
            prompt={gen.prompt}
            taskType={gen.task_type}
            industryKeywords={gen.industry_keywords}
          />
        </aside>
      </div>

      {/* 选区重译：监听中文容器内的文本选区，提供"重译选段"浮按钮 + 替换 */}
      <SelectionRetranslate
        targetRef={zhRef}
        chineseFull={gen.content || ''}
        englishFull={gen.english_content || ''}
        chineseTitle={gen.title}
        englishTitle={gen.english_title || gen.title}
        taskType={gen.task_type}
        industryKeywords={gen.industry_keywords}
        onReplace={(nextEnglish) => setEnglishContent(gen.id, nextEnglish, gen.english_title)}
      />

      <CardsExportDrawer
        open={cardsOpen}
        onClose={() => setCardsOpen(false)}
        title={gen.title}
        content={gen.content || ''}
      />
    </div>
  )
}

function DetailSidebar({ items, onGo }) {
  const [active, setActive] = useState(items[0]?.id || '')

  useEffect(() => {
    const observers = []
    items.forEach((it) => {
      const el = document.getElementById(it.id)
      if (!el) return
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive(it.id)
          })
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
      )
      io.observe(el)
      observers.push(io)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [items])

  return (
    <aside
      aria-label="详情页导航"
      className="pointer-events-none fixed left-4 top-1/2 z-20 hidden -translate-y-1/2 xl:block"
    >
      <ul className="pointer-events-auto space-y-0.5 rounded-2xl border border-clay-500/15 bg-cream-50/85 p-2 shadow-soft backdrop-blur">
        <li className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-700/50">
          本页菜单
        </li>
        {items.map((it) => {
          const isActive = active === it.id
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={onGo(it)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs font-medium transition ${
                  isActive
                    ? 'bg-clay-500 text-cream-50 shadow-warm'
                    : 'text-ink-700 hover:bg-clay-500/10 hover:text-ink-900'
                }`}
              >
                <span className="text-sm">{it.icon}</span>
                {it.label}
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

function Collapsible({ id, icon, title, open, onToggle, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl border border-clay-500/15 bg-cream-100/40 p-5"
    >
      <button
        type="button"
        onClick={onToggle}
        className="-m-1 flex w-full items-center gap-2 rounded-xl p-1 text-left transition hover:bg-clay-500/5"
        aria-expanded={open}
      >
        <span
          className={`select-none text-ink-700/50 transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden
        >
          ▶
        </span>
        <span className="text-sm font-semibold text-ink-800">
          {icon} {title}
        </span>
        {!open && (
          <span className="ml-auto text-[11px] text-ink-700/55">点击展开</span>
        )}
      </button>
      {open && <div>{children}</div>}
    </section>
  )
}

function ContentView({ refEl, zhRef, gen, mode, translating }) {
  const zh = stripLeadingTitle(gen.content || '', gen.title)
  const en = stripLeadingTitle(gen.english_content || '', gen.english_title || gen.title)
  const showZh = mode === 'zh' || mode === 'compare'
  const showEn = (mode === 'en' || mode === 'compare') && (en || translating)

  return (
    <div
      ref={refEl}
      className={`bg-cream-50 px-1 py-1 ${mode === 'compare' ? 'grid gap-6 md:grid-cols-2' : ''}`}
    >
      {showZh && (
        <div
          ref={zhRef}
          className={mode === 'compare' ? 'border-r border-clay-500/10 pr-6 last:border-0 last:pr-0' : ''}
        >
          {mode === 'compare' && (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-clay-700">
              中文 · 原版 ·
              <span className="ml-1 normal-case tracking-normal text-ink-700/55">
                选中文字可重译这段
              </span>
            </p>
          )}
          <Markdown source={zh} />
        </div>
      )}
      {showEn && (
        <div>
          {mode === 'compare' && (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-clay-700">
              English · Translation
              {translating && <span className="ml-2 text-ink-700/55">流式中…</span>}
            </p>
          )}
          {en ? (
            <Markdown source={en} />
          ) : (
            <p className="text-sm text-ink-700/55">等待 DeepSeek 翻译…</p>
          )}
        </div>
      )}
    </div>
  )
}

function ViewModeTabs({ mode, setMode, hasEnglish }) {
  if (!hasEnglish) return null
  const tabs = [
    { id: 'zh', label: '中文' },
    { id: 'en', label: 'English' },
    { id: 'compare', label: '对照' },
  ]
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-clay-500/15 bg-cream-50 p-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setMode(t.id)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
            mode === t.id
              ? 'bg-clay-500 text-cream-50 shadow-warm'
              : 'text-ink-700 hover:bg-clay-500/10 hover:text-ink-900'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function TranslateButton({ hasEnglish, translating, onStart, onStop }) {
  if (translating) {
    return (
      <button onClick={onStop} className="btn-ghost text-xs">
        ⏹ 停止翻译
      </button>
    )
  }
  return (
    <button
      onClick={onStart}
      className="btn-ghost text-xs"
      title={hasEnglish ? '重新翻译，会覆盖现有英文版' : '调 DeepSeek 1:1 翻译为英文'}
    >
      🌐 {hasEnglish ? '重译' : '翻译为英文'}
    </button>
  )
}

function Meta({ label, children }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[10px] uppercase tracking-wider text-ink-700/50">{label}</span>
      <span>{children}</span>
    </span>
  )
}

const DOWNLOAD_FORMATS = [
  { id: 'md',   label: 'Markdown', ext: '.md',   icon: '📝', hint: '纯文本，最轻量' },
  { id: 'html', label: 'HTML',     ext: '.html', icon: '🌐', hint: '可浏览器打开' },
  { id: 'pdf',  label: 'PDF',      ext: '.pdf',  icon: '📄', hint: '按 A4 切页，含样式' },
  { id: 'png',  label: 'PNG 图片', ext: '.png',  icon: '🖼',  hint: '无损位图' },
  { id: 'jpg',  label: 'JPG 图片', ext: '.jpg',  icon: '🏞',  hint: '压缩位图，体积小' },
]

function DownloadMenu({ refEl, open, setOpen, downloading, onPick }) {
  return (
    <div ref={refEl} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost text-sm disabled:opacity-50"
        disabled={Boolean(downloading)}
        title="导出生成的正文"
      >
        {downloading ? `导出中 · ${downloading}...` : '下载 ▾'}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-clay-500/15 bg-cream-50 shadow-warm">
          <ul className="py-1">
            {DOWNLOAD_FORMATS.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onPick(f.id)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-ink-800 transition hover:bg-clay-500/10"
                >
                  <span className="mt-0.5 text-base">{f.icon}</span>
                  <span className="flex-1">
                    <span className="font-semibold">{f.label}</span>
                    <span className="ml-1 font-mono text-[10px] text-ink-700/55">{f.ext}</span>
                    <p className="text-[11px] text-ink-700/60">{f.hint}</p>
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
