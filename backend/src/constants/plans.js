export const PLANS = {
  free: {
    label: 'Free',
    monthlyMinutes: 60,
    monthlyAiNotes: 10,
    price: 0,
  },
  basic: {
    label: 'Basic',
    monthlyMinutes: 240,
    monthlyAiNotes: 30,
    price: 4900,
  },
  pro: {
    label: 'Pro',
    monthlyMinutes: 600,
    monthlyAiNotes: 50,
    price: 9900,
  },
}

export const PLAN_TYPES = Object.keys(PLANS)

export const PLAN_LIMITS = Object.fromEntries(
  Object.entries(PLANS).map(([key, plan]) => [key, plan.monthlyMinutes]),
)

export const AI_NOTE_LIMITS = Object.fromEntries(
  Object.entries(PLANS).map(([key, plan]) => [key, plan.monthlyAiNotes]),
)

export const PLAN_LABELS = Object.fromEntries(
  Object.entries(PLANS).map(([key, plan]) => [key, plan.label]),
)

export function normalizePlan(plan) {
  if (plan === 'team') return 'pro'
  if (PLAN_TYPES.includes(plan)) return plan
  return 'free'
}

export function getPlanConfig(plan) {
  return PLANS[normalizePlan(plan)] ?? PLANS.free
}
