function normalizeSpeaker(value) {
  if (value == null || value === '') return null
  return String(value)
}

export function normalizeMemoSegment(segment, index) {
  const normalized = {
    start: typeof segment.start === 'number' ? segment.start : undefined,
    end: typeof segment.end === 'number' ? segment.end : undefined,
    text: typeof segment.text === 'string' ? segment.text.trim() : '',
    speaker: normalizeSpeaker(segment.speaker),
  }

  if (!normalized.text && normalized.start == null && normalized.end == null) {
    return null
  }

  return normalized
}

export function extractMemoSegments(content) {
  if (!content || !Array.isArray(content.segments)) return []

  return content.segments
    .map((segment, index) => normalizeMemoSegment(segment, index))
    .filter(Boolean)
}

export function buildPreviewFromSegments(segments) {
  const text = segments
    .map((segment) => segment.text)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.slice(0, 80) || '전사 내용 없음'
}
