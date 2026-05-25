import { useEffect, useState } from 'react'
import { useConfig } from '../lib/useConfig.js'
import { getHealth, getBalance, streamChat } from '../lib/api.js'
import { DEFAULT_CONFIG } from '../lib/config.js'
import { clearAllCachedOutputs, listCachedKeys } from '../lib/outputCache.js'

const MODEL_OPTIONS = [
  { value: 'deepseek-v4-flash', label: 'deepseek-v4-flash（V4 · 快速，文案首选）' },
  { value: 'deepseek-v4-pro', label: 'deepseek-v4-pro（V4 · 增强，长文/复杂任务）' },
]

export default function SettingsDrawer({ open, onClose }) {
  const { config, update, reset } = useConfig()
  const [test, setTest] = useState({ status: 'idle', message: '', detail: null })
  const [customModel, setCustomModel] = useState(
    MODEL_OPTIONS.some((m) => m.value === config.model) ? '' : config.model,
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const runTest = async () => {
    setTest({ status: 'running', message: '检查中...', detail: null })
    try {
      const health = await getHealth()
      if (!health.hasKey) {
        setTest({
          status: 'error',
          message: '后端代理在线，但未配置 DEEPSEEK_API_KEY',
          detail: '请在项目根目录 .env 中填入 Key 后重启 npm run dev',
        })
        return
      }

      let received = ''
      await streamChat({
        model: config.model,
        messages: [{ role: 'user', content: '回复"测试通过"四个字' }],
        temperature: 0,
        max_tokens: 16,
        onDelta: (t) => (received += t),
      })

      let balanceInfo = null
      try {
        const balance = await getBalance()
        const info = balance?.balance_infos?.[0]
        if (info) {
          balanceInfo = `${info.total_balance} ${info.currency}`
        }
      } catch {
        /* ignore */
      }

      setTest({
        status: 'ok',
        message: `连接成功 · 模型 ${config.model} 已响应`,
        detail: [
          `回包：${received.slice(0, 40) || '(空)'}`,
          balanceInfo ? `账户余额：${balanceInfo}` : null,
          `上游：${health.baseUrl}`,
        ]
          .filter(Boolean)
          .join('\n'),
      })
    } catch (err) {
      setTest({
        status: 'error',
        message: '连接失败',
        detail: err.message,
      })
    }
  }

  const handleModelChange = (e) => {
    update({ model: e.target.value })
  }

  const [cacheCount, setCacheCount] = useState(0)
  const [cacheCleared, setCacheCleared] = useState(false)
  useEffect(() => {
    if (open) setCacheCount(listCachedKeys().length)
  }, [open, cacheCleared])

  const handleClearCache = () => {
    if (cacheCount === 0) return
    const ok = window.confirm(
      `将清空本机缓存的 ${cacheCount} 条 AI 生成结果，无法恢复。继续？`,
    )
    if (!ok) return
    const n = clearAllCachedOutputs()
    setCacheCleared((v) => !v)
    setCacheCount(0)
    alert(`已清空 ${n} 条缓存结果。刷新页面后生效。`)
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream-50 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-clay-500/10 px-7 py-6">
          <div>
            <p className="font-mono text-xs font-semibold tracking-widest text-clay-600/70">
              AI 配置
            </p>
            <h3 className="font-display text-2xl font-bold text-ink-900">
              DeepSeek 设置
            </h3>
            <p className="mt-1 text-sm text-ink-700">
              API Key 由后端代理统一管理，前端不接触
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-700 transition hover:bg-clay-500/10"
            aria-label="关闭"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-6 space-y-6">
          <Field label="模型" hint="V4 开通后请用「自定义」填入官方提供的 model 字符串">
            <select
              value={MODEL_OPTIONS.some((m) => m.value === config.model) ? config.model : '__custom'}
              onChange={(e) => {
                if (e.target.value === '__custom') {
                  update({ model: customModel || 'deepseek-v4-flash' })
                } else {
                  update({ model: e.target.value })
                  setCustomModel('')
                }
              }}
              className="input"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
              <option value="__custom">自定义 model 名称...</option>
            </select>
            {!MODEL_OPTIONS.some((m) => m.value === config.model) && (
              <input
                type="text"
                value={config.model}
                onChange={(e) => {
                  update({ model: e.target.value })
                  setCustomModel(e.target.value)
                }}
                placeholder="例如 deepseek-v4-preview"
                className="input mt-2"
              />
            )}
          </Field>

          <Field
            label={`Temperature · ${config.temperature.toFixed(2)}`}
            hint="0 = 稳定可复现，1 = 富创造力。文案 0.7，结构化抽取 0.2"
          >
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={config.temperature}
              onChange={(e) => update({ temperature: Number(e.target.value) })}
              className="w-full accent-clay-500"
            />
          </Field>

          <Field label="Max Tokens" hint="单次响应最大长度，长文档可调到 8192">
            <input
              type="number"
              min="256"
              max="16384"
              step="256"
              value={config.max_tokens}
              onChange={(e) => update({ max_tokens: Number(e.target.value) })}
              className="input"
            />
          </Field>

          <Field
            label="System 提示词（Prompt）· 默认人设"
            hint='所有"用 AI 跑一下"调用都会带上这段'
          >
            <textarea
              rows={4}
              value={config.systemPrompt}
              onChange={(e) => update({ systemPrompt: e.target.value })}
              className="input font-mono text-xs"
            />
          </Field>

          <div className="rounded-2xl border border-clay-500/15 bg-cream-100/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">连接测试</p>
                <p className="text-xs text-ink-700/80">
                  会发一条最短请求 + 查余额
                </p>
              </div>
              <button
                onClick={runTest}
                disabled={test.status === 'running'}
                className="btn-primary text-sm disabled:opacity-60"
              >
                {test.status === 'running' ? '检查中...' : '▶ 测试连接'}
              </button>
            </div>

            {test.status !== 'idle' && (
              <div
                className={`mt-3 rounded-xl border p-3 text-xs ${
                  test.status === 'ok'
                    ? 'border-emerald-300/50 bg-emerald-50/70 text-emerald-800'
                    : test.status === 'error'
                    ? 'border-red-300/60 bg-red-50/70 text-red-800'
                    : 'border-clay-500/20 bg-cream-50 text-ink-700'
                }`}
              >
                <p className="font-medium">{test.message}</p>
                {test.detail && (
                  <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[11px] opacity-90">
                    {test.detail}
                  </pre>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-clay-500/15 bg-cream-100/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">本机缓存结果</p>
                <p className="text-xs text-ink-700/80">
                  浏览器本地已缓存 <strong>{cacheCount}</strong> 条 AI 生成结果——
                  下次回到对应模块/模板/练习时自动恢复
                </p>
              </div>
              <button
                onClick={handleClearCache}
                disabled={cacheCount === 0}
                className="btn-ghost text-sm disabled:opacity-40"
              >
                🗑 清空全部
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              reset()
              setCustomModel('')
            }}
            className="text-xs font-medium text-ink-700/80 underline-offset-2 hover:text-clay-700 hover:underline"
          >
            恢复默认设置
          </button>
        </div>

        <div className="border-t border-clay-500/10 bg-cream-100/60 px-7 py-3 text-xs text-ink-700/80">
          后端：<code className="font-mono">server/index.js</code> ·
          Key 来源：<code className="font-mono">.env</code> · 改 Key 后需要重启 dev
        </div>
      </aside>

      <style>{`
        .input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(217, 119, 87, 0.25);
          background: rgba(255, 252, 247, 0.8);
          padding: 8px 12px;
          font-size: 14px;
          color: rgb(38, 25, 15);
        }
        .input:focus {
          outline: none;
          border-color: rgba(217, 119, 87, 0.6);
          box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.12);
        }
      `}</style>
    </>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink-900">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-700/70">{hint}</p>}
    </div>
  )
}
