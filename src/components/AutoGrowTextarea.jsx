import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * 自适应高度的 textarea：
 *  - 默认会撑到 `collapsedPx` 上限就停住，超出部分用渐隐遮罩 + "展开全文" 按钮揭示
 *  - 用户聚焦输入框时自动展开（编辑过程中不会"截到一半"）
 *  - 始终自动跟随内容增长，无内部滚动条
 *
 * Props:
 *   value         字符串
 *   onChange      (value) => void
 *   collapsedPx   折叠时的最大高度，默认 140
 *   fadeFrom      Tailwind 渐隐起点色，默认 "from-cream-100"，需与 textarea 背景同色
 *   buttonTone    展开按钮颜色 tone："clay"(默认) / "red" / "cream"(暗底)
 *   className     textarea 自身样式
 *   其余 props    透传给 textarea
 */
export default function AutoGrowTextarea({
  value,
  onChange,
  collapsedPx = 140,
  fadeFrom = 'from-cream-100',
  buttonTone = 'clay',
  className = '',
  ...rest
}) {
  const ref = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [needsExpand, setNeedsExpand] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const sh = el.scrollHeight
    const overflows = sh > collapsedPx + 20
    setNeedsExpand(overflows)
    el.style.height = (expanded || !overflows ? sh : collapsedPx) + 'px'
  }, [value, expanded, collapsedPx])

  useEffect(() => {
    const onResize = () => {
      const el = ref.current
      if (!el) return
      el.style.height = 'auto'
      const sh = el.scrollHeight
      const overflows = sh > collapsedPx + 20
      setNeedsExpand(overflows)
      el.style.height = (expanded || !overflows ? sh : collapsedPx) + 'px'
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [expanded, collapsedPx])

  const toneClass = {
    clay: 'text-clay-700 hover:text-clay-800',
    red: 'text-red-700 hover:text-red-800',
    cream: 'text-cream-100/80 hover:text-cream-50',
  }[buttonTone] || 'text-clay-700 hover:text-clay-800'

  return (
    <div>
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setExpanded(true)}
          className={`${className} resize-none overflow-hidden`}
          {...rest}
        />
        {needsExpand && !expanded && (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t ${fadeFrom} to-transparent`}
          />
        )}
      </div>
      {needsExpand && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium transition ${toneClass}`}
        >
          {expanded ? '收起 ↑' : '展开全文 ↓'}
        </button>
      )}
    </div>
  )
}
