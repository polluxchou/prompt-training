import {
  SCENARIOS,
  SCENARIO_PRESETS,
  PLATFORMS,
  AUDIENCE_ROLES,
  AUDIENCE_REGIONS,
  AUDIENCE_GENDERS,
  formatPlatformLimits,
  summarizeTaskType,
} from '../../data/taskTypes.js'

export default function TaskTypePicker({ value, onChange }) {
  const set = (patch) => {
    const next = { ...value, ...patch }

    // 选了具体场景：套用预设的平台 + 受众（用户不需要再纠结筛选）
    if (patch.scenario && SCENARIO_PRESETS[patch.scenario]) {
      Object.assign(next, SCENARIO_PRESETS[patch.scenario])
      next.scenario = patch.scenario
    }

    // 性别只在「短消息」语境下有意义；切到其他平台时自动清空
    if (next.platform !== 'im' && next.gender) next.gender = ''
    onChange(next)
  }

  const hasScenario = Boolean(value.scenario)
  const showGender = value.platform === 'im'
  const limits = formatPlatformLimits(value.platform)

  return (
    <div className="space-y-5">
      <Group label="应用场景" hint="选了场景即按预设走；选「通用 / 自定义」时再手动拼筛选条件">
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <Chip
              key={s.id || 'generic'}
              active={(value.scenario || '') === s.id}
              onClick={() => set({ scenario: s.id })}
              icon={s.icon !== '·' ? s.icon : null}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </Group>

      {hasScenario && (
        <div className="rounded-2xl border border-clay-500/20 bg-clay-500/5 px-4 py-3 text-xs leading-relaxed text-ink-800">
          已按场景预设 ——{' '}
          <span className="text-ink-900">{summarizeTaskType(value)}</span>
          <div className="mt-1.5 text-ink-700/60">
            想自己调？
            <button
              type="button"
              onClick={() => set({ scenario: '' })}
              className="ml-1 font-medium text-clay-700 underline-offset-2 hover:underline"
            >
              切到「通用 / 自定义」
            </button>
          </div>
        </div>
      )}

      {!hasScenario && (
      <>
      <Group label="平台" hint="决定文风、长度、版式期望">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PLATFORMS.map((p) => (
            <Chip
              key={p.id}
              active={value.platform === p.id}
              onClick={() => set({ platform: p.id })}
              icon={p.icon}
              title={p.hint}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label="受众角色">
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_ROLES.map((r) => (
            <Chip
              key={r.id}
              active={value.role === r.id}
              onClick={() => set({ role: r.id })}
            >
              {r.label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label="受众区域">
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_REGIONS.map((g) => (
            <Chip
              key={g.id}
              active={value.region === g.id}
              onClick={() => set({ region: g.id })}
            >
              {g.label}
            </Chip>
          ))}
        </div>
      </Group>

      {showGender && (
        <Group label="性别（可选）" hint="短消息场景下，称呼/语气会因性别不同">
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_GENDERS.map((g) => (
              <Chip
                key={g.id || 'any'}
                active={(value.gender || '') === g.id}
                onClick={() => set({ gender: g.id })}
              >
                {g.label}
              </Chip>
            ))}
          </div>
        </Group>
      )}
      </>
      )}

      {limits && <LimitsBadge limits={limits} />}
    </div>
  )
}

function LimitsBadge({ limits }) {
  const tone = limits.hard
    ? 'border-amber-500/40 bg-amber-500/10 text-amber-800'
    : 'border-sky-500/30 bg-sky-500/8 text-sky-800'
  return (
    <div className={`rounded-2xl border px-4 py-3 text-xs leading-relaxed ${tone}`}>
      <p className="font-semibold">
        {limits.hard ? '⚠️' : 'ℹ️'}
        <span className="ml-1.5 rounded-full bg-cream-50/70 px-2 py-0.5 font-mono text-[11px] text-ink-800">
          {limits.platform}
        </span>
        <span className="ml-1.5">
          {limits.hard ? '· 硬性字数限制' : '· 推荐字数范围'}
        </span>
      </p>
      <ul className="mt-1.5 space-y-0.5">
        {limits.lines.map((l) => (
          <li key={l}>· {l}</li>
        ))}
      </ul>
      {limits.hard && (
        <p className="mt-1.5 opacity-80">
          已自动写进发给 DeepSeek 的 prompt，超出会被强制压缩重写
        </p>
      )}
    </div>
  )
}

function Group({ label, hint, children }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-ink-900">{label}</span>
        {hint && <span className="text-[11px] text-ink-700/55">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children, icon, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-clay-500/60 bg-clay-500 text-cream-50 shadow-warm'
          : 'border-clay-500/20 bg-cream-50 text-ink-800 hover:border-clay-500/50 hover:bg-clay-500/10'
      }`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}
