import { useEffect, useState } from 'react'

const SECTIONS = [
  { hash: 'mechanics', label: '原理' },
  { hash: 'anatomy',   label: '结构' },
  { hash: 'modules',   label: '12 模块' },
  { hash: 'styles',    label: '风格' },
  { hash: 'practice',  label: '练习' },
  { hash: 'templates', label: '模板' },
]

// 首页专属：左侧悬浮章节定位条，仅在 xl 及以上屏幕显示。
// 通过 IntersectionObserver 跟踪当前章节，点击平滑滚动。
export default function SectionSidebar() {
  const [active, setActive] = useState(SECTIONS[0].hash)

  useEffect(() => {
    const observers = []
    // 用 rootMargin "-30% 0px -60% 0px" 让"接近视口中部"的 section 触发命中
    SECTIONS.forEach(({ hash }) => {
      const el = document.getElementById(hash)
      if (!el) return
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive(hash)
          })
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
      )
      io.observe(el)
      observers.push(io)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const goTo = (hash) => (e) => {
    e.preventDefault()
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    history.replaceState(null, '', `#${hash}`)
  }

  return (
    <aside
      aria-label="章节导航"
      className="pointer-events-none fixed left-4 top-1/2 z-20 hidden -translate-y-1/2 xl:block"
    >
      <ul className="pointer-events-auto space-y-0.5 rounded-2xl border border-clay-500/15 bg-cream-50/85 p-2 shadow-soft backdrop-blur">
        <li className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-700/50">
          本页章节
        </li>
        {SECTIONS.map((s) => {
          const isActive = active === s.hash
          return (
            <li key={s.hash}>
              <a
                href={`#${s.hash}`}
                onClick={goTo(s.hash)}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-clay-500 text-cream-50 shadow-warm'
                    : 'text-ink-700 hover:bg-clay-500/10 hover:text-ink-900'
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full transition ${
                    isActive ? 'bg-cream-50' : 'bg-clay-500/40'
                  }`}
                />
                {s.label}
              </a>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
