import { useIsMobile, useIsTablet } from '../../../hooks/useMediaQuery'

export function useChartLayout() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  return {
    isMobile,
    isTablet,
    height: isMobile ? 240 : isTablet ? 280 : 288,
    margin: {
      top: 8,
      right: isMobile ? 4 : 8,
      left: isMobile ? -20 : -12,
      bottom: isMobile ? 0 : 0,
    },
    tickSize: isMobile ? 10 : 12,
    showYAxis: !isMobile,
  }
}
