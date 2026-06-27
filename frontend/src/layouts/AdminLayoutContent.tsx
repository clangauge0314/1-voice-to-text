import { Link, Outlet } from 'react-router-dom'
import AppToaster from '../components/AppToaster/AppToaster'
import ThemeToggle from '../components/ThemeToggle/ThemeToggle'
import { useAdminAuthInit } from '../hooks/useAdminAuthInit'

const AdminLayoutContent = () => {
  useAdminAuthInit()

  return (
    <>
      <AppToaster />
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur-sm dark:border-white/10 dark:bg-black/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/admin" className="text-base sm:text-lg font-bold tracking-tight">
            Admin
          </Link>
          <Link
            to="/"
            className="shrink-0 text-xs sm:text-sm text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            <span className="sm:hidden">홈으로</span>
            <span className="hidden sm:inline">서비스로 돌아가기</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        <Outlet />
      </main>
      <ThemeToggle />
    </>
  )
}

export default AdminLayoutContent
