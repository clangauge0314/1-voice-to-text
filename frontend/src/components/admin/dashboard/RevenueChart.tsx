import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AdminStats } from '../../../lib/adminApi'
import DashboardPanel from './DashboardPanel'
import { formatChartDate, formatCurrency } from './formatters'
import { useChartLayout } from './useChartLayout'
import { useChartTheme } from './useChartTheme'

interface RevenueChartProps {
  data: AdminStats['dailyTrend']
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  const chart = useChartTheme()
  const layout = useChartLayout()
  const chartData = data.map((row) => ({
    label: formatChartDate(row.date),
    revenue: row.revenue,
    payments: row.payments,
  }))

  return (
    <DashboardPanel title="매출 추이" description="최근 7일 결제 금액" className="min-w-0">
      <div className="w-full min-w-0" style={{ height: layout.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={layout.margin}>
            <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: chart.text, fontSize: layout.tickSize }}
              axisLine={false}
              tickLine={false}
              interval={layout.isMobile ? 1 : 0}
            />
            {layout.showYAxis ? (
              <YAxis
                tick={{ fill: chart.text, fontSize: layout.tickSize }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(value: number) =>
                  value >= 10000 ? `${Math.round(value / 10000)}만` : `${Math.round(value / 1000)}k`
                }
              />
            ) : (
              <YAxis hide />
            )}
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: chart.tooltipBg,
                borderColor: chart.tooltipBorder,
                borderRadius: 8,
                color: chart.isDark ? '#fff' : '#000',
                fontSize: layout.tickSize,
              }}
            />
            <Bar
              dataKey="revenue"
              name="매출"
              fill={chart.series[0]}
              radius={[4, 4, 0, 0]}
              maxBarSize={layout.isMobile ? 28 : 48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardPanel>
  )
}

export default RevenueChart
