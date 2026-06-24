import { extractMemoSegments } from './memoSegments.js'

function findSegmentIndexForWord(segments, word) {
  if (!segments.length || word?.start == null) return -1

  const byRange = segments.findIndex(
    (segment) =>
      segment.start != null &&
      segment.end != null &&
      word.start >= segment.start &&
      word.start < segment.end,
  )

  if (byRange >= 0) return byRange

  return segments.reduce((best, segment, index) => {
    if (segment.start == null || word.start < segment.start) return best
    return index
  }, 0)
}

function buildSegmentText(segments, words, segmentIndex) {
  const segment = segments[segmentIndex]
  if (!segment) return ''

  const wordText = words
    .filter((word) => {
      if (word.start == null || segment.start == null || segment.end == null) return false
      return word.start >= segment.start && word.start < segment.end
    })
    .map((word) => word.word?.trim())
    .filter(Boolean)
    .join(' ')

  return wordText || segment.text?.trim() || ''
}

function buildLocalSentence(words, wordIndex, radius = 16) {
  const left = Math.max(0, wordIndex - radius)
  const right = Math.min(words.length, wordIndex + radius + 1)
  return words
    .slice(left, right)
    .map((word) => word.word?.trim())
    .filter(Boolean)
    .join(' ')
}

export function buildFullTranscriptText(segments, words) {
  if (segments.length > 0) {
    return segments
      .map((segment) => segment.text?.trim())
      .filter(Boolean)
      .join('\n')
  }

  return words
    .map((word) => word.word?.trim())
    .filter(Boolean)
    .join(' ')
}

export function buildWordNoteAiContext({ words, segments, wordIndex, transcriptContent }) {
  if (!Array.isArray(words) || wordIndex < 0 || wordIndex >= words.length) {
    throw new Error('유효하지 않은 단어 위치입니다.')
  }

  const word = words[wordIndex]
  const resolvedSegments =
    Array.isArray(segments) && segments.length > 0
      ? segments
      : extractMemoSegments(transcriptContent ?? {})

  const segmentIndex = findSegmentIndexForWord(resolvedSegments, word)
  const segment = segmentIndex >= 0 ? resolvedSegments[segmentIndex] : null
  const segmentText =
    segmentIndex >= 0
      ? buildSegmentText(resolvedSegments, words, segmentIndex)
      : buildLocalSentence(words, wordIndex)

  const fullTranscript = buildFullTranscriptText(resolvedSegments, words)
  const targetWord = word.word?.trim() ?? ''

  if (!targetWord) {
    throw new Error('대상 단어가 비어 있습니다.')
  }

  return {
    targetWord,
    segmentText: segmentText || buildLocalSentence(words, wordIndex),
    fullTranscript: fullTranscript || segmentText || targetWord,
    speaker: word.speaker ?? segment?.speaker ?? null,
    start: word.start ?? segment?.start ?? null,
    end: word.end ?? segment?.end ?? null,
    language: transcriptContent?.language ?? null,
  }
}
