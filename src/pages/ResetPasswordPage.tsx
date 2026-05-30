import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { resetPassword } from '@/lib/api'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const tokenFromUrl = params.get('token') ?? ''
  const [token, setToken] = useState(tokenFromUrl)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await resetPassword(token.trim(), password)
      setMessage(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell title="Reset password" subtitle="Choose a new password">
      {message ? (
        <div className="creds__form">
          <div className="card card-pad" style={{ fontSize: 13 }}>
            <p style={{ margin: 0 }}>{message}</p>
            <p style={{ margin: '12px 0 0' }}>
              <Link to="/login">Sign in</Link>
            </p>
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
            <label htmlFor="token">Reset token</label>
            <input
              id="token"
              className="input mono"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <PasswordField
            label="New password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Saving…' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthPageShell>
  )
}
