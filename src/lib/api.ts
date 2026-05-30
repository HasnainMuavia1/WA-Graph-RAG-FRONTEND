import { apiFetch, refreshSessionTokens } from '@/lib/apiClient'
import { getRefreshToken } from '@/lib/tokenStorage'
import { getAccessToken } from '@/lib/tokenStorage'
import type {
  AuthUser,
  ChatRequest,
  ChatResponse,
  ChatStreamEvent,
  ConversationMessagesResponse,
  ConversationsResponse,
  DocumentsResponse,
  HealthStatus,
  IngestTriggerResponse,
  MessageResponse,
  RegisterResponse,
  WaConversation,
  WaMessage,
} from '@/types/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export type TokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export { refreshSessionTokens }

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function register(body: {
  email: string
  password: string
  username?: string
  full_name?: string
}): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function logout(): Promise<MessageResponse> {
  const refresh_token = getRefreshToken()
  if (!refresh_token) return { message: 'Logged out' }
  return apiFetch<MessageResponse>('/api/v1/auth/logout', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ refresh_token }),
  })
}

export async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/api/v1/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  })
}

export async function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/v1/auth/me', { auth: true })
}

export async function changePassword(
  current_password: string,
  new_password: string,
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/v1/auth/change-password', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ current_password, new_password }),
  })
}

export async function forgotPassword(email: string): Promise<MessageResponse & { reset_token?: string }> {
  return apiFetch('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(
  token: string,
  new_password: string,
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  })
}

export async function verifyEmail(token: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/v1/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function resendVerification(
  email: string,
): Promise<MessageResponse & { verification_token?: string }> {
  return apiFetch('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// ── App data ──────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/api/v1/health')
}

export async function getDocuments(params?: {
  limit?: number
  offset?: number
  user_id?: string
}): Promise<DocumentsResponse> {
  const q = new URLSearchParams()
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  if (params?.user_id) q.set('user_id', params.user_id)
  const qs = q.toString()
  return apiFetch<DocumentsResponse>(`/api/v1/documents${qs ? `?${qs}` : ''}`)
}

export async function triggerIngest(): Promise<IngestTriggerResponse> {
  return apiFetch<IngestTriggerResponse>('/api/v1/ingest/trigger', { method: 'POST' })
}

export async function getDocumentDetails(documentId: string): Promise<any> {
  return apiFetch<any>(`/api/v1/documents/${documentId}`, { auth: true })
}

export async function uploadDocument(file: File, accessLevel: string): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('access_level', accessLevel)
  return apiFetch<any>('/api/v1/documents/upload', {
    method: 'POST',
    auth: true,
    body: formData,
  })
}

export async function getUsers(params?: {
  limit?: number
  offset?: number
}): Promise<{ users: any[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  const qs = q.toString()
  return apiFetch<{ users: any[]; total: number }>(`/api/v1/users${qs ? `?${qs}` : ''}`, { auth: true })
}

export async function createUser(body: {
  email: string
  password: string
  username?: string
  full_name?: string
  is_active?: boolean
  is_verified?: boolean
  role_names?: string[]
}): Promise<{ id: string; email: string; message: string }> {
  return apiFetch<{ id: string; email: string; message: string }>('/api/v1/users', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(body),
  })
}

export async function updateUser(
  userId: string,
  body: {
    full_name?: string
    username?: string
    is_active?: boolean
    role_names?: string[]
  },
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/users/${userId}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(body),
  })
}

export async function deleteUser(userId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/users/${userId}`, {
    method: 'DELETE',
    auth: true,
  })
}

export async function getRoles(): Promise<{ roles: any[] }> {
  return apiFetch<{ roles: any[] }>('/api/v1/roles', { auth: true })
}

// ── RAG chat ────────────────────────────────────────────────────────────────────

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/api/v1/chat', {
    method: 'POST',
    body: JSON.stringify({
      search_type: 'hybrid',
      ...request,
    }),
  })
}

/** Stream SSE events from POST /api/v1/chat/stream */
export async function* streamChat(
  request: ChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  const token = getAccessToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ search_type: 'hybrid', ...request }),
    signal,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail =
      typeof body.detail === 'string' ? body.detail : `Chat failed (${res.status})`
    yield { type: 'error', content: detail }
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    yield { type: 'error', content: 'No response stream' }
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data:')) continue
      const json = line.slice(5).trim()
      if (!json) continue
      try {
        yield JSON.parse(json) as ChatStreamEvent
      } catch {
        /* skip malformed chunk */
      }
    }
  }
}

// ── Agent Conversations (WhatsApp inbox) ──────────────────────────────────────

export async function getConversations(params?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<ConversationsResponse> {
  const q = new URLSearchParams()
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  if (params?.search) q.set('search', params.search)
  const qs = q.toString()
  return apiFetch<ConversationsResponse>(`/api/v1/conversations${qs ? `?${qs}` : ''}`, {
    auth: true,
  })
}

export async function getConversationMessages(
  waId: string,
  params?: { after?: string; markRead?: boolean },
): Promise<ConversationMessagesResponse> {
  const q = new URLSearchParams()
  if (params?.after) q.set('after', params.after)
  if (params?.markRead === false) q.set('mark_read', 'false')
  const qs = q.toString()
  return apiFetch<ConversationMessagesResponse>(
    `/api/v1/conversations/${encodeURIComponent(waId)}/messages${qs ? `?${qs}` : ''}`,
    { auth: true },
  )
}

export async function createConversation(
  waId: string,
  contactName?: string,
): Promise<{ status: string; conversation: WaConversation }> {
  return apiFetch<{ status: string; conversation: WaConversation }>(
    '/api/v1/conversations',
    {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ wa_id: waId, contact_name: contactName || undefined }),
    },
  )
}

export async function sendConversationMessage(
  waId: string,
  content: string,
): Promise<{ status: string; message: WaMessage }> {
  return apiFetch<{ status: string; message: WaMessage }>(
    `/api/v1/conversations/${encodeURIComponent(waId)}/messages`,
    {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ content }),
    },
  )
}

export async function deleteDocument(documentId: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/v1/documents/${documentId}`, {
    method: 'DELETE',
    auth: true,
  })
}

export async function uploadAvatar(userId: string, file: File): Promise<{ message: string; avatar_url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  
  const token = getAccessToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  
  const res = await fetch(`${API_BASE}/api/v1/users/${userId}/avatar`, {
    method: 'POST',
    headers,
    body: formData,
  })
  
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Failed to upload profile picture')
  }
  
  return res.json()
}

export type DashboardStats = {
  totals: {
    total_chats: number
    user_messages: number
    agent_messages: number
    admin_messages: number
  }
  trends: Array<{
    date: string
    chats_started: number
    user_messages: number
    agent_messages: number
    admin_messages: number
  }>
  cached: boolean
  timestamp: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/api/v1/dashboard/stats', { auth: true })
}
