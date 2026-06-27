export function formatChartDate(date: string) {
  const [, month, day] = date.split('-')
  return `${month}/${day}`
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatCurrency(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

export const PACK_LABELS: Record<string, string> = {
  nano: 'Nano',
  starter: 'Starter',
  plus: 'Plus',
  standard: 'Standard',
  pro: 'Pro',
  power: 'Power',
}
