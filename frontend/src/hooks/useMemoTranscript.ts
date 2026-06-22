import { useEffect, useState } from 'react'
import { fetchMemo, fetchTranscript, fetchUpload } from '../lib/api'
import type { Memo, MemoWord } from '../stores/memoStore'
import { useMemoStore } from '../stores/memoStore'
import { buildMemoFromTranscript, toMemoWords } from '../utils/transcriptToMemo'
import type { TranscriptContent } from '../utils/transcriptToMemo'

function mapSavedWords(words: unknown): MemoWord[] | undefined {
  if (!Array.isArray(words) || words.length === 0) return undefined

  return words.map((word, index) => ({
    id: typeof word.id === 'number' ? word.id : index,
    word: String(word.word ?? '').trim(),
    start: typeof word.start === 'number' ? word.start : undefined,
    end: typeof word.end === 'number' ? word.end : undefined,
    speaker: word.speaker ?? undefined,
  }))
}

export function useMemoTranscript(memo: Memo | undefined) {
  const updateMemo = useMemoStore((state) => state.updateMemo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!memo?.transcriptId) return

    const needsWords = !memo.words?.length
    const needsSegments = !memo.segments?.length
    const needsAudio = !memo.audioUrl && !!memo.uploadId

    if (!needsWords && !needsSegments && !needsAudio) return

    let cancelled = false

    const hydrate = async () => {
      setLoading(true)
      setError(null)

      try {
        const [memoDetail, transcript, upload] = await Promise.all([
          needsWords ? fetchMemo(memo.id) : null,
          needsWords || needsSegments ? fetchTranscript(memo.transcriptId) : null,
          needsAudio ? fetchUpload(memo.uploadId) : null,
        ])

        if (cancelled) return

        const patch: Partial<Memo> = {}

        if (upload) {
          patch.audioUrl = upload.url
        }

        const savedWords = mapSavedWords(memoDetail?.words)
        if (savedWords?.length) {
          patch.words = savedWords
          patch.content = savedWords.map((word) => word.word).join(' ')
        } else if (transcript?.status === 'completed' && transcript.content) {
          const built = buildMemoFromTranscript(transcript, memo.title, {
            audioUrl: upload?.url ?? memo.audioUrl,
          })

          patch.content = built.content
          patch.preview = built.preview
          patch.speakers = built.speakers
          patch.segments = built.segments
          patch.words = built.words
          patch.segmentCount = built.segmentCount
          patch.wordCount = built.wordCount
          patch.duration = built.duration ?? memo.duration
          patch.language = built.language ?? memo.language
          if (built.audioUrl) patch.audioUrl = built.audioUrl
        } else if (transcript?.status === 'completed' && transcript.content && needsSegments) {
          const built = buildMemoFromTranscript(transcript, memo.title, {
            audioUrl: upload?.url ?? memo.audioUrl,
          })
          patch.content = built.content
          patch.preview = built.preview
          patch.speakers = built.speakers
          patch.segments = built.segments
          patch.segmentCount = built.segmentCount
          patch.wordCount = built.wordCount
          patch.duration = built.duration ?? memo.duration
          patch.language = built.language ?? memo.language
          if (built.audioUrl) patch.audioUrl = built.audioUrl
        } else if (needsWords && transcript?.content) {
          const words = toMemoWords((transcript.content as TranscriptContent).words)
          if (words.length > 0) {
            patch.words = words
          }
        }

        if (Object.keys(patch).length > 0) {
          updateMemo(memo.id, patch)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '전사를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [
    memo?.id,
    memo?.transcriptId,
    memo?.uploadId,
    memo?.audioUrl,
    memo?.segments?.length,
    memo?.words?.length,
    memo?.title,
    updateMemo,
  ])

  return { loading, error }
}
