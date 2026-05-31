import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatMessage, type ChatMessageModel } from '@/components/chat/ChatMessage'
import { chat, streamChat } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { SearchType } from '@/types/api'

const SESSION_KEY = 'uchenab-chat-session-id'

function newId(): string {
  return crypto.randomUUID()
}

export function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessageModel[]>([])
  const [sessionId, setSessionId] = useState<string | null>(() =>
    sessionStorage.getItem(SESSION_KEY),
  )
  const [searchType, setSearchType] = useState<SearchType>('hybrid')
  const [useStreaming, setUseStreaming] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const persistSession = useCallback((id: string) => {
    setSessionId(id)
    sessionStorage.setItem(SESSION_KEY, id)
  }, [])

  const handleClear = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setSessionId(null)
    sessionStorage.removeItem(SESSION_KEY)
    setError(null)
  }, [])

  const handleSend = useCallback(
    async (text: string) => {
      setError(null)
      const userMsg: ChatMessageModel = { id: newId(), role: 'user', content: text }
      const assistantId = newId()
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: 'assistant', content: '', streaming: true },
      ])
      setBusy(true)
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      const baseRequest = {
        message: text,
        session_id: sessionId,
        user_id: user?.id ?? user?.email ?? undefined,
        search_type: searchType,
      }

      try {
        if (useStreaming) {
          let content = ''
          let tools: ChatMessageModel['tools']
          let metadata: any = null

          for await (const event of streamChat(baseRequest, abortRef.current.signal)) {
            if (event.type === 'session') {
              persistSession(event.session_id)
            } else if (event.type === 'text') {
              content += event.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content, streaming: true } : m,
                ),
              )
            } else if (event.type === 'tools') {
              tools = event.tools
              if ('metadata' in event) {
                metadata = (event as any).metadata
              }
            } else if (event.type === 'error') {
              setError(event.content)
            } else if (event.type === 'end') {
              break
            }
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: content || '(No response)', tools, metadata, streaming: false }
                : m,
            ),
          )
        } else {
          const res = await chat(baseRequest)
          persistSession(res.session_id)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: res.message,
                    tools: res.tools_used,
                    metadata: res.metadata,
                    streaming: false,
                  }
                : m,
            ),
          )
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const msg = err instanceof Error ? err.message : 'Chat failed'
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setBusy(false)
      }
    },
    [sessionId, searchType, useStreaming, user, persistSession],
  )

  return (
    <div className="chat-page">
      {error ? (
        <div className="creds__alert mb-3" role="alert">
          {error}
        </div>
      ) : null}

      {user?.roles?.includes('admin') ? (
        <div className="admin-debug-banner">
          <div className="admin-debug-banner__info">
            <span className="admin-debug-banner__icon">⚙️</span>
            <div>
              <strong className="admin-debug-banner__title">Admin Debug Mode</strong>
              <div className="admin-debug-banner__subtitle">
                Inspect prompts, retrieved hybrid chunks, Neo4j graph facts, and verdicts
              </div>
            </div>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${showDebug ? 'btn-accent' : 'btn-ghost'}`}
            onClick={() => setShowDebug(!showDebug)}
            style={{ borderRadius: '6px', fontSize: '12px', padding: '4px 12px', whiteSpace: 'nowrap' }}
          >
            {showDebug ? 'Disable Debug Overlay' : 'Enable Debug Overlay'}
          </button>
        </div>
      ) : null}

      <div className="chat-thread card" ref={threadRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p className="h-card">RAG assistant</p>
            <p className="muted">
              Ask questions about ingested documents. Choose hybrid, vector, or graph search
              before sending.
            </p>
            <ul className="chat-suggestions muted">
              <li>What documents are in the knowledge base?</li>
              <li>Summarize the main topics from recent uploads.</li>
              <li>Compare key facts across sources.</li>
            </ul>
          </div>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} message={m} showDebug={showDebug} />)
        )}
      </div>

      <ChatComposer
        disabled={busy}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
        useStreaming={useStreaming}
        onStreamingChange={setUseStreaming}
        onSend={(msg) => void handleSend(msg)}
        onClear={handleClear}
      />

      {sessionId ? (
        <p className="chat-session mono muted">
          Session: {sessionId.slice(0, 8)}…
        </p>
      ) : null}
    </div>
  )
}
