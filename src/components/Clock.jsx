import { useEffect, useState } from 'react'

const TIME_ZONE = 'Asia/Shanghai' // UTC+8

const formatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: TIME_ZONE,
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function getShanghaiParts(date) {
  const parts = formatter.formatToParts(date)
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return {
    hh: (lookup.hour || '00').padStart(2, '0'),
    mm: (lookup.minute || '00').padStart(2, '0'),
    ss: (lookup.second || '00').padStart(2, '0'),
  }
}

export default function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { hh, mm, ss } = getShanghaiParts(now)
  const sep = Number(ss) % 2 === 0

  return (
    <div
      className="flex items-baseline gap-1.5 rounded-full border border-clay-500/25 bg-cream-50/85 px-3 py-1.5 shadow-soft backdrop-blur"
      title={`培训用时钟 · 上海时间 (UTC+8) · ${hh}:${mm}:${ss}`}
      aria-label={`上海时间 ${hh} 点 ${mm} 分`}
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-clay-600/80">
        SH
      </span>
      <span className="font-mono text-lg font-bold tracking-wider tabular-nums text-ink-900 leading-none">
        {hh}
        <span
          className={`mx-[2px] inline-block transition-opacity ${
            sep ? 'opacity-100' : 'opacity-30'
          }`}
        >
          :
        </span>
        {mm}
      </span>
      <span className="hidden font-mono text-[10px] tabular-nums text-ink-700/60 sm:inline">
        :{ss}
      </span>
    </div>
  )
}
