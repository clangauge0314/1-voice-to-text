import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AdminStats } from '../../../lib/adminApi'
import DashboardPanel from './DashboardPanel'
import { formatChartDate } from './formatters'
import { useChartLayout } from './useChartLayout'
import { useChartTheme } from './useChartTheme'

interface ActivityTrendChartProps {
  data: AdminStats['dailyTrend']
}

const ActivityTrendChart = ({ data }: ActivityTrendChartProps) => {
  const chart = useChartTheme()
  const layout = useChartLayout()
  const chartData = data.map((row) => ({
    ...row,
    label: formatChartDate(row.date),
  }))

  return (
    <DashboardPanel
      title="활동 추이"
      description="최근 7일 가입, 메모, 업로드"
      className="min-w-0 lg:col-span-2"
    >
      <div className="w-full min-w-0" style={{ height: layout.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={layout.margin}>
            <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: chart.text, fontSize: layout.tickSize }}
              axisLine={false}
              tickLine={false}
              interval={layout.isMobile ? 1 : 0}
            />
            {layout.showYAxis && (
              <YAxis
                allowDecimals={false}
                tick={{ fill: chart.text, fontSize: layout.tickSize }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: chart.tooltipBg,
                borderColor: chart.tooltipBorder,
                borderRadius: 8,
                color: chart.isDark ? '#fff' : '#000',
                fontSize: layout.tickSize,
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: layout.tickSize,
                color: chart.text,
                paddingTop: layout.isMobile ? 8 : 0,
              }}
              iconSize={layout.isMobile ? 8 : 12}
            />
            <Line
              type="monotone"
              dataKey="users"
              name="가입"
              stroke={chart.series[0]}
              strokeWidth={layout.isMobile ? 1.5 : 2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="memos"
              name="메모"
              stroke={chart.series[1]}
              strokeWidth={layout.isMobile ? 1.5 : 2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="uploads"
              name="업로드"
              stroke={chart.series[2]}
              strokeWidth={layout.isMobile ? 1.5 : 2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardPanel>
  )
}

export default ActivityTrendChart
