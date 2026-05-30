import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AuthBrandPane } from '@/components/auth/AuthBrandPane'
import { LandingThemeToggle } from '@/components/theme/LandingThemeToggle'

type AuthPageShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthPageShell({ title, subtitle, children, footer }: AuthPageShellProps) {
  return (
    <div className="login-grid fade-in">
      <AuthBrandPane />
      <div className="creds">
        <div className="creds__inner">
          <div className="creds__toolbar">
            <LandingThemeToggle />
          </div>
          <header className="creds__header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>
          {children}
          {footer ?? (
            <p className="creds__footer">
              <Link to="/login">Back to sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
