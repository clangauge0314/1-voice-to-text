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
