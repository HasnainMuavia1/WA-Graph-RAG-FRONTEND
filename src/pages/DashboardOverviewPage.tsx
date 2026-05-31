import { useCallback, useEffect, useState, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import { Link } from 'react-router-dom'
import { GripVertical } from 'lucide-react'
import { Icons } from '@/components/icons'
import { KpiCard } from '@/components/ui/KpiCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getDocuments, getHealth, triggerIngest, getDashboardStats } from '@/lib/api'
import { formatDate, healthTone, statusTone } from '@/lib/format'
import type { DocumentMetadata, HealthStatus } from '@/types/api'
import type { DashboardStats } from '@/lib/api'

// Centralized CSS colors for charts to match themes
const SERIES_COLORS = {
  chats_started: {
    stroke: 'var(--accent)',
    fill: 'rgba(14, 165, 233, 0.15)',
    gradientId: 'chats-grad'
  },
  user_messages: {
    stroke: 'var(--success)',
    fill: 'rgba(16, 185, 129, 0.15)',
    gradientId: 'user-grad'
  },
  agent_messages: {
    stroke: 'var(--violet)',
    fill: 'rgba(139, 92, 246, 0.15)',
    gradientId: 'agent-grad'
  },
  admin_messages: {
    stroke: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.15)',
    gradientId: 'admin-grad'
  }
}

export function DashboardOverviewPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ingestMsg, setIngestMsg] = useState<string | null>(null)
  const [ingesting, setIngesting] = useState(false)

  // Interactive legend state: show/hide specific graph lines
  const [visibleSeries, setVisibleSeries] = useState({
    chats_started: true,
    user_messages: true,
    agent_messages: true,
    admin_messages: true
  })

  // Plotly chart refs
  const plotlyTrendsRef = useRef<HTMLDivElement | null>(null)
  const plotlyResponseRef = useRef<HTMLDivElement | null>(null)
  const [themeTrigger, setThemeTrigger] = useState(0)

  // Listen to global theme changes to update Plotly colors instantly
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          setThemeTrigger(prev => prev + 1)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => observer.disconnect()
  }, [])

  // Render and update Plotly Trends Chart
  useEffect(() => {
    if (!stats || !stats.trends || stats.trends.length === 0 || !plotlyTrendsRef.current) return

    const xData = stats.trends.map(t => {
      try {
        const d = new Date(t.date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      } catch {
        return t.date
      }
    })

    const data: any[] = []

    if (visibleSeries.chats_started) {
      data.push({
        x: xData,
        y: stats.trends.map(t => t.chats_started),
        name: 'New Chats',
        type: 'scatter',
        mode: 'lines+markers',
        line: {
          color: '#0ea5e9',
          shape: 'spline',
          width: 3
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(14, 165, 233, 0.08)',
        marker: { size: 6 }
      })
    }

    if (visibleSeries.user_messages) {
      data.push({
        x: xData,
        y: stats.trends.map(t => t.user_messages),
        name: 'User Inbound',
        type: 'scatter',
        mode: 'lines+markers',
        line: {
          color: '#10b981',
          shape: 'spline',
          width: 3
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(16, 185, 129, 0.08)',
        marker: { size: 6 }
      })
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
    const zeroLineColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'

    const layout = {
      margin: { l: 30, r: 15, t: 15, b: 30 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      showlegend: false,
      xaxis: {
        showgrid: false,
        linecolor: gridColor,
        tickcolor: gridColor,
        tickfont: { family: 'Geist, sans-serif', size: 10, color: isDark ? '#a1a1aa' : '#71717a' }
      },
      yaxis: {
        gridcolor: gridColor,
        zerolinecolor: zeroLineColor,
        linecolor: 'rgba(0,0,0,0)',
        tickfont: { family: 'Geist Mono, monospace', size: 10, color: isDark ? '#a1a1aa' : '#71717a' }
      },
      hovermode: 'closest' as const
    }

    const config = {
      responsive: true,
      displayModeBar: false
    }

    void Plotly.newPlot(plotlyTrendsRef.current, data, layout, config)
  }, [stats, visibleSeries.chats_started, visibleSeries.user_messages, themeTrigger])

  // Render and update Plotly Response Chart
  useEffect(() => {
    if (!stats || !stats.trends || stats.trends.length === 0 || !plotlyResponseRef.current) return

    const xData = stats.trends.map(t => {
      try {
        const d = new Date(t.date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      } catch {
        return t.date
      }
    })

    const data: any[] = []

    if (visibleSeries.agent_messages) {
      data.push({
        x: xData,
        y: stats.trends.map(t => t.agent_messages),
        name: 'Agent Bot',
        type: 'scatter',
        mode: 'lines+markers',
        line: {
          color: '#8b5cf6',
          shape: 'spline',
          width: 3
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(139, 92, 246, 0.08)',
        marker: { size: 6 }
      })
    }

    if (visibleSeries.admin_messages) {
      data.push({
        x: xData,
        y: stats.trends.map(t => t.admin_messages),
        name: 'Admin Staff',
        type: 'scatter',
        mode: 'lines+markers',
        line: {
          color: '#f59e0b',
          shape: 'spline',
          width: 3
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(245, 158, 11, 0.08)',
        marker: { size: 6 }
      })
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
    const zeroLineColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'

    const layout = {
      margin: { l: 30, r: 15, t: 15, b: 30 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      showlegend: false,
      xaxis: {
        showgrid: false,
        linecolor: gridColor,
        tickcolor: gridColor,
        tickfont: { family: 'Geist, sans-serif', size: 10, color: isDark ? '#a1a1aa' : '#71717a' }
      },
      yaxis: {
        gridcolor: gridColor,
        zerolinecolor: zeroLineColor,
        linecolor: 'rgba(0,0,0,0)',
        tickfont: { family: 'Geist Mono, monospace', size: 10, color: isDark ? '#a1a1aa' : '#71717a' }
      },
      hovermode: 'closest' as const
    }

    const config = {
      responsive: true,
      displayModeBar: false
    }

    void Plotly.newPlot(plotlyResponseRef.current, data, layout, config)
  }, [stats, visibleSeries.agent_messages, visibleSeries.admin_messages, themeTrigger])

  // Drag and Drop State for movable containers
  const [layout, setLayout] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('uchenab-dashboard-layout')
      const parsed = saved ? JSON.parse(saved) : null
      if (parsed && parsed.includes('trends') && !parsed.includes('responseTrends')) {
        const idx = parsed.indexOf('trends')
        const next = [...parsed]
        next.splice(idx + 1, 0, 'responseTrends')
        return next
      }
      return parsed || ['trends', 'responseTrends', 'services', 'documents']
    } catch {
      return ['trends', 'responseTrends', 'services', 'documents']
    }
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Clear SWR cache on manual user reload click
      try {
        const { clearApiCache } = await import('@/lib/apiClient')
        clearApiCache()
      } catch {
        // fail-safe
      }

      const [h, docs, s] = await Promise.all([
        getHealth(),
        getDocuments({ limit: 8 }),
        getDashboardStats().catch(err => {
          console.error("Dashboard stats failed to load:", err)
          return null
        })
      ])
      setHealth(h)
      setDocuments(docs.documents)
      if (s) setStats(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onTriggerIngest() {
    setIngesting(true)
    setIngestMsg(null)
    try {
      const res = await triggerIngest()
      setIngestMsg(res.message)
    } catch (e) {
      setIngestMsg(e instanceof Error ? e.message : 'Ingest failed')
    } finally {
      setIngesting(false)
    }
  }

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault()
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return
    
    const newLayout = [...layout]
    const [draggedItem] = newLayout.splice(draggedIndex, 1)
    newLayout.splice(index, 0, draggedItem)
    
    setLayout(newLayout)
    localStorage.setItem('uchenab-dashboard-layout', JSON.stringify(newLayout))
    setDraggedIndex(null)
  };

  const handleDragEnd = () => {
    setDraggedIndex(null)
  };

  const totalChunks = documents.reduce((n, d) => n + (d.chunk_count ?? 0), 0)

  // Render components according to layout order
  const renderPanel = (panelName: string, idx: number) => {
    const isDraggingThis = draggedIndex === idx

    switch (panelName) {
      case 'trends':
        return (
          <section 
            key="trends"
            className="card card-pad shadow-md hover:shadow-lg transition-shadow duration-300" 
            style={{ 
              gridColumn: 'span 1', 
              position: 'relative',
              opacity: isDraggingThis ? 0.4 : 1,
              transition: 'opacity 0.2s ease',
              border: isDraggingThis ? '2px dashed var(--accent)' : undefined
            }}
          >
            {/* Card Header with drag handles */}
            <div className="row-between mb-3" style={{ userSelect: 'none', flexWrap: 'wrap', gap: '8px' }}>
              <div className="row gap-8">
                <div 
                  className="hover:text-sky-500 transition-colors"
                  style={{ cursor: 'grab', color: 'var(--text-3)' }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  title="Drag to reposition panel"
                >
                  <GripVertical size={16} />
                </div>
                <span className="h-card" style={{ fontWeight: 600 }}>Inbound Traffic Trends</span>
              </div>
              
              {/* Interactive Legend with toggle filters */}
              <div className="row gap-12 flex-wrap">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm transition-all duration-200"
                  style={{
                    height: 22,
                    fontSize: 10,
                    padding: '2px 10px',
                    borderRadius: 99,
                    color: visibleSeries.chats_started ? 'var(--text)' : 'var(--text-4)',
                    background: visibleSeries.chats_started ? 'var(--accent-2)' : 'transparent',
                    border: `1px solid ${visibleSeries.chats_started ? 'var(--accent)' : 'var(--border)'}`
                  }}
                  onClick={() => setVisibleSeries(prev => ({ ...prev, chats_started: !prev.chats_started }))}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: SERIES_COLORS.chats_started.stroke, marginRight: 4 }}></span>
                  New Chats
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm transition-all duration-200"
                  style={{
                    height: 22,
                    fontSize: 10,
                    padding: '2px 10px',
                    borderRadius: 99,
                    color: visibleSeries.user_messages ? 'var(--text)' : 'var(--text-4)',
                    background: visibleSeries.user_messages ? 'var(--success-bg)' : 'transparent',
                    border: `1px solid ${visibleSeries.user_messages ? 'var(--success)' : 'var(--border)'}`
                  }}
                  onClick={() => setVisibleSeries(prev => ({ ...prev, user_messages: !prev.user_messages }))}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: SERIES_COLORS.user_messages.stroke, marginRight: 4 }}></span>
                  User Inbound
                </button>
              </div>
            </div>

            {loading ? (
              <div className="empty" style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Loading analytics…</p>
              </div>
            ) : !stats || stats.trends.length === 0 ? (
              <div className="empty" style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>No chats logged yet.</p>
              </div>
            ) : (
              <div ref={plotlyTrendsRef} style={{ width: '100%', height: 240 }} />
            )}
          </section>
        )

      case 'responseTrends':
        return (
          <section 
            key="responseTrends"
            className="card card-pad shadow-md hover:shadow-lg transition-shadow duration-300" 
            style={{ 
              gridColumn: 'span 1', 
              position: 'relative',
              opacity: isDraggingThis ? 0.4 : 1,
              transition: 'opacity 0.2s ease',
              border: isDraggingThis ? '2px dashed var(--accent)' : undefined
            }}
          >
            {/* Card Header with drag handles */}
            <div className="row-between mb-3" style={{ userSelect: 'none', flexWrap: 'wrap', gap: '8px' }}>
              <div className="row gap-8">
                <div 
                  className="hover:text-sky-500 transition-colors"
                  style={{ cursor: 'grab', color: 'var(--text-3)' }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  title="Drag to reposition panel"
                >
                  <GripVertical size={16} />
                </div>
                <span className="h-card" style={{ fontWeight: 600 }}>Response Resolution Trends</span>
              </div>
              
              {/* Interactive Legend with toggle filters */}
              <div className="row gap-12 flex-wrap">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm transition-all duration-200"
                  style={{
                    height: 22,
                    fontSize: 10,
                    padding: '2px 10px',
                    borderRadius: 99,
                    color: visibleSeries.agent_messages ? 'var(--text)' : 'var(--text-4)',
                    background: visibleSeries.agent_messages ? 'var(--violet-bg)' : 'transparent',
                    border: `1px solid ${visibleSeries.agent_messages ? 'var(--violet)' : 'var(--border)'}`
                  }}
                  onClick={() => setVisibleSeries(prev => ({ ...prev, agent_messages: !prev.agent_messages }))}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: SERIES_COLORS.agent_messages.stroke, marginRight: 4 }}></span>
                  Agent Bot
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm transition-all duration-200"
                  style={{
                    height: 22,
                    fontSize: 10,
                    padding: '2px 10px',
                    borderRadius: 99,
                    color: visibleSeries.admin_messages ? 'var(--text)' : 'var(--text-4)',
                    background: visibleSeries.admin_messages ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    border: `1px solid ${SERIES_COLORS.admin_messages.stroke}`
                  }}
                  onClick={() => setVisibleSeries(prev => ({ ...prev, admin_messages: !prev.admin_messages }))}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: SERIES_COLORS.admin_messages.stroke, marginRight: 4 }}></span>
                  Admin Staff
                </button>
              </div>
            </div>

            {loading ? (
              <div className="empty" style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Loading analytics…</p>
              </div>
            ) : !stats || stats.trends.length === 0 ? (
              <div className="empty" style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>No replies logged yet.</p>
              </div>
            ) : (
              <div ref={plotlyResponseRef} style={{ width: '100%', height: 240 }} />
            )}
          </section>
        )

      case 'services':
        return (
          <section 
            key="services"
            className="card card-pad"
            style={{ 
              opacity: isDraggingThis ? 0.4 : 1,
              transition: 'opacity 0.2s ease',
              border: isDraggingThis ? '2px dashed var(--accent)' : undefined
            }}
          >
            <div className="row-between mb-3" style={{ userSelect: 'none', flexWrap: 'wrap', gap: '8px' }}>
              <div className="row gap-8">
                <div 
                  style={{ cursor: 'grab', color: 'var(--text-3)' }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  title="Drag to reposition panel"
                >
                  <GripVertical size={16} />
                </div>
                <span className="h-card">Services</span>
              </div>
              {health ? (
                <span className="muted mono">{formatDate(health.timestamp)}</span>
              ) : null}
            </div>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>PostgreSQL</td>
                    <td>
                      {health ? (
                        <StatusBadge
                          label={health.database ? 'Up' : 'Down'}
                          tone={healthTone(health.database)}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Neo4j graph</td>
                    <td>
                      {health ? (
                        <StatusBadge
                          label={health.graph_database ? 'Up' : 'Down'}
                          tone={healthTone(health.graph_database)}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>LLM provider</td>
                    <td>
                      {health ? (
                        <StatusBadge
                          label={health.llm_connection ? 'Up' : 'Down'}
                          tone={healthTone(health.llm_connection)}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )

      case 'documents':
        return (
          <section 
            key="documents"
            className="card card-pad"
            style={{ 
              opacity: isDraggingThis ? 0.4 : 1,
              transition: 'opacity 0.2s ease',
              border: isDraggingThis ? '2px dashed var(--accent)' : undefined
            }}
          >
            <div className="row-between mb-3" style={{ userSelect: 'none', flexWrap: 'wrap', gap: '8px' }}>
              <div className="row gap-8">
                <div 
                  style={{ cursor: 'grab', color: 'var(--text-3)' }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  title="Drag to reposition panel"
                >
                  <GripVertical size={16} />
                </div>
                <span className="h-card">Recent documents</span>
              </div>
              <Link to="/dashboard/documents" className="btn btn-ghost btn-sm">
                View all
              </Link>
            </div>
            {loading ? (
              <p className="empty">Loading…</p>
            ) : documents.length === 0 ? (
              <p className="empty">No documents indexed yet. Run ingest from S3.</p>
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Chunks</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="truncate" style={{ maxWidth: 220 }}>
                            {doc.title}
                          </div>
                          <div className="mono muted" style={{ fontSize: 11 }}>
                            {doc.source}
                          </div>
                        </td>
                        <td className="mono">{doc.chunk_count ?? '—'}</td>
                        <td className="muted">{formatDate(doc.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      default:
        return null
    }
  }

  return (
    <div className="page">
      <div className="row-between mb-3" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="muted">System overview</p>
        </div>
        <div className="row gap-8">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
            <Icons.Refresh size={14} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={() => void onTriggerIngest()}
            disabled={ingesting}
          >
            {ingesting ? 'Starting…' : 'Run S3 ingest'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="card card-pad creds__alert mb-3" role="alert">
          {error}
          <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
            Ensure the backend is running on port 8058.
          </p>
        </div>
      ) : null}

      {ingestMsg ? (
        <div className="card card-pad mb-3" style={{ fontSize: 13 }}>
          {ingestMsg}
        </div>
      ) : null}

      {/* KPI Cards Row 1: Core System metrics */}
      <div className="kpi-grid">
        <KpiCard
          label="API status"
          value={loading ? '…' : health?.status ?? '—'}
          hint={health ? `v${health.version}` : undefined}
          badge={
            health ? (
              <StatusBadge label={health.status} tone={statusTone(health.status)} />
            ) : undefined
          }
        />
        <KpiCard
          label="Documents"
          value={loading ? '…' : String(documents.length)}
          hint="Latest page (up to 8)"
        />
        <KpiCard
          label="Chunks (sample)"
          value={loading ? '…' : String(totalChunks)}
          hint="Sum on visible rows"
        />
        <KpiCard
          label="LLM"
          value={loading ? '…' : health?.llm_connection ? 'OK' : 'Down'}
          badge={
            health ? (
              <StatusBadge
                label={health.llm_connection ? 'Connected' : 'Offline'}
                tone={healthTone(health.llm_connection)}
              />
            ) : undefined
          }
        />
      </div>

      {/* KPI Cards Row 2: WhatsApp inbox & stats from Supabase/Redis */}
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          Inbox Activity metrics (Redis Cached)
        </p>
        <div className="kpi-grid">
          <KpiCard
            label="Chats Started"
            value={loading ? '…' : stats?.totals?.total_chats ?? '0'}
            hint="Total conversations"
          />
          <KpiCard
            label="User Messages"
            value={loading ? '…' : stats?.totals?.user_messages ?? '0'}
            hint="Total inbound received"
          />
          <KpiCard
            label="Agent Replies"
            value={loading ? '…' : stats?.totals?.agent_messages ?? '0'}
            hint="Automated bot replies"
          />
          <KpiCard
            label="Admin Replies"
            value={loading ? '…' : stats?.totals?.admin_messages ?? '0'}
            hint="Manual staff answers"
          />
        </div>
      </div>

      {/* Drag-and-Drop rearrangeable dashboard elements container */}
      <div className="dashboard-grid-2 mt-3">
        {layout.map((panelName, idx) => renderPanel(panelName, idx))}
      </div>
    </div>
  )
}
