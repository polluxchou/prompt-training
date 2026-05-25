import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Clock from './Clock.jsx'
import { useAuth } from '../lib/useAuth.jsx'

export default function Navbar({ onOpenSettings }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()

  const onTraining = location.pathname === '/'
  const onScheduled = location.pathname.startsWith('/scheduled-content')
  const onGenerate = location.pathname.startsWith('/generate')
  const onAdmin = location.pathname.startsWith('/admin')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 切路由时关掉移动菜单
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <header
      className={`sticky top-0 z-40 transition ${
        scrolled || !onTraining
          ? 'border-b border-clay-500/10 bg-cream-50/85 backdrop-blur-md shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-clay-500 to-ember-500 text-lg shadow-warm">
            🔩
          </span>
          <span className="font-display text-lg font-bold text-ink-900">
            华螺 · 提示词训练营
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          <li>
            <Link
              to="/"
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                onTraining
                  ? 'bg-clay-500 text-cream-50 shadow-warm'
                  : 'text-ink-700 hover:bg-clay-500/10 hover:text-ink-900'
              }`}
            >
              🎓 训练课件
            </Link>
          </li>
          <li>
            <Link
              to="/generate"
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                onGenerate
                  ? 'bg-clay-500 text-cream-50 shadow-warm'
                  : 'text-ink-700 hover:bg-clay-500/10 hover:text-ink-900'
              }`}
            >
              ✍️ 即时生成
            </Link>
          </li>
          {/* 定时任务入口暂隐藏（搭建中），仍可通过 /scheduled-content 直接访问 */}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Clock />
          {!authLoading && (
            user ? (
              <Link
                to="/profile"
                className="rounded-full border border-clay-500/20 px-3 py-2 text-sm font-medium text-ink-800 transition hover:border-clay-500/60 hover:bg-clay-500/10"
                title="我的资料"
              >
                👤 {user.email?.split('@')[0]}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-3 py-2 text-sm font-medium text-ink-700 hover:bg-clay-500/10"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-clay-500 px-3 py-2 text-sm font-medium text-cream-50 shadow-warm hover:bg-clay-600"
                >
                  注册
                </Link>
              </>
            )
          )}
          <Link
            to="/admin/board"
            className={`grid h-10 w-10 place-items-center rounded-full border transition ${
              onAdmin
                ? 'border-clay-500/60 bg-clay-500/15 text-clay-700'
                : 'border-clay-500/20 text-ink-800 hover:border-clay-500/60 hover:bg-clay-500/10'
            }`}
            aria-label="需求管理白板"
            title="需求管理白板 · 内部"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="14" rx="2" />
              <path d="M8 9h8M8 13h5" />
              <path d="M9 18v2M15 18v2" />
            </svg>
          </Link>
          <button
            onClick={onOpenSettings}
            className="grid h-10 w-10 place-items-center rounded-full border border-clay-500/20 text-ink-800 transition hover:border-clay-500/60 hover:bg-clay-500/10"
            aria-label="AI 配置"
            title="AI 配置 · DeepSeek 设置"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Clock />
          <button
            className="rounded-xl border border-clay-500/20 p-2 text-ink-800"
            onClick={() => setOpen((v) => !v)}
            aria-label="菜单"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-clay-500/10 bg-cream-50/95 px-6 py-4">
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                to="/"
                className={`block rounded-xl px-3 py-2 text-sm font-medium ${
                  onTraining
                    ? 'bg-clay-500 text-cream-50'
                    : 'text-ink-800 hover:bg-clay-500/10'
                }`}
              >
                🎓 训练课件
              </Link>
            </li>
            <li>
              <Link
                to="/generate"
                className={`block rounded-xl px-3 py-2 text-sm font-medium ${
                  onGenerate
                    ? 'bg-clay-500 text-cream-50'
                    : 'text-ink-800 hover:bg-clay-500/10'
                }`}
              >
                ✍️ 即时生成
              </Link>
            </li>
            {/* 定时任务入口暂隐藏 */}
            <li>
              <Link
                to="/admin/board"
                className={`block rounded-xl px-3 py-2 text-sm font-medium ${
                  onAdmin
                    ? 'bg-clay-500 text-cream-50'
                    : 'text-ink-800 hover:bg-clay-500/10'
                }`}
              >
                🗂️ 需求白板
              </Link>
            </li>
            {!authLoading && (
              user ? (
                <li>
                  <Link
                    to="/profile"
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-ink-800 hover:bg-clay-500/10"
                  >
                    👤 我的资料
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-ink-800 hover:bg-clay-500/10"
                    >
                      🔑 登录
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="block rounded-xl bg-clay-500 px-3 py-2 text-sm font-medium text-cream-50"
                    >
                      ✨ 注册
                    </Link>
                  </li>
                </>
              )
            )}
            <li className="pt-2">
              <button
                onClick={() => {
                  setOpen(false)
                  onOpenSettings?.()
                }}
                className="btn-ghost w-full text-sm"
              >
                ⚙️ AI 设置
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
