import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/useAuth.jsx'

const INVITE_CAP = 100

export default function Profile() {
  const { user, profile, loading, signOut } = useAuth()
  const [copied, setCopied] = useState(false)

  if (loading) return <div className="px-6 py-16 text-center text-ink-600">加载中…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-ink-600">
        资料尚未生成，请刷新或重新登录。
      </div>
    )
  }

  const remaining = Math.max(0, INVITE_CAP - profile.invited_count)
  const inviteUrl = `${window.location.origin}/register?code=${profile.invite_code}`

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-ink-900">我的资料</h1>
      <p className="mt-2 text-ink-600">{profile.email}</p>

      <div className="mt-8 rounded-2xl border border-clay-500/10 bg-cream-50 p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ink-900">我的邀请码</h2>
        <div className="mt-3 flex items-center gap-3">
          <code className="rounded-xl bg-white px-4 py-2 font-mono text-xl tracking-widest text-clay-700">
            {profile.invite_code}
          </code>
          <button onClick={() => copy(profile.invite_code)} className="btn-ghost text-sm">
            {copied ? '已复制' : '复制码'}
          </button>
          <button onClick={() => copy(inviteUrl)} className="btn-ghost text-sm">
            复制邀请链接
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-widest text-ink-500">已成功邀请</div>
            <div className="mt-1 text-2xl font-bold text-ink-900">{profile.invited_count}</div>
          </div>
          <div className="rounded-xl bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-widest text-ink-500">剩余可邀请</div>
            <div className="mt-1 text-2xl font-bold text-ink-900">{remaining}</div>
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-500">
          被邀请人完成邮箱验证后才会计入成功邀请数。每个邀请码最多累计 {INVITE_CAP} 次成功邀请。
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-ghost">返回首页</Link>
        <button onClick={signOut} className="btn-ghost">退出登录</button>
      </div>
    </div>
  )
}
