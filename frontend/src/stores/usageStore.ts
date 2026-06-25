import { create } from 'zustand'

export type PlanType = 'credit'

export interface UsageData {
  plan: PlanType
  usedMinutes: number
  totalMinutes: number
  remainingMinutes: number
  usedSeconds: number
  totalSeconds: number
  remainingSeconds: number
  usagePercent: number
  usedAiNotes: number
  totalAiNotes: number
  remainingAiNotes: number
  aiUsagePercent: number
  usagePeriodStart: string
  audioSecondsBalance: number
  aiNotesBalance: number
}

const GUEST_USAGE: UsageData = {
  plan: 'credit',
  usedMinutes: 0,
  totalMinutes: 60,
  remainingMinutes: 60,
  usedSeconds: 0,
  totalSeconds: 3600,
  remainingSeconds: 3600,
  usagePercent: 0,
  usedAiNotes: 0,
  totalAiNotes: 10,
  remainingAiNotes: 10,
  aiUsagePercent: 0,
  usagePeriodStart: new Date().toISOString(),
  audioSecondsBalance: 3600,
  aiNotesBalance: 10,
}

interface UsageState extends UsageData {
  setUsage: (data: UsageData) => void
  resetToGuest: () => void
  getTotalMinutes: () => number
  getRemainingMinutes: () => number
  getUsagePercent: () => number
  getRemainingAiNotes: () => number
  getAiUsagePercent: () => number
}

export const useUsageStore = create<UsageState>()((set, get) => ({
  ...GUEST_USAGE,
  setUsage: (data) => set(data),
  resetToGuest: () => set(GUEST_USAGE),
  getTotalMinutes: () => get().totalMinutes,
  getRemainingMinutes: () => get().remainingMinutes,
  getUsagePercent: () => get().usagePercent,
  getRemainingAiNotes: () => get().remainingAiNotes,
  getAiUsagePercent: () => get().aiUsagePercent,
}))

export const formatMinutes = (minutes: number) => {
  const rounded = Math.round(minutes * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}분` : `${rounded}분`
}

/** 초 단위를 읽기 쉬운 문자열로 (밀리초는 초 소수부로 처리) */
export const formatDurationSeconds = (seconds: number) => {
  if (seconds < 60) {
    const rounded = Math.round(seconds * 10) / 10
    return `${rounded}초`
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (secs === 0) return `${mins}분`
  return `${mins}분 ${secs}초`
}
export const formatAiNotes = (count: number) => `${count}회`
