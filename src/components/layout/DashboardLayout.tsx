import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Overview', subtitle: 'Health, documents, and ingest' },
  '/dashboard/chat': { title: 'Assistant', subtitle: 'Test the RAG agent' },
  '/dashboard/conversations': { title: 'Conversations', subtitle: 'Live WhatsApp agent conversations' },
  '/dashboard/documents': { title: 'Documents', subtitle: 'Indexed knowledge base files' },
  '/dashboard/users': { title: 'Users', subtitle: 'Manage accounts and role privileges' },
  '/dashboard/settings': { title: 'Settings', subtitle: 'Account, session, and password' },
}

export function DashboardLayout() {
  const { pathname } = useLocation()
  const meta = TITLES[pathname] ?? { title: 'Uchenab' }

  // Collapsed state for desktop sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  // Open state for mobile sidebar drawer
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev)
  }

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      
      {mobileSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 998,
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      <div className="app-main">
        <Topbar 
          title={meta.title} 
          subtitle={meta.subtitle} 
          onToggleMobileSidebar={toggleMobileSidebar}
        />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
