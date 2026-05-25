import { Link, useLocation, useNavigate } from 'react-router-dom'

const footerLinks = [
  { hash: 'modules', label: '模块' },
  { hash: 'practice', label: '练习' },
  { hash: 'templates', label: '模板' },
]

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const onTraining = location.pathname === '/'

  const goToSection = (hash) => (e) => {
    e.preventDefault()
    if (!onTraining) {
      navigate('/')
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
      }, 60)
    } else {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="border-t border-clay-500/10 bg-cream-100/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-clay-500 to-ember-500 text-lg shadow-warm">
              🔩
            </span>
            <span className="font-display text-lg font-bold text-ink-900">
              华螺 · 提示词训练营
            </span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-700">
            为华人螺丝网新媒体运营 & 展会营销团队定制的 12 模块 AI 训练课——
            把模糊的"帮我..."变成模型能稳定执行的工作交底。
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-ink-700 sm:items-end">
          <div className="flex gap-4">
            {footerLinks.map((l) => (
              <a
                key={l.hash}
                href={`#${l.hash}`}
                onClick={goToSection(l.hash)}
                className="hover:text-ink-900"
              >
                {l.label}
              </a>
            ))}
            {/* 定时任务入口暂隐藏（搭建中），仍可通过 /scheduled-content 直接访问 */}
          </div>
          <p className="font-mono text-xs text-ink-700/60">
            © {new Date().getFullYear()} 华人螺丝网 · Prompt Training · Built with React + Tailwind
          </p>
        </div>
      </div>
    </footer>
  )
}
