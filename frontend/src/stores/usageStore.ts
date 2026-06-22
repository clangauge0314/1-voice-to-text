import { create } from 'zustand'

export type PlanType = 'free' | 'pro' | 'team'

export interface UsageData {
  plan: PlanType
  planLabel: string
  usedMinutes: number
  totalMinutes: number
  remainingMinutes: number
  usagePercent: number
  usagePeriodStart: string
}

const GUEST_USAGE: UsageData = {
  plan: 'free',
  planLabel: 'Free',
  usedMinutes: 0,
  totalMinutes: 60,
  remainingMinutes: 60,
  usagePercent: 0,
  usagePeriodStart: new Date().toISOString(),
}

interface UsageState extends UsageData {
  setUsage: (data: UsageData) => void
  resetToGuest: () => void
  getPlanLabel: () => string
  getTotalMinutes: () => number
  getRemainingMinutes: () => number
  getUsagePercent: () => number
}

export const useUsageStore = create<UsageState>()((set, get) => ({
  ...GUEST_USAGE,
  setUsage: (data) => set(data),
  resetToGuest: () => set(GUEST_USAGE),
  getPlanLabel: () => get().planLabel,
  getTotalMinutes: () => get().totalMinutes,
  getRemainingMinutes: () => get().remainingMinutes,
  getUsagePercent: () => get().usagePercent,
}))

export const formatMinutes = (minutes: number) => `${minutes}분`
