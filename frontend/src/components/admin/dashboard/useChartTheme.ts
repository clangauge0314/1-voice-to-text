import { useThemeStore } from '../../../stores/themeStore'

export function useChartTheme() {
  const theme = useThemeStore((state: { theme: 'light' | 'dark' }) => state.theme)
  const isDark = theme === 'dark'

  return {
    isDark,
    text: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    tooltipBg: isDark ? '#0a0a0a' : '#ffffff',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
    series: isDark
      ? ['#ffffff', '#a3a3a3', '#737373', '#525252']
      : ['#000000', '#525252', '#737373', '#a3a3a3'],
    pie: isDark
      ? ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040']
      : ['#000000', '#262626', '#525252', '#737373', '#a3a3a3', '#d4d4d4'],
  }
}
