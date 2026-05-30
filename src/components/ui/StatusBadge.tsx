type Tone = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'violet'

export function StatusBadge({ label, tone = 'gray' }: { label: string; tone?: Tone }) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" aria-hidden />
      {label}
    </span>
  )
}
