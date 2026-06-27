import type { AdminStats } from '../../../lib/adminApi'
import DashboardPanel from './DashboardPanel'
import { formatCurrency, formatDateTime } from './formatters'

interface RecentPaymentsTableProps {
  payments: AdminStats['recentPayments']
}

const RecentPaymentsTable = ({ payments }: RecentPaymentsTableProps) => {
  return (
    <DashboardPanel title="최근 결제" className="min-w-0">
      {payments.length === 0 ? (
        <p className="py-10 text-center text-sm text-black/50 dark:text-white/50">
          결제 내역이 없습니다.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-lg border border-black/8 p-3.5 dark:border-white/8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{payment.userName}</p>
                    <p className="mt-0.5 break-all text-xs text-black/55 dark:text-white/55">
                      {payment.userEmail}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold">{formatCurrency(payment.amount)}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/55 dark:text-white/55">
                  <span>{payment.packLabel}</span>
                  <span>·</span>
                  <span>{payment.paidAt ? formatDateTime(payment.paidAt) : '-'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-black/55 dark:border-white/10 dark:text-white/55">
                  <th className="pb-3 pr-4 font-medium">유저</th>
                  <th className="pb-3 pr-4 font-medium">패키지</th>
                  <th className="pb-3 pr-4 font-medium">금액</th>
                  <th className="pb-3 font-medium">결제일</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-black/5 last:border-0 dark:border-white/5"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium">{payment.userName}</p>
                      <p className="text-xs text-black/55 dark:text-white/55">{payment.userEmail}</p>
                    </td>
                    <td className="py-3 pr-4">{payment.packLabel}</td>
                    <td className="py-3 pr-4 font-medium whitespace-nowrap">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 whitespace-nowrap text-black/55 dark:text-white/55">
                      {payment.paidAt ? formatDateTime(payment.paidAt) : '-'}
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

export default RecentPaymentsTable
