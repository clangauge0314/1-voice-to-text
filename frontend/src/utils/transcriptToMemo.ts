import type { TranscriptResponse } from '../lib/api'
import type { MemoInput, MemoSegment, MemoWord } from '../stores/memoStore'

export const UNKNOWN_SPEAKER = '__UNKNOWN__'

export interface TranscriptContent {
  filename?: string
  language?: string
  duration?: number
  transcript?: string
  speakers?: string[]
  word_count?: number
  segment_count?: number
  words?: Array<{
    word?: string
    start?: number
    end?: number
    score?: number
    speaker?: string | null
  }>
  segments?: Array<{
    id?: number
    start?: number
    end?: number
    text?: string
    speaker?: string | null
  }>
}

export function normalizeSpeaker(speaker: string | null | undefined): string {
  if (!speaker || speaker === 'UNKNOWN') return UNKNOWN_SPEAKER
  return speaker
}

export function transcriptToText(content: unknown): string {
  if (!content) return ''

  if (typeof content === 'string') return content

  if (typeof content === 'object' && content !== null) {
    const data = content as TranscriptContent
    const segments = toMemoSegments(data.segments)

    if (segments.length > 0) {
      return buildReadableContent(segments)
    }

    if (typeof data.transcript === 'string' && data.transcript.trim()) {
      return stripSpeakerTags(data.transcript)
    }

    const record = content as Record<string, unknown>
    if (typeof record.text === 'string' && record.text.trim()) {
      return record.text.trim()
    }
  }

  return ''
}

export function stripSpeakerTags(text: string): string {
  return text.replace(/\[(?:SPEAKER_\d+|UNKNOWN)\]\s*/gi, '').trim()
}

export function buildReadableContent(segments: MemoSegment[]): string {
  return segments
    .map((segment) => segment.text?.trim())
    .filter(Boolean)
    .join('\n\n')
}

export function collectSpeakers(segments: MemoSegment[]): string[] {
  const seen = new Set<string>()
  const speakers: string[] = []

  for (const segment of segments) {
    const speaker = normalizeSpeaker(segment.speaker)
    if (!seen.has(speaker)) {
      seen.add(speaker)
      speakers.push(speaker)
    }
  }

  return speakers
}

export function formatTimestamp(seconds?: number): string {
  if (seconds == null || Number.isNaN(seconds)) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatPreciseTimestamp(seconds?: number): string {
  if (seconds == null || Number.isNaN(seconds)) return '-'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`
}

export function formatSpeakerLabel(speaker: string | undefined, _index = 0): string {
  if (!speaker || speaker === UNKNOWN_SPEAKER || speaker === 'UNKNOWN') {
    return '미확인 화자'
  }
  const match = speaker.match(/SPEAKER_(\d+)/i)
  if (match) return `화자 ${Number(match[1]) + 1}`
  return speaker
}

export function getSpeakerColor(
  speaker: string | undefined,
  speakerColorMap: Map<string, string>,
  index: number,
): string {
  const normalized = normalizeSpeaker(speaker)
  if (normalized === UNKNOWN_SPEAKER) {
    return 'text-black/45 dark:text-white/45'
  }
  return (
    speakerColorMap.get(normalized) ||
    SPEAKER_COLORS[index % SPEAKER_COLORS.length]
  )
}

export const SPEAKER_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-amber-600 dark:text-amber-400',
  'text-violet-600 dark:text-violet-400',
  'text-rose-600 dark:text-rose-400',
]

export function toMemoSegments(segments: TranscriptContent['segments']): MemoSegment[] {
  if (!Array.isArray(segments)) return []

  return segments
    .map((segment) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text?.trim(),
      speaker: normalizeSpeaker(segment.speaker),
    }))
    .filter((segment) => segment.text)
}

export function findActiveSegmentIndex(
  segments: MemoSegment[],
  currentTime: number,
): number {
  return segments.findIndex(
    (segment) =>
      segment.start != null &&
      segment.end != null &&
      currentTime >= segment.start &&
      currentTime < segment.end,
  )
}

export function toMemoWords(words: TranscriptContent['words']): MemoWord[] {
  if (!Array.isArray(words)) return []

  return words
    .map((word, index) => ({
      id: index,
      word: word.word?.trim() ?? '',
      start: word.start,
      end: word.end,
      speaker: normalizeSpeaker(word.speaker),
    }))
    .filter((word) => word.word)
}

export function groupWordsBySegments(
  segments: MemoSegment[],
  words: MemoWord[],
): Array<{ segmentIndex: number; segment: MemoSegment; wordIndices: number[] }> {
  if (!segments.length) return []

  const groups = segments.map((segment, segmentIndex) => ({
    segmentIndex,
    segment,
    wordIndices: [] as number[],
  }))

  if (!words.length) return groups

  words.forEach((word, wordIndex) => {
    if (word.start == null) return

    let segmentIndex = segments.findIndex(
      (segment) =>
        segment.start != null &&
        segment.end != null &&
        word.start! >= segment.start &&
        word.start! < segment.end,
    )

    if (segmentIndex < 0) {
      segmentIndex = segments.reduce((best, segment, index) => {
        if (segment.start == null || word.start! < segment.start) return best
        return index
      }, 0)
    }

    groups[segmentIndex].wordIndices.push(wordIndex)
  })

  return groups
}

export function canMergeSelectedSegmentIndices(indices: number[]): boolean {
  return canMergeSelectedIndices(indices)
}

export function mergeSegmentRange(segments: MemoSegment[], indices: number[]): MemoSegment[] {
  if (!canMergeSelectedSegmentIndices(indices)) return segments

  const sorted = [...indices].sort((a, b) => a - b)
  const left = sorted[0]
  const right = sorted[sorted.length - 1]
  const slice = segments.slice(left, right + 1)

  const merged: MemoSegment = {
    start: slice[0].start ?? slice.find((segment) => segment.start != null)?.start,
    end:
      slice[slice.length - 1].end ??
      [...slice].reverse().find((segment) => segment.end != null)?.end,
    text: slice
      .map((segment) => segment.text?.trim())
      .filter(Boolean)
      .join(' '),
    speaker: slice[0].speaker ?? slice.find((segment) => segment.speaker)?.speaker,
  }

  const next = [...segments]
  next.splice(left, sorted.length, merged)
  return next
}

export function getSegmentIndicesForWordIndices(
  segments: MemoSegment[],
  words: MemoWord[],
  wordIndices: number[],
): number[] {
  const groups = groupWordsBySegments(segments, words)
  const found = new Set<number>()

  wordIndices.forEach((wordIndex) => {
    groups.forEach((group) => {
      if (group.wordIndices.includes(wordIndex)) {
        found.add(group.segmentIndex)
      }
    })
  })

  return [...found].sort((a, b) => a - b)
}

export function syncSegmentTextsFromWords(
  segments: MemoSegment[],
  words: MemoWord[],
): MemoSegment[] {
  if (!segments.length) return segments

  const groups = groupWordsBySegments(segments, words)

  return segments.map((segment, index) => {
    const wordText = groups[index]?.wordIndices
      .map((wordIndex) => words[wordIndex]?.word?.trim())
      .filter(Boolean)
      .join(' ')

    return wordText ? { ...segment, text: wordText } : segment
  })
}

export function applyWordMergeWithSegments(
  segments: MemoSegment[],
  words: MemoWord[],
  indices: number[],
): { segments: MemoSegment[]; words: MemoWord[] } {
  if (!canMergeSelectedIndices(indices)) {
    return { segments, words }
  }

  const nextWords = mergeWordRange(words, indices)
  const segmentIndices = getSegmentIndicesForWordIndices(segments, words, indices)
  let nextSegments = segments

  if (segmentIndices.length > 1) {
    nextSegments = mergeSegmentRange(segments, segmentIndices)
  }

  nextSegments = syncSegmentTextsFromWords(nextSegments, nextWords)
  return { segments: nextSegments, words: nextWords }
}

export function mergeSelectedSegments(
  segments: MemoSegment[],
  words: MemoWord[],
  segmentIndices: number[],
): { segments: MemoSegment[]; words: MemoWord[] } {
  if (!canMergeSelectedSegmentIndices(segmentIndices)) {
    return { segments, words }
  }

  const nextSegments = syncSegmentTextsFromWords(
    mergeSegmentRange(segments, segmentIndices),
    words,
  )

  return { segments: nextSegments, words }
}

export function applyWordSplitWithSegments(
  segments: MemoSegment[],
  _words: MemoWord[],
  nextWords: MemoWord[],
): MemoSegment[] {
  if (!segments.length) return segments
  return syncSegmentTextsFromWords(segments, nextWords)
}

export function findActiveWordIndex(words: MemoWord[], currentTime: number): number {
  if (!words.length) return -1

  let activeIndex = -1

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    if (word.start == null) continue

    if (currentTime >= word.start) {
      activeIndex = index
      continue
    }

    break
  }

  if (activeIndex !== -1) return activeIndex

  return words.findIndex(
    (word) =>
      word.start != null &&
      word.end != null &&
      currentTime >= word.start &&
      currentTime < word.end,
  )
}

export function buildReadableContentFromWords(words: MemoWord[]): string {
  return words
    .map((word) => word.word.trim())
    .filter(Boolean)
    .join(' ')
}

export function reindexMemoWords(words: MemoWord[]): MemoWord[] {
  return words.map((word, index) => ({ ...word, id: index }))
}

export function mergeWordNotes(words: MemoWord[]): string | undefined {
  const notes = words.map((word) => word.note?.trim()).filter(Boolean)
  if (notes.length === 0) return undefined
  return notes.join('\n\n')
}

export function canMergeWordIndices(a: number, b: number): boolean {
  if (a < 0 || b < 0 || a === b) return false
  return Math.abs(a - b) === 1
}

export function canMergeSelectedIndices(indices: number[]): boolean {
  if (indices.length < 2) return false

  const sorted = [...indices].sort((a, b) => a - b)
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index] !== sorted[index - 1] + 1) return false
  }

  return true
}

export function mergeAdjacentWords(
  words: MemoWord[],
  firstIndex: number,
  secondIndex: number,
): MemoWord[] {
  const left = Math.min(firstIndex, secondIndex)
  const right = Math.max(firstIndex, secondIndex)

  return mergeWordRange(words, Array.from({ length: right - left + 1 }, (_, index) => left + index))
}

export function mergeWordRange(words: MemoWord[], indices: number[]): MemoWord[] {
  if (!canMergeSelectedIndices(indices)) return words

  const sorted = [...indices].sort((a, b) => a - b)
  const left = sorted[0]
  const right = sorted[sorted.length - 1]
  const slice = words.slice(left, right + 1)

  const merged: MemoWord = {
    id: slice[0].id,
    word: slice.map((word) => word.word.trim()).filter(Boolean).join(' '),
    start: slice[0].start ?? slice.find((word) => word.start != null)?.start,
    end: slice[slice.length - 1].end ?? [...slice].reverse().find((word) => word.end != null)?.end,
    speaker: slice[0].speaker ?? slice.find((word) => word.speaker)?.speaker,
    note: mergeWordNotes(slice),
  }

  const next = [...words]
  next.splice(left, sorted.length, merged)
  return reindexMemoWords(next)
}

export function canSplitWord(word: MemoWord | undefined): boolean {
  if (!word?.word?.trim()) return false
  return /\s/.test(word.word.trim())
}

function splitWordIntoParts(word: MemoWord): MemoWord[] {
  const parts = word.word.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return [word]

  const { start, end, speaker, note } = word
  if (start == null || end == null || end <= start) {
    return parts.map((part, index) => ({
      id: 0,
      word: part,
      start: word.start,
      end: word.end,
      speaker,
      note: index === 0 ? note : undefined,
    }))
  }

  const totalChars = parts.reduce((sum, part) => sum + part.length, 0)
  let elapsed = 0

  return parts.map((part, index) => {
    elapsed += part.length
    const partStart =
      index === 0 ? start : start + ((end - start) * (elapsed - part.length)) / totalChars
    const partEnd = index === parts.length - 1 ? end : start + ((end - start) * elapsed) / totalChars

    return {
      id: 0,
      word: part,
      start: partStart,
      end: partEnd,
      speaker,
      note: index === 0 ? note : undefined,
    }
  })
}

export function splitWordAtIndex(words: MemoWord[], index: number): MemoWord[] {
  if (index < 0 || index >= words.length) return words
  if (!canSplitWord(words[index])) return words

  const next = [...words]
  next.splice(index, 1, ...splitWordIntoParts(words[index]))
  return reindexMemoWords(next)
}

export function canSplitSelectedIndices(words: MemoWord[], indices: number[]): boolean {
  if (!indices.length) return false
  return indices.some((index) => canSplitWord(words[index]))
}

export function splitWordsAtIndices(words: MemoWord[], indices: number[]): MemoWord[] {
  if (!canSplitSelectedIndices(words, indices)) return words

  const indexSet = new Set(indices)
  const next = words.flatMap((word, index) =>
    indexSet.has(index) && canSplitWord(word) ? splitWordIntoParts(word) : [word],
  )

  return reindexMemoWords(next)
}

export function buildPreviewFromWords(words: MemoWord[]): string {
  return buildReadableContentFromWords(words).replace(/\s+/g, ' ').slice(0, 80) || '전사 내용 없음'
}

export function buildMemoFromTranscript(
  transcript: TranscriptResponse,
  fileName: string,
  options?: { audioUrl?: string },
): MemoInput {
  const data = (transcript.content ?? {}) as TranscriptContent
  const segments = toMemoSegments(data.segments)
  const words = toMemoWords(data.words)
  const speakers =
    segments.length > 0 ? collectSpeakers(segments) : (data.speakers ?? []).map(normalizeSpeaker)
  const text =
    words.length > 0
      ? buildReadableContentFromWords(words)
      : segments.length > 0
        ? buildReadableContent(segments)
        : transcriptToText(data)
  const previewSource =
    words.length > 0
      ? buildPreviewFromWords(words)
      : segments[0]?.text ?? stripSpeakerTags(data.transcript ?? text)

  return {
    title: fileNameToTitle(data.filename ?? fileName),
    preview: previewSource.replace(/\s+/g, ' ').slice(0, 80) || '전사 내용 없음',
    content: text,
    transcriptId: transcript.id,
    uploadId: transcript.uploadId,
    audioUrl: options?.audioUrl,
    duration: data.duration,
    language: data.language,
    speakers,
    segmentCount: data.segment_count ?? segments.length,
    wordCount: data.word_count ?? words.length,
    segments: segments.length > 0 ? segments : undefined,
    words: words.length > 0 ? words : undefined,
  }
}

export function fileNameToTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '') || '새 메모'
}

export function formatMemoDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

export function formatDuration(seconds?: number): string | null {
  if (seconds == null || Number.isNaN(seconds)) return null
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (minutes === 0) return `${secs}초`
  return `${minutes}분 ${secs}초`
}

export function formatCount(count?: number, unit = ''): string | null {
  if (count == null || Number.isNaN(count)) return null
  return unit ? `${count.toLocaleString()}${unit}` : count.toLocaleString()
}
