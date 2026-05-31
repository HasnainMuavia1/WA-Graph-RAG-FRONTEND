import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import whiteLogo from '@/assets/white_logo.webp'

const FORGOT_MESSAGE =
  'Password resets are handled by the administration. Please contact the system administrator to reset your password.'

export function LoginPage() {
  const navigate = useNavigate()
  const { authenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgot, setForgot] = useState(false)
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
    <div className="login-screen">
      {/* Animated starfield (3 parallax layers) */}
      <div className="login-stars login-stars--far" aria-hidden />
      <div className="login-stars login-stars--mid" aria-hidden />
      <div className="login-stars login-stars--near" aria-hidden />

      <div className="login-card fade-in">
        <div className="login-brand">
          <img src={whiteLogo} alt="University of Chenab" className="login-brand__logo" />
          <h1 className="login-brand__title">University of Chenab</h1>
          <p className="login-brand__subtitle">Sign in to access your dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error ? (
            <div className="login-alert" role="alert">
              {error}
            </div>
          ) : null}

          <div className="login-field">
            <label htmlFor="email">Email</label>
            <div className="login-input-wrap">
              <Mail size={18} className="login-input-icon" aria-hidden />
              <input
                id="email"
                name="email"
                type="email"
                className="login-input"
                placeholder="you@uchenab.edu.pk"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field">
            <div className="login-field__labelrow">
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="login-link"
                onClick={() => setForgot(true)}
              >
                Forgot password?
              </button>
            </div>
            <div className="login-input-wrap">
              <Lock size={18} className="login-input-icon" aria-hidden />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="login-input login-input--pw"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {forgot ? (
            <p className="login-hint" role="status">
              {FORGOT_MESSAGE}
            </p>
          ) : null}

          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
            {!submitting ? <ArrowRight size={18} /> : null}
          </button>
        </form>
      </div>
    </div>
  )
}
