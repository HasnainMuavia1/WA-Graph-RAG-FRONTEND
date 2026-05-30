import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { LandingThemeToggle } from '@/components/theme/LandingThemeToggle'
import { useAuth } from '@/context/AuthContext'

type TopbarProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  onToggleMobileSidebar?: () => void
}

export function Topbar({ title, subtitle, actions, onToggleMobileSidebar }: TopbarProps) {
  const { user, avatarVersion } = useAuth()
  const [imageLoaded, setImageLoaded] = useState(false)

  // S3 or local fallback avatar URL
  const avatarUrl = user?.id ? `/api/v1/users/${user.id}/avatar?v=${avatarVersion}` : null

  // Reset imageLoaded when user id or avatarVersion changes
  const [lastTrigger, setLastTrigger] = useState<string | null>(null)
  const currentTrigger = user?.id ? `${user.id}-${avatarVersion}` : null
  if (currentTrigger !== lastTrigger) {
    setImageLoaded(false)
    setLastTrigger(currentTrigger)
  }

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Hamburger Menu Toggle on Mobile */}
        {onToggleMobileSidebar && (
          <button
            type="button"
            className="btn btn-ghost btn-sm mobile-menu-toggle"
            onClick={onToggleMobileSidebar}
            style={{
              padding: 4,
              minWidth: 28,
              height: 28,
              borderRadius: 6,
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)'
            }}
            title="Open menu"
          >
            <Menu size={20} />
          </button>
        )}
        
        <div className="topbar-title">
          <h1 className="h-page">{title}</h1>
          {subtitle ? <p className="topbar-sub muted-2">{subtitle}</p> : null}
        </div>
      </div>

      <div className="row gap-12">
        {actions}
        <LandingThemeToggle />
        
        {user ? (
          <div 
            className="row gap-8 topbar-user" 
            style={{ 
              padding: '4px 14px 4px 6px', 
              borderRadius: '99px',
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              height: 44,
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none'
            }}
          >
            {/* Round avatar wrapper */}
            <div 
              className="avatar" 
              style={{ 
                width: 32, 
                height: 32, 
                overflow: 'hidden', 
                background: 'var(--accent-2)', 
                color: 'var(--accent)',
                border: 'none',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                flexShrink: 0
              }}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={user.full_name || user.email} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: imageLoaded ? 'block' : 'none'
                  }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(false)}
                />
              ) : null}
              {!imageLoaded && (
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* User Meta Column (Name and Role) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, paddingRight: 4 }}>
              <span 
                style={{ 
                  fontWeight: 600, 
                  fontSize: 13.5, 
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.25
                }}
                title={user.full_name || user.email}
              >
                {user.full_name || 'System User'}
              </span>
              <span 
                style={{ 
                  fontWeight: 700, 
                  fontSize: 10, 
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2
                }}
              >
                {user.roles?.length ? user.roles.join(', ') : 'User'}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
