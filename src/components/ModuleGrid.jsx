import { modules } from '../data/modules.js'
import ModuleCard from './ModuleCard.jsx'

export default function ModuleGrid({ onSelect }) {
  return (
    <section id="modules" className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="mb-12 max-w-2xl">
        <p className="section-eyebrow">课程目录</p>
        <h2 className="section-title">12 个模块，循序渐进</h2>
        <p className="mt-3 text-base leading-relaxed text-ink-700">
          每个模块都包含「核心要点 + 反例 vs. 好例」。点击卡片展开完整内容。
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <ModuleCard key={m.id} module={m} onClick={() => onSelect(m)} />
        ))}
      </div>
    </section>
  )
}
