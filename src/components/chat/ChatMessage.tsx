import type { ToolCall } from '@/types/api'

export type ChatMessageModel = {
  id: string
  role: 'user' | 'assistant'
  content: string
  tools?: ToolCall[]
  streaming?: boolean
  metadata?: any
}

type ChatMessageProps = {
  message: ChatMessageModel
  showDebug?: boolean
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  let parts: { type: 'text' | 'bold' | 'italic' | 'code' | 'highlight'; content: string }[] = [
    { type: 'text', content: text }
  ]

  // 1. Parse inline code: `text`
  parts = parts.flatMap((p) => {
    if (p.type !== 'text') return p
    const split = p.content.split(/(`[^`]+`)/g)
    return split.map((chunk) => {
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return { type: 'code', content: chunk.slice(1, -1) }
      }
      return { type: 'text', content: chunk }
    })
  })

  // 2. Parse bold: **text**
  parts = parts.flatMap((p) => {
    if (p.type !== 'text') return p
    const split = p.content.split(/(\*\*[^*]+\*\*)/g)
    return split.map((chunk) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return { type: 'bold', content: chunk.slice(2, -2) }
      }
      return { type: 'text', content: chunk }
    })
  })

  // 3. Parse italics: *text*
  parts = parts.flatMap((p) => {
    if (p.type !== 'text') return p
    const split = p.content.split(/(\*[^*]+\*)/g)
    return split.map((chunk) => {
      if (chunk.startsWith('*') && chunk.endsWith('*')) {
        return { type: 'italic', content: chunk.slice(1, -1) }
      }
      return { type: 'text', content: chunk }
    })
  })

  // 4. Parse highlights: ==text==
  parts = parts.flatMap((p) => {
    if (p.type !== 'text') return p
    const split = p.content.split(/(==[^=]+==)/g)
    return split.map((chunk) => {
      if (chunk.startsWith('==') && chunk.endsWith('==')) {
        return { type: 'highlight', content: chunk.slice(2, -2) }
      }
      return { type: 'text', content: chunk }
    })
  })

  // 5. Parse inline math: $text$
  parts = parts.flatMap((p) => {
    if (p.type !== 'text') return p
    const split = p.content.split(/(\$[^\$]+\$)/g)
    return split.map((chunk) => {
      if (chunk.startsWith('$') && chunk.endsWith('$')) {
        return { type: 'code', content: chunk.slice(1, -1) }
      }
      return { type: 'text', content: chunk }
    })
  })

  return parts.map((p, idx) => {
    switch (p.type) {
      case 'code':
        return (
          <code 
            key={idx} 
            className="mono" 
            style={{ 
              background: 'var(--bg-sunk)', 
              color: 'var(--accent)', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              fontSize: '0.9em',
              fontWeight: 500
            }}
          >
            {p.content}
          </code>
        )
      case 'bold':
        return <strong key={idx} style={{ fontWeight: 700, color: 'var(--text)' }}>{p.content}</strong>
      case 'italic':
        return <em key={idx} style={{ fontStyle: 'italic' }}>{p.content}</em>
      case 'highlight':
        return (
          <mark 
            key={idx} 
            style={{ 
              background: 'var(--accent-2)', 
              color: 'var(--text)', 
              padding: '0 4px', 
              borderRadius: '2px',
              fontWeight: 500
            }}
          >
            {p.content}
          </mark>
        )
      default:
        return p.content
    }
  })
}

export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null

  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let currentTable: string[][] = []
  let isTable = false
  let currentList: { type: 'ol' | 'ul'; items: string[] } | null = null
  let currentCodeBlock: { lang: string; lines: string[] } | null = null

  const flushTable = (key: number) => {
    if (currentTable.length === 0) return
    
    let headers: string[] = []
    let rows: string[][] = []
    
    if (currentTable.length >= 2 && currentTable[1].every(cell => /^:?-+:?$/.test(cell.trim()))) {
      headers = currentTable[0]
      rows = currentTable.slice(2)
    } else {
      rows = currentTable
    }

    blocks.push(
      <div key={`table-${key}`} className="table-responsive" style={{ margin: '14px 0', overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          {headers.length > 0 && (
            <thead style={{ background: 'var(--bg-sunk)', borderBottom: '1px solid var(--border)', fontWeight: 650 }}>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', color: 'var(--text)' }}>{parseInlineMarkdown(h.trim())}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '10px 14px', color: 'var(--text-2)' }}>{parseInlineMarkdown(cell.trim())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    currentTable = []
    isTable = false
  }

  const flushList = (key: number) => {
    if (!currentList) return
    const ListTag = currentList.type
    blocks.push(
      <ListTag 
        key={`list-${key}`} 
        style={{ 
          margin: '10px 0', 
          paddingLeft: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px',
          listStyleType: currentList.type === 'ol' ? 'decimal' : 'disc'
        }}
      >
        {currentList.items.map((item, idx) => (
          <li key={idx} style={{ color: 'var(--text-2)', fontSize: '13.5px', lineHeight: '1.5' }}>
            {parseInlineMarkdown(item)}
          </li>
        ))}
      </ListTag>
    )
    currentList = null
  }

  const flushCodeBlock = (key: number) => {
    if (!currentCodeBlock) return
    blocks.push(
      <div 
        key={`code-${key}`} 
        style={{ 
          margin: '14px 0', 
          background: 'var(--bg-sunk)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {currentCodeBlock.lang && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)' }}>
            <span>{currentCodeBlock.lang}</span>
          </div>
        )}
        <pre style={{ margin: 0, padding: '12px', overflowX: 'auto', fontSize: '12px', lineHeight: '1.4', fontFamily: 'monospace' }}>
          <code>{currentCodeBlock.lines.join('\n')}</code>
        </pre>
      </div>
    )
    currentCodeBlock = null
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    const trimmed = line.trim()

    // 1. Handle Code Blocks
    if (trimmed.startsWith('```')) {
      if (currentCodeBlock) {
        flushCodeBlock(idx)
      } else {
        if (isTable) flushTable(idx)
        if (currentList) flushList(idx)
        
        const lang = trimmed.slice(3).trim()
        currentCodeBlock = { lang, lines: [] }
      }
      continue
    }

    if (currentCodeBlock) {
      currentCodeBlock.lines.push(line)
      continue
    }

    // 2. Handle Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1) {
      if (currentList) flushList(idx)
      isTable = true
      const cells = trimmed.slice(1, -1).split('|')
      currentTable.push(cells)
      continue
    } else if (isTable) {
      flushTable(idx)
    }

    // 3. Handle Ordered Lists (e.g. 1. Item)
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
    if (olMatch) {
      if (isTable) flushTable(idx)
      const content = olMatch[3]
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(content)
      } else {
        if (currentList) flushList(idx)
        currentList = { type: 'ol', items: [content] }
      }
      continue
    }

    // 4. Handle Unordered Lists (e.g. - Item or * Item or • Item)
    const ulMatch = line.match(/^(\s*)([-*•])\s+(.*)$/)
    if (ulMatch) {
      if (isTable) flushTable(idx)
      const content = ulMatch[3]
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(content)
      } else {
        if (currentList) flushList(idx)
        currentList = { type: 'ul', items: [content] }
      }
      continue
    }

    if (currentList) {
      flushList(idx)
    }

    // 5. Handle Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      if (isTable) flushTable(idx)
      if (currentList) flushList(idx)
      const level = headingMatch[1].length
      const title = headingMatch[2]
      
      const headingStyle = { 
        marginTop: '16px', 
        marginBottom: '8px', 
        fontWeight: 700, 
        color: 'var(--text)',
        fontSize: level === 1 ? '1.35em' : level === 2 ? '1.2em' : '1.05em'
      }
      
      const headingText = parseInlineMarkdown(title)
      if (level === 1) {
        blocks.push(<h3 key={idx} style={headingStyle}>{headingText}</h3>)
      } else if (level === 2) {
        blocks.push(<h4 key={idx} style={headingStyle}>{headingText}</h4>)
      } else if (level === 3) {
        blocks.push(<h5 key={idx} style={headingStyle}>{headingText}</h5>)
      } else {
        blocks.push(<h6 key={idx} style={headingStyle}>{headingText}</h6>)
      }
      continue
    }

    // 6. Handle Paragraphs & Blank Lines
    if (trimmed === '') {
      continue
    }

    blocks.push(
      <p 
        key={idx} 
        style={{ 
          margin: '8px 0', 
          fontSize: '13.5px', 
          lineHeight: '1.6', 
          color: 'var(--text-2)' 
        }}
      >
        {parseInlineMarkdown(line)}
      </p>
    )
  }

  // Flush remaining elements
  if (isTable) flushTable(lines.length)
  if (currentList) flushList(lines.length)
  if (currentCodeBlock) flushCodeBlock(lines.length)

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>{blocks}</div>
}

export function ChatMessage({ message, showDebug }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`chat-msg ${isUser ? 'user' : 'ai'}`}>
      <div className="chat-msg__role">{isUser ? 'You' : 'Assistant'}</div>
      <div className="chat-msg__body">
        {isUser ? (
          message.content
        ) : (
          <MarkdownRenderer content={message.content || (message.streaming ? '…' : '')} />
        )}
      </div>

      {/* Visual Indicator if low confidence triggered */}
      {!isUser && message.metadata?.debug?.low_confidence_triggered ? (
        <div style={{ margin: '8px 0', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', borderLeft: '4px solid #ef4444', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🚨</span>
          <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 500 }}>Celery Admin Alert Triggered (Weak/Missing Context)</span>
        </div>
      ) : null}

      {/* Render Admin Debug Panel */}
      {!isUser && showDebug && message.metadata && (
        <div className="card mt-3" style={{ padding: '14px', background: 'var(--bg-sunk)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px' }}>🛡️</span>
            <strong style={{ fontSize: '12.5px', color: 'var(--text)' }}>Admin Provenance & Debug Analytics</strong>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            {/* Retrieval Tool used */}
            <div>
              <span className="mono" style={{ color: 'var(--text-2)' }}>selected_retrieval_tool: </span>
              <code className="mono" style={{ background: 'var(--bg-elev)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                {message.metadata.debug?.selected_retrieval_tool || 'none'}
              </code>
            </div>

            {/* Retrieved Chunks Accordion */}
            {message.metadata.debug?.retrieved_chunks && message.metadata.debug.retrieved_chunks.length > 0 ? (
              <details style={{ border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-elev)' }}>
                <summary style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📦 Retrieved hybrid chunks ({message.metadata.debug.retrieved_chunks.length})</span>
                </summary>
                <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {message.metadata.debug.retrieved_chunks.map((c: any, i: number) => (
                    <div key={c.chunk_id || i} style={{ borderBottom: i < message.metadata.debug.retrieved_chunks.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 650, color: 'var(--text)' }}>
                        <span>[{i + 1}] {c.document_title}</span>
                        <span style={{ color: 'var(--accent)' }}>Score: {c.score.toFixed(3)}</span>
                      </div>
                      <div className="mono" style={{ fontSize: '10.5px', color: 'var(--text-2)', marginBottom: '4px' }}>Chunk ID: {c.chunk_id}</div>
                      <p style={{ margin: 0, color: 'var(--text-2)', fontSize: '11.5px', lineHeight: '1.4' }}>{c.content}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : (
              <div style={{ color: 'var(--text-2)' }}>📦 Retrieved hybrid chunks: none</div>
            )}

            {/* Neo4j Facts Accordion */}
            {message.metadata.debug?.neo4j_results && message.metadata.debug.neo4j_results.length > 0 ? (
              <details style={{ border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-elev)' }}>
                <summary style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}>
                  <span>🕸️ Neo4j facts used ({message.metadata.debug.neo4j_results.length})</span>
                </summary>
                <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {message.metadata.debug.neo4j_results.map((f: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', color: 'var(--text-2)', fontSize: '11.5px' }}>
                      <span>•</span>
                      <span>{f.fact}</span>
                    </div>
                  ))}
                </div>
              </details>
            ) : (
              <div style={{ color: 'var(--text-2)' }}>🕸️ Neo4j facts used: none</div>
            )}

            {/* Redis Session Context */}
            {message.metadata.debug?.redis_session_context ? (
              <details style={{ border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-elev)' }}>
                <summary style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}>
                  <span>🔄 Redis session history context</span>
                </summary>
                <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
                  <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap', color: 'var(--text-2)', fontFamily: 'monospace' }}>
                    {message.metadata.debug.redis_session_context}
                  </pre>
                </div>
              </details>
            ) : null}

            {/* Final Generated Prompt Summary */}
            {message.metadata.debug?.final_generated_prompt_summary ? (
              <details style={{ border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-elev)' }}>
                <summary style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}>
                  <span>📝 Final generated prompt summary</span>
                </summary>
                <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
                  <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap', color: 'var(--text-2)', fontFamily: 'monospace' }}>
                    {message.metadata.debug.final_generated_prompt_summary}
                  </pre>
                </div>
              </details>
            ) : null}

            {/* Guardrail Results */}
            <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
              <div>
                <span style={{ color: 'var(--text-2)' }}>guardrail_verdict: </span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>PASSED</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-2)' }}>enforce_roman_urdu: </span>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {message.tools && message.tools.length > 0 ? (
        <details className="chat-tools">
          <summary>Tools used ({message.tools.length})</summary>
          <ul>
            {message.tools.map((t, i) => (
              <li key={t.tool_call_id ?? `${t.tool_name}-${i}`}>
                <span className="mono">{t.tool_name}</span>
                {Object.keys(t.args).length > 0 ? (
                  <pre className="chat-tools__args">{JSON.stringify(t.args, null, 2)}</pre>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}
