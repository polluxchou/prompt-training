import { useMemo } from 'react'
import { scorePrompt, SCORE_WEIGHTS } from '../lib/scorePrompt.js'

const GRADE_COLORS = {
  A: 'text-emerald-700 bg-emerald-500/15',
  B: 'text-sky-700     bg-sky-500/15',
  C: 'text-amber-800   bg-amber-500/15',
  D: 'text-red-700     bg-red-500/15',
}

export default function PromptScoreCard({ prompt, taskType, industryKeywords, compact = false }) {
  const result = useMemo(
    () => scorePrompt({ prompt, taskType, industryKeywords }),
    [prompt, taskType, industryKeywords],
  )
  const { total, grade, breakdown } = result

  return (
    <div
      className={`rounded-3xl border border-clay-500/15 bg-cream-50/80 shadow-soft ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-ink-900">{total}</span>
          <span className="text-xs text-ink-700/60">/ 100</span>
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${GRADE_COLORS[grade]}`}
            title="A ≥85 · B ≥70 · C ≥55 · D <55"
          >
            {grade}
          </span>
        </div>
        <span
          className="text-right text-[10px] uppercase tracking-wider text-ink-700/55"
          title="评的是你写的提示词（Prompt）质量，不是生成结果"
        >
          提示词（Prompt）
          <br />
          准确度评分
        </span>
      </div>
      {!compact && (
        <p className="mt-1 text-[11px] leading-relaxed text-ink-700/65">
          自动评估你输入的<strong>原始提示词（Prompt）</strong>是否完整、扣题；
          与<strong>结果好坏无关</strong>，不进团队"平均分"排名
        </p>
      )}

      <div className="mt-4 space-y-3">
        <Bar
          label="行业相关性"
          weight={SCORE_WEIGHTS.industry}
          sub={breakdown.industry}
        />
        <Bar
          label="提示词完整性"
          weight={SCORE_WEIGHTS.completeness}
          sub={breakdown.completeness}
        />
        <Bar
          label="类型匹配度"
          weight={SCORE_WEIGHTS.typeMatch}
          sub={breakdown.typeMatch}
        />
      </div>

      {!compact && (
        <div className="mt-4 space-y-1 border-t border-clay-500/10 pt-3 text-[11px] text-ink-700/70">
          <Detail label="行业" sub={breakdown.industry} />
          <Detail label="结构" sub={breakdown.completeness} />
          <Detail label="类型" sub={breakdown.typeMatch} />
        </div>
      )}
    </div>
  )
}

function Bar({ label, weight, sub }) {
  const pct = sub.skipped ? 0 : sub.score
  const tone =
    sub.skipped
      ? 'bg-ink-700/15'
      : sub.score >= 80
      ? 'bg-emerald-500'
      : sub.score >= 55
      ? 'bg-amber-500'
      : 'bg-red-500'

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-ink-800">
          {label}
          <span className="ml-1.5 text-[10px] font-normal text-ink-700/55">
            权重 {Math.round(weight * 100)}%
          </span>
        </span>
        <span className="font-mono text-ink-700/80">
          {sub.skipped ? '—' : sub.score}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-clay-500/10">
        <div
          className={`h-full transition-all ${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function Detail({ label, sub }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 text-ink-700/50">{label}</span>
      <span className="min-w-0 flex-1">{sub.detail}</span>
    </div>
  )
}
