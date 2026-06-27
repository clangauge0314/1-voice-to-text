import type { ReactNode } from 'react'

interface DashboardPanelProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

const DashboardPanel = ({ title, description, children, className = '' }: DashboardPanelProps) => {
  return (
    <section
      className={`rounded-xl border border-black/10 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-black ${className}`}
    >
      <div className="mb-4 sm:mb-5">
        <h2 className="text-sm sm:text-base font-bold">{title}</h2>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-black/55 dark:text-white/55">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

export default DashboardPanel
