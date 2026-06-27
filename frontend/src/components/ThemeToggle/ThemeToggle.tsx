import { Moon, Sun } from 'lucide-react'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { useThemeStore } from '../../stores/themeStore'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore()
  const isMobile = useIsMobile()
  const iconSize = isMobile ? 18 : 20

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-black bg-white text-black transition-colors hover:bg-black hover:text-white dark:border-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
    >
      {theme === 'light' ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
    </button>
  )
}

export default ThemeToggle
