import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/tokenStorage'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export function formatApiError(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === 'object' && item && 'msg' in item ? String(item.msg) : String(item),
      )
      .join(' ')
  }
  return fallback
}

type RequestOptions = RequestInit & {
  auth?: boolean
  /** @internal retry after refresh */
  _retry?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

/** Exchange refresh token for a new pair (used by apiFetch and settings). */
export async function refreshSessionTokens(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refresh }),
        })
        if (!res.ok) {
          clearTokens()
          return false
        }
        const data = (await res.json()) as {
          access_token: string
          refresh_token: string
        }
        setTokens(data.access_token, data.refresh_token)
        return true
      } catch {
        clearTokens()
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }

  return refreshInFlight
}

type CacheEntry = {
  data: any
  timestamp: number
}

const cacheMap = new Map<string, CacheEntry>()
const CACHE_TTL = 15000 // 15 seconds stale limit

export function clearApiCache() {
  cacheMap.clear()
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, headers, _retry = false, ...rest } = options
  
  // Stale-while-revalidate for specific dashboard/overview endpoints
  const isGet = !rest.method || rest.method.toUpperCase() === 'GET'
  const cacheable = isGet && (
    path.startsWith('/api/v1/dashboard/stats') ||
    path.startsWith('/api/v1/health') ||
    path.startsWith('/api/v1/documents')
  )

  if (cacheable) {
    const cached = cacheMap.get(path)
    const now = Date.now()
    if (cached) {
      const age = now - cached.timestamp
      if (age < CACHE_TTL) {
        return cached.data as T
      }
      // Revalidate in the background
      void (async () => {
        try {
          const fresh = await performFetch<T>(path, options)
          cacheMap.set(path, { data: fresh, timestamp: Date.now() })
        } catch {
          // ignore background fetch failures
        }
      })()
      return cached.data as T
    }
  }

  const data = await performFetch<T>(path, options)
  if (cacheable) {
    cacheMap.set(path, { data, timestamp: Date.now() })
  }
  return data
}

async function performFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, headers, _retry = false, ...rest } = options
  const hdrs = new Headers(headers)

  if (!hdrs.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    hdrs.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getAccessToken()
    if (token) hdrs.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: hdrs })

  if (res.status === 401 && auth && !_retry) {
    const renewed = await refreshSessionTokens()
    if (renewed) return apiFetch<T>(path, { ...options, _retry: true })
    clearTokens()
    throw new Error('Session expired. Please sign in again.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(formatApiError(body.detail, `Request failed (${res.status})`))
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
