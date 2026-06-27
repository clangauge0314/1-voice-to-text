import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { AdminStats } from '../../../lib/adminApi'
import { useIsMobile } from '../../../hooks/useMediaQuery'
import DashboardPanel from './DashboardPanel'
import { formatCurrency, PACK_LABELS } from './formatters'
import { useChartLayout } from './useChartLayout'
import { useChartTheme } from './useChartTheme'

interface PackDistributionChartProps {
  data: AdminStats['packDistribution']
}

const PackDistributionChart = ({ data }: PackDistributionChartProps) => {
  const chart = useChartTheme()
  const layout = useChartLayout()
  const isMobile = useIsMobile()
  const chartData = data.map((row) => ({
    name: PACK_LABELS[row.packId] ?? row.packId,
    value: row.count,
    revenue: row.revenue,
  }))

  if (chartData.length === 0) {
    return (
      <DashboardPanel title="패키지 분포" description="결제 완료 기준" className="min-w-0">
        <p className="py-12 sm:py-16 text-center text-sm text-black/50 dark:text-white/50">
          결제 데이터가 없습니다.
        </p>
      </DashboardPanel>
    )
  }

  const innerRadius = isMobile ? 42 : 55
  const outerRadius = isMobile ? 68 : 90

  return (
    <DashboardPanel title="패키지 분포" description="결제 완료 기준" className="min-w-0">
      <div className="w-full min-w-0" style={{ height: layout.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={chart.pie[index % chart.pie.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => [
                `${value}건 · ${formatCurrency(item.payload.revenue)}`,
                item.payload.name,
              ]}
              contentStyle={{
                backgroundColor: chart.tooltipBg,
                borderColor: chart.tooltipBorder,
                borderRadius: 8,
                color: chart.isDark ? '#fff' : '#000',
                fontSize: layout.tickSize,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {chartData.map((row, index) => (
          <div key={row.name} className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: chart.pie[index % chart.pie.length] }}
            />
            <span className="truncate text-black/70 dark:text-white/70">{row.name}</span>
            <span className="ml-auto shrink-0 font-medium">{row.value}건</span>
          </div>
        ))}
      </div>
    </DashboardPanel>
  )
}

export default PackDistributionChart
