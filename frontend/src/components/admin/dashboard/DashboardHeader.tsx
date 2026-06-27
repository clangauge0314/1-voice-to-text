import { LogOut } from 'lucide-react'
import type { Admin } from '../../../stores/adminAuthStore'

interface DashboardHeaderProps {
  admin: Admin | null
  onLogout: () => void
}

const DashboardHeader = ({ admin, onLogout }: DashboardHeaderProps) => {
  return (
    <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium uppercase tracking-widest text-black/40 dark:text-white/40">
          Overview
        </p>
        <h1 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
          관리자 대시보드
        </h1>
        <p className="mt-1.5 sm:mt-2 truncate text-xs sm:text-sm text-black/60 dark:text-white/60">
          <span className="font-medium text-black dark:text-white">{admin?.name}</span>
          <span className="mx-1.5 hidden sm:inline">·</span>
          <span className="block sm:inline break-all sm:break-normal">{admin?.email}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-lg border border-black/20 px-4 py-2.5 sm:py-2 text-sm transition-colors hover:bg-black hover:text-white dark:border-white/20 dark:hover:bg-white dark:hover:text-black"
      >
        <LogOut size={16} />
        로그아웃
      </button>
    </div>
  )
}

export default DashboardHeader
