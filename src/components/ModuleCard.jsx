export default function ModuleCard({ module, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card group relative flex h-full flex-col items-start text-left hover:-translate-y-1 hover:shadow-warm hover:border-clay-500/30"
    >
      <div className="mb-4 flex w-full items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-clay-400/20 to-ember-500/20 text-2xl">
          {module.icon}
        </div>
        <span className="font-mono text-xs font-semibold tracking-widest text-clay-600/70">
          {module.number}
        </span>
      </div>

      <h3 className="font-display text-xl font-bold text-ink-900">
        {module.title}
      </h3>
      <p className="mt-1 text-sm font-medium text-clay-600">{module.subtitle}</p>

      <p className="mt-3 text-sm leading-relaxed text-ink-700 line-clamp-3">
        {module.summary}
      </p>

      <div className="mt-5 flex items-center gap-1 text-sm font-medium text-clay-600 transition group-hover:gap-2 group-hover:text-clay-700">
        查看详情
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </button>
  )
}
