import { Icons } from '@/components/icons'
import { useTheme } from '@/context/ThemeContext'

export function LandingThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon landing-theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Icons.Sun size={16} /> : <Icons.Moon size={16} />}
    </button>
  )
}
