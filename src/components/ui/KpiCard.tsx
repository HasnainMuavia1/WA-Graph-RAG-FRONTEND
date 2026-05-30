import type { ReactNode } from 'react'

type KpiCardProps = {
  label: string
  value: ReactNode
  hint?: string
  badge?: ReactNode
}

export function KpiCard({ label, value, hint, badge }: KpiCardProps) {
  return (
    <div className="card card-pad kpi-card">
      <div className="row-between gap-8">
        <span className="h-section">{label}</span>
        {badge}
      </div>
      <div className="num-xl kpi-card__value">{value}</div>
      {hint ? <p className="kpi-card__hint muted">{hint}</p> : null}
    </div>
  )
}
