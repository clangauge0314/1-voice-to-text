import type { AdminStats } from '../../../lib/adminApi'
import DashboardPanel from './DashboardPanel'
import { formatDateTime } from './formatters'

interface RecentUsersTableProps {
  users: AdminStats['recentUsers']
}

const RecentUsersTable = ({ users }: RecentUsersTableProps) => {
  return (
    <DashboardPanel title="최근 가입 유저" className="min-w-0">
      {users.length === 0 ? (
        <p className="py-10 text-center text-sm text-black/50 dark:text-white/50">
          가입 유저가 없습니다.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-lg border border-black/8 p-3.5 dark:border-white/8"
              >
                <p className="font-medium">{user.name}</p>
                <p className="mt-1 break-all text-sm text-black/70 dark:text-white/70">
                  {user.email}
                </p>
                <p className="mt-2 text-xs text-black/50 dark:text-white/50">
                  {formatDateTime(user.createdAt)}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-black/55 dark:border-white/10 dark:text-white/55">
                  <th className="pb-3 pr-4 font-medium">이름</th>
                  <th className="pb-3 pr-4 font-medium">이메일</th>
                  <th className="pb-3 font-medium">가입일</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-black/5 last:border-0 dark:border-white/5"
                  >
                    <td className="py-3 pr-4 font-medium">{user.name}</td>
                    <td className="py-3 pr-4 text-black/70 dark:text-white/70">{user.email}</td>
                    <td className="py-3 whitespace-nowrap text-black/55 dark:text-white/55">
                      {formatDateTime(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardPanel>
  )
}

export default RecentUsersTable
