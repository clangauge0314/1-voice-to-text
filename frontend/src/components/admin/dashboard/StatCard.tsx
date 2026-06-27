import type { LucideIcon } from 'lucide-react'
import { useIsMobile } from '../../../hooks/useMediaQuery'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
}

const StatCard = ({ label, value, hint, icon: Icon }: StatCardProps) => {
  const isMobile = useIsMobile()

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-black">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">{label}</p>
          <p className="mt-1.5 sm:mt-2 truncate text-2xl sm:text-3xl font-bold tracking-tight">
            {value}
          </p>
          {hint && (
            <p className="mt-1.5 sm:mt-2 text-xs text-black/45 dark:text-white/45">{hint}</p>
          )}
        </div>
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border border-black/10 dark:border-white/10">
          <Icon size={isMobile ? 16 : 18} />
        </div>
      </div>
    </div>
  )
}

export default StatCard
