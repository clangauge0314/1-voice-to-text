import { CreditCard, FileText, TrendingUp, Upload, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchAdminStats, type AdminStats } from '../../lib/adminApi'
import { useAdminAuthStore } from '../../stores/adminAuthStore'
import ActivityTrendChart from '../../components/admin/dashboard/ActivityTrendChart'
import DashboardHeader from '../../components/admin/dashboard/DashboardHeader'
import PackDistributionChart from '../../components/admin/dashboard/PackDistributionChart'
import RecentPaymentsTable from '../../components/admin/dashboard/RecentPaymentsTable'
import RecentUsersTable from '../../components/admin/dashboard/RecentUsersTable'
import RevenueChart from '../../components/admin/dashboard/RevenueChart'
import StatCard from '../../components/admin/dashboard/StatCard'
import { formatCurrency } from '../../components/admin/dashboard/formatters'

const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const admin = useAdminAuthStore((state) => state.admin)
  const logout = useAdminAuthStore((state) => state.logout)

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((err) => {
        const message = err instanceof Error ? err.message : '통계를 불러오지 못했습니다.'
        setError(message)
        if (message.includes('인증') || message.includes('토큰')) {
          logout()
          navigate('/admin/login', { replace: true })
        }
      })
      .finally(() => setLoading(false))
  }, [logout, navigate])

  const handleLogout = () => {
    logout()
    toast.success('로그아웃되었습니다.')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div>
      <DashboardHeader admin={admin} onLogout={handleLogout} />

      {loading && (
        <p className="text-sm text-black/60 dark:text-white/60">대시보드를 불러오는 중...</p>
      )}

      {error && !loading && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {stats && !loading && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <StatCard
              label="전체 유저"
              value={stats.summary.users.toLocaleString()}
              hint={`이번 주 +${stats.summary.newUsersThisWeek}`}
              icon={Users}
            />
            <StatCard
              label="메모"
              value={stats.summary.memos.toLocaleString()}
              icon={FileText}
            />
            <StatCard
              label="업로드"
              value={stats.summary.uploads.toLocaleString()}
              icon={Upload}
            />
            <StatCard
              label="결제 완료"
              value={stats.summary.payments.toLocaleString()}
              icon={CreditCard}
            />
            <StatCard
              label="누적 매출"
              value={formatCurrency(stats.summary.revenue)}
              icon={TrendingUp}
            />
            <StatCard
              label="주간 신규"
              value={stats.summary.newUsersThisWeek.toLocaleString()}
              hint="최근 7일 가입"
              icon={UserPlus}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
            <ActivityTrendChart data={stats.dailyTrend} />
            <RevenueChart data={stats.dailyTrend} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <PackDistributionChart data={stats.packDistribution} />
            <RecentUsersTable users={stats.recentUsers} />
          </div>

          <RecentPaymentsTable payments={stats.recentPayments} />
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
