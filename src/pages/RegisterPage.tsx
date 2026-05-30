import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { register } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export function RegisterPage() {
  const { authenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; token?: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (authenticated) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const res = await register({
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
      })
      setSuccess({ message: res.message, token: res.verification_token })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell
      title="Create account"
      subtitle="Register for Uchenab"
      footer={
        <p className="creds__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      {success ? (
        <div className="creds__form">
          <div className="card card-pad" style={{ fontSize: 13 }}>
            <p style={{ margin: '0 0 8px' }}>{success.message}</p>
            {success.token ? (
              <>
                <p className="muted" style={{ margin: '0 0 8px' }}>
                  Dev verification token (API returns this until email is wired):
                </p>
                <code className="mono" style={{ wordBreak: 'break-all', fontSize: 12 }}>
                  {success.token}
                </code>
                <p style={{ margin: '12px 0 0' }}>
                  <Link to={`/verify-email?token=${encodeURIComponent(success.token)}`}>
                    Verify email now
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
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
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
          <PasswordField
            label="Password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
      )}
    </AuthPageShell>
  )
}
