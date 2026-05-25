import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function Register() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState((params.get('code') || '').toUpperCase())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, inviteCode }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(data.message || '注册失败，请稍后再试')
      } else {
        setDone(true)
      }
    } catch (err) {
      setError(err.message || '网络错误')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-clay-500/10 bg-cream-50 p-8 shadow-soft">
          <h1 className="font-display text-2xl font-bold text-ink-900">📬 验证邮件已发送</h1>
          <p className="mt-4 text-ink-700">
            我们刚刚向 <strong>{email}</strong> 发送了一封验证邮件。请点击邮件里的链接完成验证，邀请人才会被计入成功邀请数。
          </p>
          <p className="mt-4 text-sm text-ink-500">没收到？检查垃圾邮件箱，或几分钟后重试。</p>
          <Link to="/login" className="btn-primary mt-6 inline-block">
            去登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink-900">注册账号</h1>
      <p className="mt-2 text-ink-600">使用一位已注册成员的邀请码加入。</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-800">邮箱</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-clay-500/20 bg-white px-4 py-2.5 text-ink-900 outline-none focus:border-clay-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-800">密码</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-clay-500/20 bg-white px-4 py-2.5 text-ink-900 outline-none focus:border-clay-500"
            placeholder="至少 8 位"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-800">邀请码</label>
          <input
            type="text"
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-xl border border-clay-500/20 bg-white px-4 py-2.5 font-mono tracking-widest text-ink-900 outline-none focus:border-clay-500"
            placeholder="8 位邀请码"
            maxLength={8}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? '提交中…' : '注册'}
        </button>

        <p className="text-center text-sm text-ink-600">
          已有账号？{' '}
          <Link to="/login" className="text-clay-700 hover:underline">
            去登录
          </Link>
        </p>
      </form>
    </div>
  )
}
