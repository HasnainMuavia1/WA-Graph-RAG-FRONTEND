import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Icons } from '@/components/icons'
import type { SearchType } from '@/types/api'

type ChatComposerProps = {
  disabled?: boolean
  searchType: SearchType
  onSearchTypeChange: (t: SearchType) => void
  useStreaming: boolean
  onStreamingChange: (v: boolean) => void
  onSend: (message: string) => void
  onClear: () => void
}

const SEARCH_TYPES: { id: SearchType; label: string }[] = [
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'vector', label: 'Vector' },
  { id: 'graph', label: 'Graph' },
]

export function ChatComposer({
  disabled,
  searchType,
  onSearchTypeChange,
  useStreaming,
  onStreamingChange,
  onSend,
  onClear,
}: ChatComposerProps) {
  const [text, setText] = useState('')

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form className="chat-composer-container" onSubmit={handleSubmit}>
      <div className="chat-composer__textarea-wrapper">
        <textarea
          className="chat-composer__textarea-modern"
          placeholder="Ask about your documents…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
      </div>
      <div className="chat-composer__footer row">
        <div className="chat-composer__toolbar-left row gap-8 flex-wrap">
          <div className="seg-modern" role="group" aria-label="Search type">
            {SEARCH_TYPES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={searchType === id ? 'active' : ''}
                onClick={() => onSearchTypeChange(id)}
                disabled={disabled}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="row gap-6 chat-composer__stream-modern">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => onStreamingChange(e.target.checked)}
              disabled={disabled}
            />
            <span className="muted">Stream</span>
          </label>
          <button type="button" className="btn-ghost-modern" onClick={onClear} disabled={disabled}>
            Clear chat
          </button>
        </div>
        <button type="submit" className="chat-composer__send-modern" disabled={disabled || !text.trim()}>
          <Icons.Send size={13} />
          <span>Send</span>
        </button>
      </div>
    </form>
  )
}
