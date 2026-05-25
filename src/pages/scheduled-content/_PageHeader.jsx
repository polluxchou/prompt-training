import { Link } from 'react-router-dom'

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
  back,
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {back && (
          <Link
            to={back.to}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-clay-700 hover:underline"
          >
            ← {back.label}
          </Link>
        )}
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  )
}
