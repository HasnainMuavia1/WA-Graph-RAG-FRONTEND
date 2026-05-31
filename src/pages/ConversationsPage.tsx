import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MarkdownRenderer } from '@/components/chat/ChatMessage'
import { Icons } from '@/components/icons'
import {
  createConversation,
  getConversations,
  getConversationMessages,
  sendConversationMessage,
} from '@/lib/api'
import type { WaConversation, WaMessage } from '@/types/api'

const LIST_POLL_MS = 6000
const THREAD_POLL_MS = 4000

function timeLabel(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function initials(name?: string | null, fallback = '?'): string {
  const base = (name || fallback).trim()
  return base.charAt(0).toUpperCase()
}

export function ConversationsPage() {
  const [conversations, setConversations] = useState<WaConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<WaMessage[]>([])
  const [search, setSearch] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(true)

  // "New conversation" composer
  const [composing, setComposing] = useState(false)
  const [newNumber, setNewNumber] = useState('')
  const [starting, setStarting] = useState(false)

  const threadRef = useRef<HTMLDivElement>(null)
  const lastTsRef = useRef<string | null>(null)

  const active = useMemo(
    () => conversations.find((c) => c.wa_id === activeId) ?? null,
    [conversations, activeId],
  )

  // ── List loading + polling ──────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    try {
      const res = await getConversations({ search: search || undefined, limit: 100 })
      setConversations(res.conversations)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setLoadingList(false)
    }
  }, [search])

  useEffect(() => {
    void loadList()
    const t = setInterval(() => void loadList(), LIST_POLL_MS)
    return () => clearInterval(t)
  }, [loadList])

  // ── Thread loading (full reload on selection) ───────────────────────────────
  const openConversation = useCallback(async (waId: string) => {
    setActiveId(waId)
    setMessages([])
    lastTsRef.current = null
    setLoadingThread(true)
    try {
      const res = await getConversationMessages(waId, { markRead: true })
      setMessages(res.messages)
      lastTsRef.current = res.messages.at(-1)?.created_at ?? null
      // Reflect read state locally without waiting for the next list poll.
      setConversations((prev) =>
        prev.map((c) => (c.wa_id === waId ? { ...c, unread_count: 0 } : c)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoadingThread(false)
    }
  }, [])

  // ── Start a new conversation with any number ────────────────────────────────
  const handleStartConversation = useCallback(async () => {
    const digits = newNumber.replace(/\D/g, '')
    if (digits.length < 6 || starting) {
      setError('Enter a valid number with country code (digits only).')
      return
    }
    setStarting(true)
    setError(null)
    try {
      const res = await createConversation(digits)
      const waId = res.conversation.wa_id
      setComposing(false)
      setNewNumber('')
      await loadList()
      await openConversation(waId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation')
    } finally {
      setStarting(false)
    }
  }, [newNumber, starting, loadList, openConversation])

  // ── Thread delta polling (only fetch newer messages) ────────────────────────
  useEffect(() => {
    if (!activeId) return
    const poll = async () => {
      try {
        const after = lastTsRef.current ?? undefined
        const res = await getConversationMessages(activeId, { after, markRead: false })
        if (res.messages.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id))
            const fresh = res.messages.filter((m) => !seen.has(m.id))
            return fresh.length ? [...prev, ...fresh] : prev
          })
          lastTsRef.current = res.messages.at(-1)?.created_at ?? lastTsRef.current
        }
      } catch {
        /* transient — next tick retries */
      }
    }
    const t = setInterval(() => void poll(), THREAD_POLL_MS)
    return () => clearInterval(t)
  }, [activeId])

  // Auto-scroll to newest message.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // ── Send admin reply ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = draft.trim()
    if (!text || !activeId || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await sendConversationMessage(activeId, text)
      setMessages((prev) => [...prev, res.message])
      lastTsRef.current = res.message.created_at
      setDraft('')
      void loadList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }, [draft, activeId, sending, loadList])

  return (
    <div className={`conv-page${active ? ' has-active' : ''}`}>
      {/* ── Left: conversation list ── */}
      <aside className="conv-list card">
        <div className="conv-list__head">
          <div className="conv-list__head-row">
            <input
              className="input conv-search"
              placeholder="Search by name or number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary conv-new-btn"
              onClick={() => setComposing((v) => !v)}
              title="Start a new conversation"
              aria-label="Start a new conversation"
            >
              {composing ? '×' : '+'}
            </button>
          </div>
          {composing ? (
            <div className="conv-new-form">
              <input
                className="input"
                placeholder="Number with country code, e.g. 923001234567"
                inputMode="numeric"
                value={newNumber}
                autoFocus
                onChange={(e) => setNewNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleStartConversation()
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={starting || newNumber.replace(/\D/g, '').length < 6}
                onClick={() => void handleStartConversation()}
              >
                {starting ? 'Starting…' : 'Start'}
              </button>
            </div>
          ) : null}
        </div>
        <div className="conv-list__scroll">
          {loadingList && conversations.length === 0 ? (
            <p className="muted conv-empty-note">Loading conversations…</p>
          ) : conversations.length === 0 ? (
            <p className="muted conv-empty-note">No conversations yet.</p>
          ) : (
            conversations.map((c) => {
              const label = c.contact_name || c.wa_id
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`conv-item${c.wa_id === activeId ? ' active' : ''}`}
                  onClick={() => void openConversation(c.wa_id)}
                >
                  <div className="conv-item__avatar" aria-hidden>
                    {initials(c.contact_name, c.wa_id)}
                  </div>
                  <div className="conv-item__body">
                    <div className="conv-item__top">
                      <span className="conv-item__name">{label}</span>
                      <span className="conv-item__time">{timeLabel(c.last_message_at)}</span>
                    </div>
                    <div className="conv-item__bottom">
                      <span className="conv-item__preview">
                        {c.last_direction === 'outbound' ? 'You: ' : ''}
                        {c.last_message_preview || '—'}
                      </span>
                      {c.unread_count > 0 ? (
                        <span className="conv-item__badge">{c.unread_count}</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Right: thread ── */}
      <section className="conv-thread-pane card">
        {!active ? (
          <div className="conv-placeholder">
            <Icons.Conversations size={40} strokeWidth={1.5} />
            <p className="h-card" style={{ marginTop: 12 }}>Agent Conversations</p>
            <p className="muted" style={{ maxWidth: 360 }}>
              Select a conversation to read the full WhatsApp thread between the user and the
              agent. You can reply directly — your message is delivered on WhatsApp.
            </p>
          </div>
        ) : (
          <>
            <header className="conv-thread__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm conv-back"
                  onClick={() => setActiveId(null)}
                  title="Back to conversations"
                  aria-label="Back to conversations"
                >
                  ‹
                </button>
                <div className="conv-item__avatar" aria-hidden>
                  {initials(active.contact_name, active.wa_id)}
                </div>
                <div className="conv-thread__meta">
                  <span className="conv-thread__name">{active.contact_name || active.wa_id}</span>
                  <span className="conv-thread__sub mono">
                    +{active.wa_id} · WhatsApp
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${showDebug ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setShowDebug(!showDebug)}
                style={{ borderRadius: '6px', fontSize: '11px', padding: '4px 10px' }}
              >
                {showDebug ? 'Debug: ON' : 'Debug: OFF'}
              </button>
            </header>

            <div className="conv-thread__scroll" ref={threadRef}>
              {loadingThread ? (
                <p className="muted conv-empty-note">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="muted conv-empty-note">No messages in this conversation.</p>
              ) : (
                messages.map((m) => {
                  const isSystemAlert = m.content.startsWith("⚠️ [SYSTEM ALERT]")
                  
                  if (isSystemAlert) {
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'center', margin: '14px 0', width: '100%' }}>
                        <div style={{ maxWidth: '600px', width: '90%', padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderLeft: '4px solid var(--danger)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '18px' }}>🚨</span>
                            <strong style={{ fontSize: '13px', color: 'var(--danger)' }}>Administrative Context Alert</strong>
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)', lineHeight: '1.5' }}>
                            {m.content.replace("⚠️ [SYSTEM ALERT]", "").trim()}
                          </p>
                          
                          {showDebug && m.metadata && (
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px' }}>
                              <details style={{ border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-elev)' }}>
                                <summary style={{ padding: '6px 10px', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}>
                                  Inspect low-confidence search metrics
                                </summary>
                                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: 'var(--text-2)', borderTop: '1px solid var(--border)' }}>
                                  <div><span className="mono">selected_retrieval_tool: </span><code className="mono">{m.metadata.debug?.selected_retrieval_tool || 'none'}</code></div>
                                  {m.metadata.debug?.retrieved_chunks?.length > 0 ? (
                                    <div>
                                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>Retrieved hybrid chunks:</div>
                                      {m.metadata.debug.retrieved_chunks.map((c: any, ci: number) => (
                                        <div key={ci} style={{ padding: '4px 6px', background: 'var(--bg-sunk)', borderRadius: '4px', marginBottom: '4px' }}>
                                          <span style={{ fontWeight: 650 }}>[{ci + 1}] {c.document_title}</span> (score={c.score.toFixed(3)})
                                          <div style={{ color: 'var(--text-3)' }}>{c.content.slice(0, 150)}...</div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div>Retrieved hybrid chunks: none</div>
                                  )}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }

                  const outbound = m.direction === 'outbound'
                  const roleLabel =
                    m.sender === 'admin' ? 'You (admin)' : m.sender === 'agent' ? 'Agent' : 'User'
                  return (
                    <div
                      key={m.id}
                      className={`conv-msg ${outbound ? 'out' : 'in'} ${
                        m.sender === 'admin' ? 'admin' : ''
                      }`}
                      style={{ display: 'flex', flexDirection: 'column' }}
                    >
                      <div className="conv-msg__role">
                        {roleLabel}
                        {m.transcribed ? <span className="conv-msg__voice"> · 🎙️ voice</span> : null}
                      </div>
                      <div className="conv-msg__body">
                        {outbound ? m.content : <MarkdownRenderer content={m.content} />}
                      </div>

                      {/* Visual Debug Panel under normal Agent replies */}
                      {showDebug && m.sender === 'agent' && m.metadata && (
                        <div style={{ margin: '8px 12px 12px 12px', padding: '10px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px', fontSize: '11px', alignSelf: 'stretch', color: '#ffffff' }}>
                          <div style={{ fontWeight: 650, color: '#ffffff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>🛡️</span>
                            <span>Agent Retrieval Provenance</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div><span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>selected_tool: </span><code className="mono" style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '2px 4px', borderRadius: '3px', color: '#ffffff' }}>{m.metadata.debug?.selected_retrieval_tool || 'none'}</code></div>
                            
                            {m.metadata.provenance?.sources?.length > 0 ? (
                              <details style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px' }}>
                                <summary style={{ padding: '4px 8px', cursor: 'pointer', fontWeight: 600, color: '#ffffff' }}>
                                  View search chunks used ({m.metadata.provenance.sources.length})
                                </summary>
                                <div style={{ padding: '6px 8px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {m.metadata.provenance.sources.map((s: any, si: number) => (
                                    <div key={si} style={{ borderBottom: si < m.metadata.provenance.sources.length - 1 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none', paddingBottom: '4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                        <span style={{ color: '#ffffff' }}>[{si + 1}] {s.source_document_name}</span>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Score: {s.confidence_score.toFixed(3)}</span>
                                      </div>
                                      {s.page_section && <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '10px' }}>{s.page_section}</div>}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            ) : (
                              <div style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Citations/sources: none</div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="conv-msg__time">{timeLabel(m.created_at)}</div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="conv-composer-container">
              <div className="conv-composer__textarea-wrapper">
                <textarea
                  className="conv-composer__textarea-modern"
                  placeholder="Type a reply… (delivered on WhatsApp)"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleSend()
                    }
                  }}
                />
              </div>
              <div className="conv-composer__footer row">
                <span className="conv-composer__hint-modern muted">Delivered via Meta WhatsApp Cloud API</span>
                <button
                  type="button"
                  className="conv-composer__send-modern"
                  disabled={sending || !draft.trim()}
                  onClick={() => void handleSend()}
                >
                  <Icons.Send size={13} />
                  <span>{sending ? 'Sending…' : 'Send'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {error ? (
          <div className="creds__alert conv-error" role="alert">
            {error}
          </div>
        ) : null}
      </section>
    </div>
  )
}
