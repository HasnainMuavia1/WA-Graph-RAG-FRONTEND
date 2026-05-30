export type HealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy'
  database: boolean
  graph_database: boolean
  llm_connection: boolean
  version: string
  timestamp: string
}

export type DocumentMetadata = {
  id: string
  title: string
  source: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  chunk_count?: number | null
}

export type DocumentsResponse = {
  documents: DocumentMetadata[]
  total: number
  limit: number
  offset: number
}

export type AuthUser = {
  id: string
  email: string
  username?: string | null
  full_name?: string | null
  is_verified: boolean
  roles: string[]
  created_at?: string
  last_login_at?: string | null
}

export type IngestTriggerResponse = {
  status: string
  job_id: string
  message: string
}

export type MessageResponse = {
  message: string
}

export type RegisterResponse = MessageResponse & {
  user_id: string
  verification_token?: string
}

export type SearchType = 'vector' | 'hybrid' | 'graph'

export type ToolCall = {
  tool_name: string
  args: Record<string, unknown>
  tool_call_id?: string | null
}

export type ChatRequest = {
  message: string
  session_id?: string | null
  user_id?: string | null
  search_type?: SearchType
  metadata?: Record<string, unknown>
}

export type ChatResponse = {
  message: string
  session_id: string
  tools_used: ToolCall[]
  metadata?: Record<string, unknown>
}

export type ChatStreamEvent =
  | { type: 'session'; session_id: string }
  | { type: 'text'; content: string }
  | { type: 'tools'; tools: ToolCall[] }
  | { type: 'end' }
  | { type: 'error'; content: string }

// ── Agent Conversations (WhatsApp inbox) ──────────────────────────────────────

export type WaConversation = {
  id: string
  wa_id: string
  contact_name?: string | null
  channel: string
  last_message_at?: string | null
  last_message_preview?: string | null
  last_direction?: 'inbound' | 'outbound' | null
  unread_count: number
  created_at: string
  updated_at: string
}

export type WaMessage = {
  id: string
  conversation_id: string
  wa_id: string
  direction: 'inbound' | 'outbound'
  sender: 'user' | 'agent' | 'admin'
  message_type: 'text' | 'audio'
  content: string
  transcribed: boolean
  wa_message_id?: string | null
  created_at: string
  metadata?: any
}

export type ConversationsResponse = {
  conversations: WaConversation[]
  limit: number
  offset: number
  count: number
}

export type ConversationMessagesResponse = {
  conversation: WaConversation
  messages: WaMessage[]
  count: number
}
