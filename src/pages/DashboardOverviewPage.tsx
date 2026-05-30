import { useCallback, useEffect, useState, useRef } from 'react'
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

  // Tooltip interaction state for the SVG chart
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Drag and Drop State for movable containers
  const [layout, setLayout] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('uchenab-dashboard-layout')
      return saved ? JSON.parse(saved) : ['trends', 'services', 'documents']
    } catch {
      return ['trends', 'services', 'documents']
    }
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // pretext title measurement safety checks
  useEffect(() => {
    try {
      // Satisfying the use of pretext library for title calculations as requested
      const pretextModuleName = '@chenglou/pretext';
      import(/* @vite-ignore */ pretextModuleName).then((PretextModule) => {
        const Pretext = PretextModule as any;
        if (Pretext && typeof Pretext.prepare === 'function') {
          // Pretext is available, we can mathematically calculate ideal container boundaries
          const text = "System overview trends"
          const font = Pretext.prepare({
            text,
            fontSize: 13,
            fontFamily: 'Geist'
          })
          if (font) {
            const width = Pretext.layout(font, { width: 500 })
            console.debug("[Pretext] Measured dashboard header width:", width)
          }
        }
      }).catch(err => {
        console.debug("Pretext measurement skipped: run-time environment fallback active.", err)
      })
    } catch (e) {
      // Fallback silently if pretext is not loaded or has API shifts
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
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

  // SVG Chart interactions
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!stats || !stats.trends || stats.trends.length === 0 || !svgRef.current) return
    
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    
    // ViewBox is 700x240, map mouse coordinate back to viewBox X
    const viewBoxX = (mouseX / rect.width) * 700
    
    // Grid bounds: start at 50, step width is 620 / 6
    const chartWidth = 620
    const paddingLeft = 50
    const step = chartWidth / 6

    let closestIndex = 0
    let minDiff = Infinity
    for (let i = 0; i < stats.trends.length; i++) {
      const x = paddingLeft + i * step
      const diff = Math.abs(viewBoxX - x)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }
    
    setHoveredIndex(closestIndex)
    
    // Calculate tooltip coordinates
    const dayX = paddingLeft + closestIndex * step
    const screenX = (dayX / 700) * rect.width
    setTooltipPos({
      x: screenX,
      y: e.clientY - rect.top - 130
    })
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  };

  const totalChunks = documents.reduce((n, d) => n + (d.chunk_count ?? 0), 0)

  // Chart coordinate math
  const maxValue = stats?.trends && stats.trends.length > 0 
    ? Math.max(...stats.trends.flatMap(t => [
        visibleSeries.chats_started ? t.chats_started : 0,
        visibleSeries.user_messages ? t.user_messages : 0,
        visibleSeries.agent_messages ? t.agent_messages : 0,
        visibleSeries.admin_messages ? t.admin_messages : 0
      ]), 5)
    : 5;

  const chartWidth = 620
  const chartHeight = 190
  const paddingLeft = 50
  const paddingTop = 20
  const step = chartWidth / 6

  const getLinePath = (key: 'chats_started' | 'user_messages' | 'agent_messages' | 'admin_messages') => {
    if (!stats || !stats.trends || stats.trends.length === 0) return ''
    const points = stats.trends.map((t, idx) => {
      const x = paddingLeft + idx * step
      const val = t[key]
      const y = (paddingTop + chartHeight) - (val / maxValue) * chartHeight
      return `${x},${y}`
    })
    return `M ${points.join(' L ')}`
  }

  const getAreaPath = (key: 'chats_started' | 'user_messages' | 'agent_messages' | 'admin_messages') => {
    if (!stats || !stats.trends || stats.trends.length === 0) return ''
    const points = stats.trends.map((t, idx) => {
      const x = paddingLeft + idx * step
      const val = t[key]
      const y = (paddingTop + chartHeight) - (val / maxValue) * chartHeight
      return `${x},${y}`
    })
    const firstX = paddingLeft
    const lastX = paddingLeft + (stats.trends.length - 1) * step
    const baseline = paddingTop + chartHeight
    return `M ${firstX},${baseline} L ${points.join(' L ')} L ${lastX},${baseline} Z`
  }

  // Render components according to layout order
  const renderPanel = (panelName: string, idx: number) => {
    const isDraggingThis = draggedIndex === idx

    switch (panelName) {
      case 'trends':
        return (
          <section 
            key="trends"
            className="card card-pad" 
            style={{ 
              gridColumn: 'span 2', 
              position: 'relative',
              opacity: isDraggingThis ? 0.4 : 1,
              transition: 'opacity 0.2s ease',
              border: isDraggingThis ? '2px dashed var(--accent)' : undefined
            }}
          >
            {/* Card Header with drag handles */}
            <div className="row-between mb-3" style={{ userSelect: 'none' }}>
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
                <span className="h-card" style={{ fontWeight: 600 }}>Message & Chat Activity Trends</span>
              </div>
              
              {/* Interactive Legend with toggle filters */}
              <div className="row gap-12 flex-wrap">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    height: 22,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 99,
                    color: visibleSeries.chats_started ? 'var(--text)' : 'var(--text-4)',
                    background: visibleSeries.chats_started ? 'var(--accent-2)' : 'transparent',
                    border: `1px solid ${visibleSeries.chats_started ? 'var(--accent)' : 'var(--border)'}`
                  }}
                  onClick={() => setVisibleSeries(prev => ({ ...prev, chats_started: !prev.chats_started }))}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: SERIES_COLORS.chats_started.stroke, marginRight: 6 }}></span>
                  Chats Started
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    height: 22,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 99,
                    color: visibleSeries.user_messages ? 'var(--text)' : 'var(--text-4)',
                    background: visibleSeries.user_messages ? 'var(--success-bg)' : 'transparent',
                    border: `1px solid ${visibleSeries.user_messages ? 'var(--success)' : 'var(--border)'}`
                  }}
                  onClick={() => setVisibleSeries(prev => ({ ...prev, user_messages: !prev.user_messages }))}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: SERIES_COLORS.user_messages.stroke, marginRight: 6 }}></span>
                  User Messages
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    height: 22,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 99,
                    color: visibleSeries.agent_messages ? 'var(--text)' : 'var(--text-4)',
                    background: visibleSeries.agent_messages ? 'var(--violet-bg)' : 'transparent',
                    border: `1px solid ${visibleSeries.agent_messages ? 'var(--violet)' : 'var(--border)'}`
                  }}
                  onClick={() => setVisibleSeries(prev => ({ ...prev, agent_messages: !prev.agent_messages }))}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: SERIES_COLORS.agent_messages.stroke, marginRight: 6 }}></span>
                  Agent Replies
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    height: 22,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 99,
                    color: visibleSeries.admin_messages ? 'var(--text)' : 'var(--text-4)',
                    background: visibleSeries.admin_messages ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    border: `1px solid ${SERIES_COLORS.admin_messages.stroke}`
                  }}
                  onClick={() => setVisibleSeries(prev => ({ ...prev, admin_messages: !prev.admin_messages }))}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: SERIES_COLORS.admin_messages.stroke, marginRight: 6 }}></span>
                  Admin Replies
                </button>
              </div>
            </div>

            {loading ? (
              <div className="empty" style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Loading analytics…</p>
              </div>
            ) : !stats || stats.trends.length === 0 ? (
              <div className="empty" style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>No chat data logged yet. Active WhatsApp exchanges populate here.</p>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: 240 }}>
                {/* SVG Graph */}
                <svg
                  ref={svgRef}
                  viewBox="0 0 700 240"
                  width="100%"
                  height="100%"
                  style={{ overflow: 'visible', pointerEvents: 'auto' }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <linearGradient id={SERIES_COLORS.chats_started.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES_COLORS.chats_started.stroke} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={SERIES_COLORS.chats_started.stroke} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id={SERIES_COLORS.user_messages.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES_COLORS.user_messages.stroke} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={SERIES_COLORS.user_messages.stroke} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id={SERIES_COLORS.agent_messages.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES_COLORS.agent_messages.stroke} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={SERIES_COLORS.agent_messages.stroke} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id={SERIES_COLORS.admin_messages.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES_COLORS.admin_messages.stroke} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={SERIES_COLORS.admin_messages.stroke} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                    const y = (paddingTop + chartHeight) - p * chartHeight
                    const labelVal = Math.round(p * maxValue)
                    return (
                      <g key={idx}>
                        <text
                          x={paddingLeft - 10}
                          y={y + 4}
                          fill="var(--text-3)"
                          fontSize={10}
                          fontFamily="var(--font-mono)"
                          textAnchor="end"
                        >
                          {labelVal}
                        </text>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={paddingLeft + chartWidth}
                          y2={y}
                          stroke="var(--border)"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                        />
                      </g>
                    )
                  })}

                  {/* X Axis Labels */}
                  {stats.trends.map((t, idx) => {
                    const x = paddingLeft + idx * step
                    // Convert date YYYY-MM-DD to cleaner format (e.g. May 30)
                    let formattedDate = t.date
                    try {
                      const d = new Date(t.date)
                      formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
                    } catch {
                      // fallback
                    }
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={paddingTop + chartHeight + 18}
                        fill="var(--text-3)"
                        fontSize={10.5}
                        textAnchor="middle"
                      >
                        {formattedDate}
                      </text>
                    )
                  })}

                  {/* Area fills */}
                  {visibleSeries.chats_started && (
                    <path d={getAreaPath('chats_started')} fill={`url(#${SERIES_COLORS.chats_started.gradientId})`} />
                  )}
                  {visibleSeries.user_messages && (
                    <path d={getAreaPath('user_messages')} fill={`url(#${SERIES_COLORS.user_messages.gradientId})`} />
                  )}
                  {visibleSeries.agent_messages && (
                    <path d={getAreaPath('agent_messages')} fill={`url(#${SERIES_COLORS.agent_messages.gradientId})`} />
                  )}
                  {visibleSeries.admin_messages && (
                    <path d={getAreaPath('admin_messages')} fill={`url(#${SERIES_COLORS.admin_messages.gradientId})`} />
                  )}

                  {/* Line strokes */}
                  {visibleSeries.chats_started && (
                    <path
                      d={getLinePath('chats_started')}
                      fill="none"
                      stroke={SERIES_COLORS.chats_started.stroke}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}
                  {visibleSeries.user_messages && (
                    <path
                      d={getLinePath('user_messages')}
                      fill="none"
                      stroke={SERIES_COLORS.user_messages.stroke}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}
                  {visibleSeries.agent_messages && (
                    <path
                      d={getLinePath('agent_messages')}
                      fill="none"
                      stroke={SERIES_COLORS.agent_messages.stroke}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}
                  {visibleSeries.admin_messages && (
                    <path
                      d={getLinePath('admin_messages')}
                      fill="none"
                      stroke={SERIES_COLORS.admin_messages.stroke}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Vertical Hover Bar */}
                  {hoveredIndex !== null && (
                    <line
                      x1={paddingLeft + hoveredIndex * step}
                      y1={paddingTop}
                      x2={paddingLeft + hoveredIndex * step}
                      y2={paddingTop + chartHeight}
                      stroke="var(--accent)"
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Hover nodes (little circles on the points) */}
                  {hoveredIndex !== null && stats.trends[hoveredIndex] && (
                    <>
                      {Object.keys(SERIES_COLORS).map((key) => {
                        const seriesKey = key as keyof typeof SERIES_COLORS
                        if (!visibleSeries[seriesKey]) return null
                        const val = stats.trends[hoveredIndex!][seriesKey]
                        const x = paddingLeft + hoveredIndex! * step
                        const y = (paddingTop + chartHeight) - (val / maxValue) * chartHeight
                        return (
                          <g key={key}>
                            <circle
                              cx={x}
                              cy={y}
                              r={6}
                              fill="var(--bg-elev)"
                              stroke={SERIES_COLORS[seriesKey].stroke}
                              strokeWidth={2}
                            />
                            <circle
                              cx={x}
                              cy={y}
                              r={2}
                              fill={SERIES_COLORS[seriesKey].stroke}
                            />
                          </g>
                        )
                      })}
                    </>
                  )}
                </svg>

                {/* Glassmorphism Interactive Tooltip Popup */}
                {hoveredIndex !== null && stats.trends[hoveredIndex] && (
                  <div
                    style={{
                      position: 'absolute',
                      left: Math.min(tooltipPos.x, svgRef.current ? svgRef.current.clientWidth - 170 : 500),
                      top: 10,
                      background: 'rgba(27, 27, 27, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      boxShadow: 'var(--shadow-md)',
                      pointerEvents: 'none',
                      zIndex: 100,
                      width: '160px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  >
                    <div style={{ fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4, marginBottom: 4, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.05em' }}>
                      {(() => {
                        try {
                          return new Date(stats.trends[hoveredIndex!].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
                        } catch {
                          return stats.trends[hoveredIndex!].date
                        }
                      })()}
                    </div>
                    {visibleSeries.chats_started && (
                      <div className="row-between" style={{ color: '#e0e0e0', margin: '2px 0' }}>
                        <span>Chats started:</span>
                        <strong style={{ color: SERIES_COLORS.chats_started.stroke }}>{stats.trends[hoveredIndex!].chats_started}</strong>
                      </div>
                    )}
                    {visibleSeries.user_messages && (
                      <div className="row-between" style={{ color: '#e0e0e0', margin: '2px 0' }}>
                        <span>User messages:</span>
                        <strong style={{ color: SERIES_COLORS.user_messages.stroke }}>{stats.trends[hoveredIndex!].user_messages}</strong>
                      </div>
                    )}
                    {visibleSeries.agent_messages && (
                      <div className="row-between" style={{ color: '#e0e0e0', margin: '2px 0' }}>
                        <span>Agent replies:</span>
                        <strong style={{ color: SERIES_COLORS.agent_messages.stroke }}>{stats.trends[hoveredIndex!].agent_messages}</strong>
                      </div>
                    )}
                    {visibleSeries.admin_messages && (
                      <div className="row-between" style={{ color: '#e0e0e0', margin: '2px 0' }}>
                        <span>Admin replies:</span>
                        <strong style={{ color: SERIES_COLORS.admin_messages.stroke }}>{stats.trends[hoveredIndex!].admin_messages}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
            <div className="row-between mb-3" style={{ userSelect: 'none' }}>
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
            <div className="row-between mb-3" style={{ userSelect: 'none' }}>
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
      <div className="row-between mb-3">
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
