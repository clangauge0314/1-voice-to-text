import { PLAN_LABELS, PLAN_LIMITS } from '../constants/plans.js'

export function getStartOfMonth(date = new Date()) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

export function shouldResetUsage(usagePeriodStart) {
  const periodStart = getStartOfMonth(usagePeriodStart)
  const currentStart = getStartOfMonth()
  return periodStart.getTime() < currentStart.getTime()
}

export async function ensureCurrentPeriod(user) {
  let needsSave = false

  if (!user.plan) {
    user.plan = 'free'
    needsSave = true
  }

  if (user.usedMinutes == null) {
    user.usedMinutes = 0
    needsSave = true
  }

  if (!user.usagePeriodStart) {
    user.usagePeriodStart = getStartOfMonth()
    needsSave = true
  }

  if (shouldResetUsage(user.usagePeriodStart)) {
    user.usedMinutes = 0
    user.usagePeriodStart = getStartOfMonth()
    needsSave = true
  }

  if (needsSave) {
    await user.save()
  }

  return user
}

export function toUsageResponse(user) {
  const totalMinutes = PLAN_LIMITS[user.plan]
  const usedMinutes = user.usedMinutes
  const remainingMinutes = Math.max(0, totalMinutes - usedMinutes)
  const usagePercent =
    totalMinutes === 0 ? 0 : Math.min(100, Math.round((usedMinutes / totalMinutes) * 100))

  return {
    plan: user.plan,
    planLabel: PLAN_LABELS[user.plan],
    usedMinutes,
    totalMinutes,
    remainingMinutes,
    usagePercent,
    usagePeriodStart: user.usagePeriodStart,
  }
}
