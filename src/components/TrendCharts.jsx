import { useMemo } from 'react'
import { CURRENT_USER } from '../lib/generationsStore.js'
import { dailySeries } from '../lib/generationStats.js'

// ── 趋势卡组件 ────────────────────────────────────────
// 上：提示词均分累计曲线（截止到当日的累计平均）
// 下：Token 单日用量曲线（每日 prompt + completion 之和）

export default function TrendCharts({ items, user = CURRENT_USER, days = 30 }) {
  const series = useMemo(() => dailySeries(items, user, days), [items, user, days])

  // 取最后一个有效值作为"当前"展示数值
  const lastScore = useMemo(() => {
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].cumAvgScore !== null) return series[i].cumAvgScore
    }
    return null
  }, [series])

  const todayTokens = series[series.length - 1]?.tokens || 0
  const totalTokens = useMemo(
    () => series.reduce((acc, s) => acc + s.tokens, 0),
    [series],
  )

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ChartCard
        title="Prompt 均分 · 累计趋势"
        subtitle={`截止到当日的累计平均分 · 近 ${days} 天`}
        latestLabel="当前均分"
        latestValue={lastScore === null ? '—' : lastScore}
        suffix="/ 100"
        accent="#10b981"
        accentBg="rgba(16,185,129,0.15)"
        series={series}
        accessor={(s) => s.cumAvgScore}
        yMin={0}
        yMax={100}
        formatY={(v) => v}
        hoverFormat={(s) =>
          s.cumAvgScore === null
            ? '尚无评分'
            : `${s.cumAvgScore} 分（累计 ${s.cumScoreCount} 篇）`
        }
      />
      <ChartCard
        title="Token · 单日用量"
        subtitle={`仅当日的 prompt + completion 合计 · 近 ${days} 天`}
        latestLabel="今天"
        latestValue={formatTokens(todayTokens)}
        suffix={`合计 ${formatTokens(totalTokens)}`}
        accent="#d97757"
        accentBg="rgba(217,119,87,0.18)"
        series={series}
        accessor={(s) => s.tokens}
        yMin={0}
        yMax={null}
        formatY={formatTokens}
        hoverFormat={(s) => `${formatTokens(s.tokens)} tokens`}
      />
    </div>
  )
}

// ── 单卡 ─────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  latestLabel,
  latestValue,
  suffix,
  accent,
  accentBg,
  series,
  accessor,
  yMin,
  yMax,
  formatY,
  hoverFormat,
}) {
  return (
    <div className="rounded-3xl border border-clay-500/15 bg-cream-50/80 p-4 shadow-soft">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-bold text-ink-900">{title}</h3>
          <p className="mt-0.5 text-[11px] text-ink-700/60">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-ink-700/55">
            {latestLabel}
          </p>
          <p className="font-display text-xl font-bold text-ink-900">
            {latestValue}
          </p>
          {suffix && (
            <p className="font-mono text-[10px] text-ink-700/55">{suffix}</p>
          )}
        </div>
      </div>
      <MiniLineChart
        series={series}
        accessor={accessor}
        yMin={yMin}
        yMax={yMax}
        accent={accent}
        accentBg={accentBg}
        formatY={formatY}
        hoverFormat={hoverFormat}
      />
    </div>
  )
}

// ── 极简 SVG 折线 ────────────────────────────────────

function MiniLineChart({
  series,
  accessor,
  yMin = 0,
  yMax = null,
  accent = '#d97757',
  accentBg = 'rgba(217,119,87,0.18)',
  formatY = (v) => v,
  hoverFormat,
}) {
  const W = 320
  const H = 120
  const PAD_L = 28
  const PAD_R = 8
  const PAD_T = 8
  const PAD_B = 18

  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B

  const values = series.map(accessor)
  const numeric = values.filter((v) => typeof v === 'number')
  const computedMax = numeric.length ? Math.max(...numeric) : 0
  const computedMin = numeric.length ? Math.min(...numeric) : 0

  const top = yMax !== null ? yMax : Math.max(computedMax, 1) * 1.1 || 1
  const bot = yMin !== null ? yMin : Math.min(computedMin, 0)
  const range = Math.max(top - bot, 0.0001)

  const N = series.length
  const xAt = (i) => PAD_L + (N <= 1 ? 0 : (i / (N - 1)) * innerW)
  const yAt = (v) => PAD_T + (1 - (v - bot) / range) * innerH

  // 折线 path（断点：null 值停掉）
  const segments = []
  let cur = []
  for (let i = 0; i < N; i++) {
    const v = values[i]
    if (typeof v === 'number') {
      cur.push(`${xAt(i)},${yAt(v)}`)
    } else if (cur.length) {
      segments.push(cur)
      cur = []
    }
  }
  if (cur.length) segments.push(cur)

  // 面积 path（最后一段）
  const lastSeg = segments[segments.length - 1] || []
  let areaPath = ''
  if (lastSeg.length > 1) {
    const xs = lastSeg.map((p) => Number(p.split(',')[0]))
    const x0 = xs[0]
    const x1 = xs[xs.length - 1]
    const baseline = yAt(bot)
    areaPath = `M ${x0},${baseline} L ${lastSeg.join(' L ')} L ${x1},${baseline} Z`
  }

  // y 轴刻度（3 条）
  const yTicks = [bot, bot + range / 2, top]

  // x 轴日期：首 / 中 / 末
  const tickIdxs = N >= 3 ? [0, Math.floor(N / 2), N - 1] : [0, N - 1]
  const dateLabel = (d) => `${d.getMonth() + 1}/${d.getDate()}`

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
        {/* 背景网格 */}
        {yTicks.map((tv, i) => (
          <line
            key={i}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={yAt(tv)}
            y2={yAt(tv)}
            stroke="rgba(92,74,58,0.10)"
            strokeWidth="1"
            strokeDasharray={i === 0 ? '0' : '2 3'}
          />
        ))}

        {/* y 轴刻度文字 */}
        {yTicks.map((tv, i) => (
          <text
            key={`y-${i}`}
            x={PAD_L - 4}
            y={yAt(tv) + 3}
            textAnchor="end"
            fontSize="9"
            fill="rgba(92,74,58,0.55)"
            fontFamily="ui-monospace, monospace"
          >
            {formatY(Math.round(tv))}
          </text>
        ))}

        {/* 面积 */}
        {areaPath && <path d={areaPath} fill={accentBg} />}

        {/* 折线 */}
        {segments.map((seg, si) => (
          <polyline
            key={`seg-${si}`}
            points={seg.join(' ')}
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* 数据点 */}
        {series.map((s, i) => {
          const v = values[i]
          if (typeof v !== 'number') return null
          return (
            <g key={`pt-${i}`}>
              <circle
                cx={xAt(i)}
                cy={yAt(v)}
                r="2.5"
                fill={accent}
                opacity="0.85"
              />
              {/* hover 触发的透明大圆 + tooltip */}
              <circle
                cx={xAt(i)}
                cy={yAt(v)}
                r="8"
                fill="transparent"
              >
                <title>
                  {dateLabel(s.date)} · {hoverFormat ? hoverFormat(s) : formatY(v)}
                </title>
              </circle>
            </g>
          )
        })}

        {/* x 轴日期 */}
        {tickIdxs.map((i) => (
          <text
            key={`x-${i}`}
            x={xAt(i)}
            y={H - 4}
            textAnchor={i === 0 ? 'start' : i === N - 1 ? 'end' : 'middle'}
            fontSize="9"
            fill="rgba(92,74,58,0.55)"
            fontFamily="ui-monospace, monospace"
          >
            {dateLabel(series[i].date)}
          </text>
        ))}
      </svg>
    </div>
  )
}

function formatTokens(n) {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}
