export const CREDIT_PACKS = {
  nano: {
    label: 'Nano',
    audioSeconds: 90 * 60,
    aiNotes: 15,
    price: 2900,
  },
  starter: {
    label: 'Starter',
    audioSeconds: 180 * 60,
    aiNotes: 30,
    price: 4900,
  },
  plus: {
    label: 'Plus',
    audioSeconds: 300 * 60,
    aiNotes: 55,
    price: 7900,
  },
  standard: {
    label: 'Standard',
    audioSeconds: 480 * 60,
    aiNotes: 90,
    price: 11900,
  },
  pro: {
    label: 'Pro',
    audioSeconds: 760 * 60,
    aiNotes: 145,
    price: 16900,
  },
  power: {
    label: 'Power',
    audioSeconds: 1200 * 60,
    aiNotes: 250,
    price: 23900,
  },
}

export const CREDIT_PACK_IDS = Object.keys(CREDIT_PACKS)

export function normalizeCreditPackId(packId) {
  if (typeof packId !== 'string') return null
  const normalized = packId.trim().toLowerCase()
  return CREDIT_PACK_IDS.includes(normalized) ? normalized : null
}

export function getCreditPack(packId) {
  const normalized = normalizeCreditPackId(packId)
  return normalized ? CREDIT_PACKS[normalized] : null
}
