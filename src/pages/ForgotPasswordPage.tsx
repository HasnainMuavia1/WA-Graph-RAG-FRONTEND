import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { forgotPassword } from '@/lib/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ message: string; reset_token?: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await forgotPassword(email.trim())
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell title="Forgot password" subtitle="We will send a reset link if the email exists">
      {result ? (
        <div className="creds__form">
          <div className="card card-pad" style={{ fontSize: 13 }}>
            <p style={{ margin: 0 }}>{result.message}</p>
            {result.reset_token ? (
              <>
                <p className="muted" style={{ margin: '12px 0 8px' }}>
                  Dev reset token:
                </p>
                <code className="mono" style={{ wordBreak: 'break-all', fontSize: 12 }}>
                  {result.reset_token}
                </code>
                <p style={{ margin: '12px 0 0' }}>
                  <Link to={`/reset-password?token=${encodeURIComponent(result.reset_token)}`}>
                    Reset password now
                  </Link>
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <form className="creds__form" onSubmit={handleSubmit} noValidate>
          {error ? (
            <div className="creds__alert" role="alert">
              {error}
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthPageShell>
  )
}
