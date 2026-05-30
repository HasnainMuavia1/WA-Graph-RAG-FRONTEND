export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function healthTone(
  ok: boolean,
): 'green' | 'red' {
  return ok ? 'green' : 'red'
}

export function statusTone(
  status: string,
): 'green' | 'amber' | 'red' {
  if (status === 'healthy') return 'green'
  if (status === 'degraded') return 'amber'
  return 'red'
}
