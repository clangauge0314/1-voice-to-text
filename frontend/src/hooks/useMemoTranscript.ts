import { useEffect, useState } from 'react'

import { fetchMemo, fetchTranscript, fetchUpload, getUploadAudioUrl } from '../lib/api'

import type { Memo, MemoSegment, MemoWord } from '../stores/memoStore'

import { useMemoStore } from '../stores/memoStore'

import { buildMemoFromTranscript } from '../utils/transcriptToMemo'



function mapSavedSegments(segments: unknown): MemoSegment[] | undefined {
  if (!Array.isArray(segments) || segments.length === 0) return undefined

  return segments.map((segment) => ({
    start: typeof segment.start === 'number' ? segment.start : undefined,
    end: typeof segment.end === 'number' ? segment.end : undefined,
    text: typeof segment.text === 'string' ? segment.text.trim() || undefined : undefined,
    speaker: segment.speaker ?? undefined,
  }))
}

function mapSavedWords(words: unknown): MemoWord[] | undefined {

  if (!Array.isArray(words) || words.length === 0) return undefined



  return words.map((word, index) => ({
    id: typeof word.id === 'number' ? word.id : index,
    word: String(word.word ?? '').trim(),
    start: typeof word.start === 'number' ? word.start : undefined,
    end: typeof word.end === 'number' ? word.end : undefined,
    speaker: word.speaker ?? undefined,
    note: typeof word.note === 'string' ? word.note.trim() || undefined : undefined,
  }))

}



export function useMemoTranscript(memo: Memo | undefined) {

  const updateMemo = useMemoStore((state) => state.updateMemo)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)



  useEffect(() => {

    if (!memo?.transcriptId) return



    const needsDbWords = !memo.words?.length
    const needsSegments = !memo.segments?.length
    const needsAudio = !memo.audioUrl && !!memo.uploadId
    const needsMemoDetail = needsDbWords || needsSegments

    if (!needsMemoDetail && !needsAudio) return



    let cancelled = false



    const hydrate = async () => {

      setLoading(true)

      setError(null)



      try {

        const [memoDetail, transcript, upload] = await Promise.all([
          needsMemoDetail ? fetchMemo(memo.id) : null,
          needsSegments ? fetchTranscript(memo.transcriptId) : null,
          needsAudio ? fetchUpload(memo.uploadId) : null,
        ])



        if (cancelled) return



        const patch: Partial<Memo> = {}



        if (upload) {

          patch.audioUrl = upload.url || getUploadAudioUrl(memo.uploadId)

        }



        const savedWords = mapSavedWords(memoDetail?.words)
        const savedSegments = mapSavedSegments(memoDetail?.segments)

        if (savedWords?.length) {
          patch.words = savedWords
          patch.content = savedWords.map((word) => word.word).join(' ')
          patch.preview = memoDetail?.preview ?? memo.preview
        }

        if (savedSegments?.length) {
          patch.segments = savedSegments
          patch.segmentCount = savedSegments.length
        }

        if (transcript?.status === 'completed' && transcript.content) {

          const built = buildMemoFromTranscript(transcript, memo.title, {

            audioUrl: upload?.url || getUploadAudioUrl(memo.uploadId),

          })



          if (needsDbWords && !savedWords?.length && built.words?.length) {
            patch.words = built.words
            patch.content = built.content
            patch.preview = built.preview
          }



          if (needsSegments && !savedSegments?.length) {
            patch.speakers = built.speakers
            patch.segments = built.segments
            patch.segmentCount = built.segmentCount
            patch.wordCount = built.wordCount
            patch.duration = built.duration ?? memo.duration
            patch.language = built.language ?? memo.language
            if (built.audioUrl) patch.audioUrl = built.audioUrl
          } else if (needsSegments) {
            patch.speakers = built.speakers
            patch.wordCount = built.wordCount
            patch.duration = built.duration ?? memo.duration
            patch.language = built.language ?? memo.language
            if (built.audioUrl) patch.audioUrl = built.audioUrl
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

    memo?.preview,

    updateMemo,

  ])



  return { loading, error }

}


