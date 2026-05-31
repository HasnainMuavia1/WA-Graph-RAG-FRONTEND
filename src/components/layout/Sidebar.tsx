import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Icons } from '@/components/icons'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/context/AuthContext'

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const { logout, user } = useAuth()

  const items = [
    { to: '/dashboard', label: 'Overview', icon: Icons.Dashboard, end: true },
    { to: '/dashboard/chat', label: 'Assistant', icon: Icons.Chat, end: false },
    { to: '/dashboard/conversations', label: 'Conversations', icon: Icons.Conversations, end: false },
    { to: '/dashboard/documents', label: 'Documents', icon: Icons.Documents, end: false },
    ...(user?.roles?.includes('admin')
      ? [{ to: '/dashboard/users', label: 'Users', icon: Icons.Users, end: false }]
      : []),
    { to: '/dashboard/settings', label: 'Settings', icon: Icons.Settings, end: false },
  ]

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} style={{ position: 'relative' }}>
      {/* Absolute Positioned Desktop Toggle Button on the vertical line */}
      <button
        type="button"
        className="btn desktop-toggle-btn"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={13} strokeWidth={2.75} /> : <ChevronLeft size={13} strokeWidth={2.75} />}
      </button>

      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-brand-mark" aria-hidden>
            <Logo size={34} />
          </div>
          {!collapsed && (
            <span className="sidebar-brand-text">
              <span className="sidebar-brand-text__top">University</span>
              <span className="sidebar-brand-text__bottom">of Chenab</span>
            </span>
          )}
        </div>
        
        {/* Mobile Close Button only inside brand */}
        <button
          type="button"
          className="btn btn-ghost btn-sm mobile-close-btn"
          onClick={onCloseMobile}
          style={{
            padding: 4,
            minWidth: 24,
            height: 24,
            borderRadius: 6,
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-3)'
          }}
          title="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {!collapsed && <div className="nav-section">Monitor</div>}
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onCloseMobile}
          >
            <Icon />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot" style={{ borderTop: '1px solid var(--border)' }}>
        <button 
          type="button" 
          className="btn btn-ghost btn-sm sidebar-logout" 
          style={{ 
            width: '100%', 
            justifyContent: collapsed ? 'center' : 'flex-start', 
            color: 'var(--danger)', 
            background: 'var(--danger-bg)', 
            borderColor: 'transparent',
            fontWeight: 600,
            transition: 'all 80ms',
            padding: collapsed ? '8px' : '4px 8px'
          }} 
          onClick={() => void logout()}
          title={collapsed ? 'Sign out' : undefined}
        >
          <Icons.LogOut size={14} style={{ color: 'var(--danger)', marginRight: collapsed ? 0 : 4 }} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
