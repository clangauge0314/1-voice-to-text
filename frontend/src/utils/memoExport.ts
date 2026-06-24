import type { Memo, MemoSegment, MemoWord } from '../stores/memoStore'
import {
  buildReadableContent,
  buildReadableContentFromWords,
  formatSpeakerLabel,
  stripSpeakerTags,
} from './transcriptToMemo'

export type SubtitleFormat = 'srt' | 'vtt'
export type TextExportFormat = 'paragraphs' | 'plain'

export interface SubtitleCue {
  start: number
  end: number
  text: string
  speaker?: string
}

export function sanitizeExportFileName(title: string, extension: string): string {
  const base = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
    .trim()

  return `${base || 'memo'}.${extension}`
}

export function formatSrtTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = Math.floor(safe % 60)
  const ms = Math.round((safe % 1) * 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

export function formatVttTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = Math.floor(safe % 60)
  const ms = Math.round((safe % 1) * 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

function resolveCueEnd(
  cues: SubtitleCue[],
  index: number,
  fallbackDuration = 2,
): number {
  const cue = cues[index]
  if (cue.end > cue.start) return cue.end

  const next = cues[index + 1]
  if (next?.start != null && next.start > cue.start) {
    return Math.max(cue.start + 0.3, next.start - 0.05)
  }

  return cue.start + fallbackDuration
}

export function segmentsToSubtitleCues(segments: MemoSegment[]): SubtitleCue[] {
  return segments
    .map((segment) => ({
      start: segment.start ?? 0,
      end: segment.end ?? segment.start ?? 0,
      text: segment.text?.trim() ?? '',
      speaker: segment.speaker,
    }))
    .filter((cue) => cue.text && cue.start != null)
    .map((cue, index, list) => ({
      ...cue,
      end: resolveCueEnd(list, index),
    }))
}

export function wordsToSubtitleCues(words: MemoWord[]): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  let current: SubtitleCue | null = null

  const MAX_DURATION = 5
  const MAX_WORDS = 12
  const MAX_GAP = 0.8

  for (const word of words) {
    if (!word.word.trim() || word.start == null) continue

    const wordEnd = word.end ?? word.start + 0.3

    if (!current) {
      current = {
        start: word.start,
        end: wordEnd,
        text: word.word.trim(),
        speaker: word.speaker,
      }
      continue
    }

    const gap = word.start - current.end
    const wordCount = current.text.split(/\s+/).length
    const duration = wordEnd - current.start

    if (gap > MAX_GAP || wordCount >= MAX_WORDS || duration > MAX_DURATION) {
      cues.push(current)
      current = {
        start: word.start,
        end: wordEnd,
        text: word.word.trim(),
        speaker: word.speaker,
      }
      continue
    }

    current.text = `${current.text} ${word.word.trim()}`
    current.end = wordEnd
  }

  if (current) cues.push(current)

  return cues.map((cue, index, list) => ({
    ...cue,
    end: resolveCueEnd(list, index, 1.5),
  }))
}

export function resolveSubtitleCues(memo: Pick<Memo, 'segments' | 'words'>): SubtitleCue[] {
  const segments = memo.segments ?? []
  if (segments.length > 0) {
    const cues = segmentsToSubtitleCues(segments)
    if (cues.length > 0) return cues
  }

  const words = memo.words ?? []
  if (words.length > 0) return wordsToSubtitleCues(words)

  return []
}

function formatCueText(
  cue: SubtitleCue,
  speakerIndex: number,
  includeSpeakers: boolean,
): string {
  const text = stripSpeakerTags(cue.text)
  if (!includeSpeakers || !cue.speaker) return text
  const label = formatSpeakerLabel(cue.speaker, speakerIndex)
  return `${label}: ${text}`
}

function speakerIndexMap(speakers: string[] | undefined, cue: SubtitleCue): number {
  if (!cue.speaker || !speakers?.length) return 0
  const index = speakers.indexOf(cue.speaker)
  return index >= 0 ? index : 0
}

export function buildSrt(
  cues: SubtitleCue[],
  options: { includeSpeakers?: boolean; speakers?: string[] } = {},
): string {
  const includeSpeakers = options.includeSpeakers ?? false

  return cues
    .map((cue, index) => {
      const text = formatCueText(cue, speakerIndexMap(options.speakers, cue), includeSpeakers)
      return [
        String(index + 1),
        `${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(cue.end)}`,
        text,
      ].join('\n')
    })
    .join('\n\n')
    .trim()
}

export function buildVtt(
  cues: SubtitleCue[],
  options: { includeSpeakers?: boolean; speakers?: string[] } = {},
): string {
  const includeSpeakers = options.includeSpeakers ?? false
  const body = cues
    .map((cue) => {
      const text = formatCueText(cue, speakerIndexMap(options.speakers, cue), includeSpeakers)
      return `${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}\n${text}`
    })
    .join('\n\n')

  return `WEBVTT\n\n${body}`.trim()
}

export function buildTextExport(
  memo: Pick<Memo, 'content' | 'segments' | 'words' | 'speakers'>,
  format: TextExportFormat = 'paragraphs',
): string {
  const segments = memo.segments ?? []
  const words = memo.words ?? []
  const hasMultipleSpeakers = (memo.speakers?.length ?? 0) > 1

  if (segments.length > 0) {
    if (format === 'plain') {
      return segments
        .map((segment) => stripSpeakerTags(segment.text ?? ''))
        .filter(Boolean)
        .join(' ')
        .trim()
    }

    if (hasMultipleSpeakers) {
      return segments
        .map((segment, index) => {
          const text = stripSpeakerTags(segment.text ?? '').trim()
          if (!text) return ''
          const label = formatSpeakerLabel(segment.speaker, index)
          return `${label}\n${text}`
        })
        .filter(Boolean)
        .join('\n\n')
        .trim()
    }

    return buildReadableContent(segments)
  }

  if (words.length > 0) {
    return buildReadableContentFromWords(words)
  }

  return memo.content?.trim() ?? ''
}

export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportMemoSubtitle(
  memo: Memo,
  format: SubtitleFormat,
  options: { includeSpeakers?: boolean } = {},
) {
  const cues = resolveSubtitleCues(memo)
  if (cues.length === 0) {
    throw new Error('보낼 자막 데이터가 없습니다.')
  }

  const includeSpeakers = options.includeSpeakers ?? (memo.speakers?.length ?? 0) > 1
  const content =
    format === 'srt'
      ? buildSrt(cues, { includeSpeakers, speakers: memo.speakers })
      : buildVtt(cues, { includeSpeakers, speakers: memo.speakers })

  const extension = format
  const mimeType = format === 'srt' ? 'application/x-subrip' : 'text/vtt'
  downloadTextFile(content, sanitizeExportFileName(memo.title, extension), mimeType)
}

export function exportMemoText(
  memo: Memo,
  format: TextExportFormat = 'paragraphs',
) {
  const content = buildTextExport(memo, format)
  if (!content.trim()) {
    throw new Error('보낼 텍스트가 없습니다.')
  }

  downloadTextFile(content, sanitizeExportFileName(memo.title, 'txt'), 'text/plain')
}
