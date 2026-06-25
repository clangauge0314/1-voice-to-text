const CREDIT_MODE_PLAN = 'credit'

/** 초 → 분 (소수 1자리, UI 표시용) */
export function secondsToDisplayMinutes(seconds) {
  return Math.round((seconds / 60) * 10) / 10
}

export function getUsedSeconds(user) {
  if (user.usedSeconds != null && user.usedSeconds > 0) {
    return user.usedSeconds
  }
  return (user.usedMinutes ?? 0) * 60
}

export function getRemainingSeconds(user) {
  return Math.max(0, Number(user.audioSecondsBalance ?? 0))
}

export async function ensureCurrentPeriod(user) {
  let needsSave = false

  if (user.plan !== CREDIT_MODE_PLAN) {
    user.plan = CREDIT_MODE_PLAN
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

  if (user.usedAiNotes == null || user.usedAiNotes < 0) {
    user.usedAiNotes = 0
    needsSave = true
  }

  if (user.audioSecondsBalance == null || user.audioSecondsBalance < 0) {
    user.audioSecondsBalance = 0
    needsSave = true
  }

  if (user.aiNotesBalance == null || user.aiNotesBalance < 0) {
    user.aiNotesBalance = 0
    needsSave = true
  }

  if (!user.usagePeriodStart) {
    user.usagePeriodStart = user.createdAt ?? new Date()
    needsSave = true
  }

  if (needsSave) {
    await user.save()
  }

  return user
}

export function assertTranscriptionAvailable(user, requiredSeconds) {
  if (!requiredSeconds || requiredSeconds <= 0) return

  const remainingSeconds = getRemainingSeconds(user)

  if (requiredSeconds > remainingSeconds) {
    const requiredMinutes = secondsToDisplayMinutes(requiredSeconds)
    const remainingMinutes = secondsToDisplayMinutes(remainingSeconds)
    const error = new Error(
      `보유한 음성 크레딧이 부족합니다. (필요 ${requiredMinutes}분 · 남은 ${remainingMinutes}분)`,
    )
    error.statusCode = 403
    throw error
  }
}

export async function consumeTranscriptionSeconds(user, seconds) {
  if (!seconds || seconds <= 0) return user

  const currentBalance = Math.max(0, Number(user.audioSecondsBalance ?? 0))
  if (seconds > currentBalance) {
    const error = new Error('보유한 음성 크레딧이 부족합니다.')
    error.statusCode = 403
    throw error
  }

  const usedSeconds = getUsedSeconds(user) + seconds
  user.usedSeconds = usedSeconds
  user.usedMinutes = secondsToDisplayMinutes(usedSeconds)
  user.audioSecondsBalance = currentBalance - seconds
  await user.save()
  return user
}

export function assertAiNoteAvailable(user) {
  const balance = Number(user.aiNotesBalance ?? 0)
  if (balance <= 0) {
    const error = new Error('보유한 AI 메모 크레딧이 부족합니다. 충전 후 다시 시도해주세요.')
    error.statusCode = 403
    throw error
  }
}

export async function consumeAiNote(user) {
  const balance = Number(user.aiNotesBalance ?? 0)
  if (balance <= 0) {
    const error = new Error('보유한 AI 메모 크레딧이 부족합니다.')
    error.statusCode = 403
    throw error
  }

  user.usedAiNotes = (user.usedAiNotes ?? 0) + 1
  user.aiNotesBalance = balance - 1
  await user.save()
  return user
}

export function toUsageResponse(user) {
  const usedSeconds = getUsedSeconds(user)
  const remainingSeconds = Math.max(0, Number(user.audioSecondsBalance ?? 0))
  const totalSeconds = usedSeconds + remainingSeconds
  const usedAiNotes = user.usedAiNotes ?? 0
  const remainingAiNotes = Math.max(0, Number(user.aiNotesBalance ?? 0))
  const totalAiNotes = usedAiNotes + remainingAiNotes
  const usedMinutes = secondsToDisplayMinutes(usedSeconds)
  const totalMinutes = secondsToDisplayMinutes(totalSeconds)
  const remainingMinutes = secondsToDisplayMinutes(remainingSeconds)
  const usagePercent =
    totalSeconds === 0 ? 0 : Math.min(100, Math.round((usedSeconds / totalSeconds) * 100))
  const aiUsagePercent =
    totalAiNotes === 0 ? 0 : Math.min(100, Math.round((usedAiNotes / totalAiNotes) * 100))

  return {
    plan: CREDIT_MODE_PLAN,
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
    audioSecondsBalance: remainingSeconds,
    aiNotesBalance: remainingAiNotes,
  }
}
