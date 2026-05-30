import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { verifyEmail } from '@/lib/api'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token in URL.')
      return
    }
    setStatus('loading')
    verifyEmail(token)
      .then((res) => {
        setStatus('ok')
        setMessage(res.message)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Verification failed')
      })
  }, [token])

  return (
    <AuthPageShell title="Verify email" subtitle="Confirming your account">
      <div className="creds__form">
        {status === 'loading' ? (
          <p className="empty">Verifying…</p>
        ) : (
          <div
            className={status === 'ok' ? 'card card-pad' : 'creds__alert'}
            role={status === 'error' ? 'alert' : undefined}
            style={{ fontSize: 13 }}
          >
            <p style={{ margin: 0 }}>{message}</p>
            {status === 'ok' ? (
              <p style={{ margin: '12px 0 0' }}>
                <Link to="/login">Sign in</Link>
              </p>
            ) : null}
          </div>
        )}
        {!token ? (
          <p className="creds__footer" style={{ marginTop: 16 }}>
            Paste token from registration email or{' '}
            <Link to="/login">return to sign in</Link>
          </p>
        ) : null}
      </div>
    </AuthPageShell>
  )
}
