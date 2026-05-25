import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (err) {
      const msg = /Email not confirmed/i.test(err.message)
        ? '邮箱尚未验证，请先去邮箱点击验证链接'
        : err.message
      setError(msg)
      return
    }
    navigate('/profile', { replace: true })
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink-900">登录</h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-800">邮箱</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-clay-500/20 bg-white px-4 py-2.5 text-ink-900 outline-none focus:border-clay-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-800">密码</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-clay-500/20 bg-white px-4 py-2.5 text-ink-900 outline-none focus:border-clay-500"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? '登录中…' : '登录'}
        </button>

        <p className="text-center text-sm text-ink-600">
          还没有账号？{' '}
          <Link to="/register" className="text-clay-700 hover:underline">
            用邀请码注册
          </Link>
        </p>
      </form>
    </div>
  )
}
