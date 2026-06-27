import { Link } from 'react-router-dom'
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle'

interface AdminBlockedPageProps {
  message: string
  clientIp?: string
}

const AdminBlockedPage = ({ message, clientIp }: AdminBlockedPageProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-white px-4 pb-24 text-black transition-colors dark:bg-black dark:text-white sm:px-6 sm:pb-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-xs sm:text-sm font-medium uppercase tracking-widest text-black/40 dark:text-white/40">
          403 Forbidden
        </p>
        <h1 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold">접근이 거부되었습니다</h1>
        <p className="mt-3 max-w-md text-xs sm:text-sm text-black/60 dark:text-white/60">{message}</p>
        {clientIp && (
          <p className="mt-2 text-xs text-black/40 dark:text-white/40">
            현재 IP: {clientIp}
          </p>
        )}
        <Link
          to="/"
          className="mt-8 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
        >
          홈으로 돌아가기
        </Link>
      </div>
      <ThemeToggle />
    </div>
  )
}

export default AdminBlockedPage
