import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthBrandPane } from '@/components/auth/AuthBrandPane'
import { PasswordField } from '@/components/auth/PasswordField'
import { LandingThemeToggle } from '@/components/theme/LandingThemeToggle'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { authenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (authenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-grid fade-in">
      <AuthBrandPane />

      <div className="creds">
        <div className="creds__inner">
          <div className="creds__toolbar">
            <LandingThemeToggle />
          </div>

          <header className="creds__header">
            <h1>Sign in</h1>
            <p>Monitor your stack and manage documents</p>
          </header>

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
                name="email"
                type="email"
                className="input"
                placeholder="you@company.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <PasswordField
              label="Password"
              name="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <p style={{ margin: 0, textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ fontSize: 13 }}>
                Forgot password?
              </Link>
            </p>

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="creds__footer">
            No account yet? <Link to="/register">Create one</Link>
            {' · '}
            <Link to="/verify-email">Verify email</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
