import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'

// Supabase 默认的验证链接会带 access_token / refresh_token / type=signup
// 在 URL hash 里，supabase-js 的 detectSessionInUrl 会自动消化
export default function VerifyEmail() {
  const [state, setState] = useState('checking') // checking | ok | failed

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.auth.getSession()
      if (cancelled) return
      if (error) {
        setState('failed')
        return
      }
      // 验证成功的话，detectSessionInUrl 已经把 session 写入了
      if (data.session) setState('ok')
      else setState('failed')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-clay-500/10 bg-cream-50 p-8 shadow-soft">
        {state === 'checking' && (
          <>
            <h1 className="font-display text-2xl font-bold text-ink-900">正在验证…</h1>
            <p className="mt-4 text-ink-700">请稍候，正在确认你的邮箱。</p>
          </>
        )}
        {state === 'ok' && (
          <>
            <h1 className="font-display text-2xl font-bold text-ink-900">✅ 邮箱验证成功</h1>
            <p className="mt-4 text-ink-700">
              欢迎加入！邀请你的人已经获得了一次成功邀请记录。
            </p>
            <Link to="/profile" className="btn-primary mt-6 inline-block">
              去看我的邀请码
            </Link>
          </>
        )}
        {state === 'failed' && (
          <>
            <h1 className="font-display text-2xl font-bold text-ink-900">❌ 验证失败</h1>
            <p className="mt-4 text-ink-700">
              链接可能已过期或无效。请尝试重新注册，或直接登录。
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/login" className="btn-primary">
                去登录
              </Link>
              <Link to="/register" className="btn-ghost">
                重新注册
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
