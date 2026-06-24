import { getPlanConfig, normalizePlan } from '../constants/plans.js'

export function getStartOfMonth(date = new Date()) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

export function shouldResetUsage(usagePeriodStart) {
  const periodStart = getStartOfMonth(usagePeriodStart)
  const currentStart = getStartOfMonth()
  return periodStart.getTime() < currentStart.getTime()
}

/** 초 → 분 (소수 1자리, UI 표시용) */
export function secondsToDisplayMinutes(seconds) {
  return Math.round((seconds / 60) * 10) / 10
}

export function getMonthlyLimitSeconds(plan) {
  return getPlanConfig(plan).monthlyMinutes * 60
}

export function getUsedSeconds(user) {
  if (user.usedSeconds != null && user.usedSeconds > 0) {
    return user.usedSeconds
  }
  return (user.usedMinutes ?? 0) * 60
}

export function getRemainingSeconds(user) {
  const limitSeconds = getMonthlyLimitSeconds(user.plan)
  return Math.max(0, limitSeconds - getUsedSeconds(user))
}

export async function ensureCurrentPeriod(user) {
  let needsSave = false

  const normalizedPlan = normalizePlan(user.plan)
  if (user.plan !== normalizedPlan) {
    user.plan = normalizedPlan
    needsSave = true
  }

  if (user.usedMinutes == null) {
    user.usedMinutes = 0
    needsSave = true
  }

  if (user.usedSeconds == null) {
    user.usedSeconds = (user.usedMinutes ?? 0) * 60
    needsSave = true
  } else if (user.usedSeconds === 0 && (user.usedMinutes ?? 0) > 0) {
    user.usedSeconds = user.usedMinutes * 60
    needsSave = true
  }

  if (user.usedAiNotes == null) {
    user.usedAiNotes = 0
    needsSave = true
  }

  if (!user.usagePeriodStart) {
    user.usagePeriodStart = getStartOfMonth()
    needsSave = true
  }

  if (shouldResetUsage(user.usagePeriodStart)) {
    user.usedMinutes = 0
    user.usedSeconds = 0
    user.usedAiNotes = 0
    user.usagePeriodStart = getStartOfMonth()
    needsSave = true
  }

  if (needsSave) {
    await user.save()
  }

  return user
}

export function assertTranscriptionAvailable(user, requiredSeconds) {
  if (!requiredSeconds || requiredSeconds <= 0) return

  const plan = getPlanConfig(user.plan)
  const remainingSeconds = getRemainingSeconds(user)

  if (requiredSeconds > remainingSeconds) {
    const requiredMinutes = secondsToDisplayMinutes(requiredSeconds)
    const remainingMinutes = secondsToDisplayMinutes(remainingSeconds)
    const error = new Error(
      `이번 달 음성 분석 한도가 부족합니다. (필요 ${requiredMinutes}분 · 남은 ${remainingMinutes}분)`,
    )
    error.statusCode = 403
    throw error
  }
}

export async function consumeTranscriptionSeconds(user, seconds) {
  if (!seconds || seconds <= 0) return user

  const usedSeconds = getUsedSeconds(user) + seconds
  user.usedSeconds = usedSeconds
  user.usedMinutes = secondsToDisplayMinutes(usedSeconds)
  await user.save()
  return user
}

export function assertAiNoteAvailable(user) {
  const plan = getPlanConfig(user.plan)
  const usedAiNotes = user.usedAiNotes ?? 0

  if (usedAiNotes >= plan.monthlyAiNotes) {
    const error = new Error(
      `이번 달 AI 메모 한도(${plan.monthlyAiNotes}회)를 모두 사용했습니다. 멤버십을 업그레이드해주세요.`,
    )
    error.statusCode = 403
    throw error
  }
}

export async function consumeAiNote(user) {
  user.usedAiNotes = (user.usedAiNotes ?? 0) + 1
  await user.save()
  return user
}

export function toUsageResponse(user) {
  const plan = getPlanConfig(user.plan)
  const usedSeconds = getUsedSeconds(user)
  const totalSeconds = getMonthlyLimitSeconds(user.plan)
  const remainingSeconds = Math.max(0, totalSeconds - usedSeconds)
  const usedAiNotes = user.usedAiNotes ?? 0
  const totalAiNotes = plan.monthlyAiNotes
  const remainingAiNotes = Math.max(0, totalAiNotes - usedAiNotes)
  const usedMinutes = secondsToDisplayMinutes(usedSeconds)
  const totalMinutes = plan.monthlyMinutes
  const remainingMinutes = secondsToDisplayMinutes(remainingSeconds)
  const usagePercent =
    totalSeconds === 0 ? 0 : Math.min(100, Math.round((usedSeconds / totalSeconds) * 100))
  const aiUsagePercent =
    totalAiNotes === 0 ? 0 : Math.min(100, Math.round((usedAiNotes / totalAiNotes) * 100))

  return {
    plan: normalizePlan(user.plan),
    planLabel: plan.label,
    usedMinutes,
    totalMinutes,
    remainingMinutes,
    usedSeconds,
    totalSeconds,
    remainingSeconds,
    usagePercent,
    usedAiNotes,
    totalAiNotes,
    remainingAiNotes,
    aiUsagePercent,
    usagePeriodStart: user.usagePeriodStart,
  }
}
