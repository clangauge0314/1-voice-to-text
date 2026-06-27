import { useEffect, useState } from 'react'
import { checkAdminAccess } from '../lib/adminApi'
import AdminLayoutContent from './AdminLayoutContent'
import AdminBlockedPage from '../pages/admin/AdminBlockedPage'
import { applyTheme, useThemeStore } from '../stores/themeStore'

const AdminLayout = () => {
  const theme = useThemeStore((state) => state.theme)
  const [accessState, setAccessState] = useState<'loading' | 'allowed' | 'blocked'>('loading')
  const [blockMessage, setBlockMessage] = useState('허용되지 않은 IP입니다.')
  const [clientIp, setClientIp] = useState<string | undefined>()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    checkAdminAccess().then((result) => {
      if (result.allowed) {
        setAccessState('allowed')
        return
      }

      setBlockMessage(result.error)
      setClientIp(result.clientIp)
      setAccessState('blocked')
    })
  }, [])

  if (accessState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white">
        <p className="text-sm text-black/60 dark:text-white/60">접근 권한 확인 중...</p>
      </div>
    )
  }

  if (accessState === 'blocked') {
    return <AdminBlockedPage message={blockMessage} clientIp={clientIp} />
  }

  return (
    <div className="min-h-screen bg-white text-black transition-colors dark:bg-black dark:text-white">
      <AdminLayoutContent />
    </div>
  )
}

export default AdminLayout
