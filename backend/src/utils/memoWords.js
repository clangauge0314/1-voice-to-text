function normalizeSpeaker(value) {
  if (value == null || value === '') return null
  return String(value)
}

export const MAX_WORD_NOTE_LENGTH = 2000

export function normalizeWordNote(value) {
  if (value == null || typeof value !== 'string') return undefined
  const trimmed = value.trim().slice(0, MAX_WORD_NOTE_LENGTH)
  return trimmed || undefined
}

export function normalizeMemoWord(word, index) {
  const normalized = {
    id: typeof word.id === 'number' ? word.id : index,
    word: typeof word.word === 'string' ? word.word.trim() : '',
    start: typeof word.start === 'number' ? word.start : undefined,
    end: typeof word.end === 'number' ? word.end : undefined,
    speaker: normalizeSpeaker(word.speaker),
  }

  const note = normalizeWordNote(word.note)
  if (note) normalized.note = note

  return normalized
}

export function extractMemoWords(content) {
  if (!content || !Array.isArray(content.words)) return []

  return content.words
    .map((word, index) => normalizeMemoWord(word, index))
    .filter((word) => word.word)
}

export function buildPreviewFromWords(words) {
  const text = words
    .map((word) => word.word)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.slice(0, 80) || '전사 내용 없음'
}
