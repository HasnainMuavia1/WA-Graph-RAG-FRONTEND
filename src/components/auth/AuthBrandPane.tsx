import { Logo } from '@/components/Logo'

export function AuthBrandPane() {
  return (
    <aside className="brand-pane" aria-hidden={false}>
      <div className="brand-pane__logo">
        <div className="brand-pane__mark" aria-hidden>
          {/* Brand pane is always dark (#18181b) → force the white logo. */}
          <Logo size={24} variant="white" />
        </div>
        <span className="brand-pane__name">Uchenab</span>
      </div>

      <div>
        <h2 className="brand-pane__headline">
          Dashboard monitoring and documents, in one place.
        </h2>
        <p className="brand-pane__lead">
          Track API and ingestion health, review indexed files, and keep your
          knowledge base up to date without extra clutter.
        </p>
      </div>

      <div className="brand-pane__stats">
        <div className="brand-pane__stat">
          <div className="v">Live</div>
          <div className="l">Health checks</div>
        </div>
        <div className="brand-pane__stat">
          <div className="v mono">Docs</div>
          <div className="l">Upload &amp; list</div>
        </div>
      </div>
    </aside>
  )
}
