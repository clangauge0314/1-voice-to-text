import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AppToaster from '../components/AppToaster/AppToaster'
import AuthModal from '../components/AuthModal/AuthModal'
import LeftSidebar from '../components/LeftSidebar/LeftSidebar'
import SidebarToggle from '../components/LeftSidebar/SidebarToggle'
import Navbar from '../components/Navbar/Navbar'
import ThemeToggle from '../components/ThemeToggle/ThemeToggle'
import { useAuthInit } from '../hooks/useAuthInit'
import { useMemoInit } from '../hooks/useMemoInit'
import { useUsageInit } from '../hooks/useUsageInit'
import { applyTheme, useThemeStore } from '../stores/themeStore'

const MainLayout = () => {
  const theme = useThemeStore((state) => state.theme)

  useAuthInit()
  useUsageInit()
  useMemoInit()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <div className="flex h-screen overflow-hidden bg-white text-black dark:bg-black dark:text-white transition-colors">
      <LeftSidebar />
      <SidebarToggle />
      <AuthModal />
      <AppToaster />
      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
        <ThemeToggle />
      </div>
    </div>
  )
}

export default MainLayout
