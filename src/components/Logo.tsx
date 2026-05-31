import { useTheme } from '@/context/ThemeContext'
import blackLogo from '@/assets/black_logo.webp'
import whiteLogo from '@/assets/white_logo.webp'

type LogoProps = {
  size?: number
  className?: string
  /** Force a specific logo regardless of theme (e.g. on a fixed dark surface). */
  variant?: 'black' | 'white'
}

/**
 * Theme-aware brand logo. Uses the white logo on the dark theme and the black
 * logo on the light theme so it stays legible against the surface behind it.
 * Pass `variant` to override (e.g. the always-dark auth brand pane).
 */
export function Logo({ size = 20, className, variant }: LogoProps) {
  const { theme } = useTheme()
  const useWhite = variant ? variant === 'white' : theme === 'dark'
  const src = useWhite ? whiteLogo : blackLogo
  return (
    <img
      src={src}
      alt="Uchenab"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  )
}
