import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const PORT = Number(process.env.PORT || 3001)
const API_KEY = process.env.DEEPSEEK_API_KEY || ''
const BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '')
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 30)

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const INVITE_CAP = 100

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const buckets = new Map()
function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown'
  const now = Date.now()
  const b = buckets.get(ip) || { count: 0, resetAt: now + 60_000 }
  if (now > b.resetAt) {
    b.count = 0
    b.resetAt = now + 60_000
  }
  b.count += 1
  buckets.set(ip, b)
  if (b.count > RATE_LIMIT_PER_MIN) {
    return res.status(429).json({
      error: 'rate_limit',
      message: `每分钟最多 ${RATE_LIMIT_PER_MIN} 次，请稍等几秒再试`,
    })
  }
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    hasKey: Boolean(API_KEY),
    baseUrl: BASE_URL,
    rateLimitPerMin: RATE_LIMIT_PER_MIN,
  })
})

app.get('/api/balance', async (_req, res) => {
  if (!API_KEY) return res.status(500).json({ error: 'no_key', message: '后端未配置 DEEPSEEK_API_KEY' })
  try {
    const r = await fetch(`${BASE_URL.replace('/v1', '')}/user/balance`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })
    const data = await r.json().catch(() => ({}))
    res.status(r.status).json(data)
  } catch (err) {
    res.status(500).json({ error: 'proxy_error', message: err.message })
  }
})

app.post('/api/chat', rateLimit, async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: 'no_key',
      message: '后端未配置 DEEPSEEK_API_KEY，请在 .env 中设置后重启 server',
    })
  }

  const {
    model = 'deepseek-chat',
    messages,
    temperature = 0.7,
    max_tokens = 4096,
  } = req.body || {}

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'bad_request', message: 'messages is required' })
  }

  const abort = new AbortController()
  res.on('close', () => {
    if (!res.writableEnded) abort.abort()
  })

  try {
    const upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream: true,
      }),
      signal: abort.signal,
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      return res.status(upstream.status).json({
        error: 'upstream',
        status: upstream.status,
        message: errText.slice(0, 500),
      })
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const reader = upstream.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }
    res.end()
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'proxy_error', message: err.message })
    } else {
      res.end()
    }
  }
})

// ============================================================================
// 邀请码注册系统
// ============================================================================

const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // 去掉 0/O/1/I/L
function genInviteCode() {
  let s = ''
  for (let i = 0; i < 8; i += 1) {
    s += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)]
  }
  return s
}

function isValidEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

app.post('/api/auth/register', rateLimit, async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({
      error: 'no_supabase',
      message: '后端未配置 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY',
    })
  }

  const { email: rawEmail, password, inviteCode: rawCode } = req.body || {}
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  const inviteCode = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : ''

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'bad_email', message: '邮箱格式不正确' })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'weak_password', message: '密码至少 8 位' })
  }
  if (!inviteCode) {
    return res.status(400).json({ error: 'missing_invite', message: '请填写邀请码' })
  }

  // 1) 校验邀请码
  const { data: inviter, error: inviterErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, invited_count')
    .eq('invite_code', inviteCode)
    .maybeSingle()

  if (inviterErr) {
    return res.status(500).json({ error: 'db_error', message: inviterErr.message })
  }
  if (!inviter) {
    return res.status(400).json({ error: 'invalid_invite', message: '邀请码无效' })
  }
  if (inviter.invited_count >= INVITE_CAP) {
    return res
      .status(400)
      .json({ error: 'invite_exhausted', message: `该邀请码已达上限（${INVITE_CAP}）` })
  }
  if (inviter.email.toLowerCase() === email) {
    return res.status(400).json({ error: 'self_invite', message: '不能使用自己的邀请码' })
  }

  // 2) 创建 auth user（email_confirm=false，触发 Supabase 默认发验证邮件）
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { invite_code_used: inviteCode },
  })
  if (createErr) {
    const msg = createErr.message || '创建用户失败'
    const code = /already/i.test(msg) ? 'email_taken' : 'create_failed'
    return res.status(400).json({ error: code, message: msg })
  }
  const newUserId = created.user.id

  // 3) 为新用户生成不重复的邀请码（碰撞极小，做 5 次重试兜底）
  let newCode = ''
  for (let i = 0; i < 5; i += 1) {
    const candidate = genInviteCode()
    const { data: dup } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('invite_code', candidate)
      .maybeSingle()
    if (!dup) {
      newCode = candidate
      break
    }
  }
  if (!newCode) {
    await supabaseAdmin.auth.admin.deleteUser(newUserId)
    return res.status(500).json({ error: 'code_gen', message: '邀请码生成失败，请重试' })
  }

  // 4) 写 profiles + invitations
  const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
    id: newUserId,
    email,
    invite_code: newCode,
    invited_by: inviter.id,
  })
  if (profileErr) {
    await supabaseAdmin.auth.admin.deleteUser(newUserId)
    return res.status(500).json({ error: 'db_error', message: profileErr.message })
  }

  const { error: invErr } = await supabaseAdmin.from('invitations').insert({
    inviter_id: inviter.id,
    invitee_id: newUserId,
    invite_code_used: inviteCode,
  })
  if (invErr) {
    // 不撤销用户，但要让上游知道
    console.error('[register] invitations insert failed', invErr)
  }

  return res.json({
    ok: true,
    message: '注册成功，请去邮箱点击验证链接',
    userId: newUserId,
  })
})

app.listen(PORT, () => {
  console.log(`✓ DeepSeek 代理已启动 → http://localhost:${PORT}`)
  console.log(`  API Key:  ${API_KEY ? '✓ 已配置' : '✗ 未配置 (请在 .env 中设置 DEEPSEEK_API_KEY)'}`)
  console.log(`  Supabase: ${supabaseAdmin ? '✓ 已配置' : '✗ 未配置 (注册功能将不可用)'}`)
  console.log(`  上游:     ${BASE_URL}`)
  console.log(`  限流:     ${RATE_LIMIT_PER_MIN} req / min / IP`)
})
