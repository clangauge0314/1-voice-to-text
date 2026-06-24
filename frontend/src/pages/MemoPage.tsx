import { motion } from 'framer-motion'
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ErrorBoundary } from '../components/ErrorBoundary'
import MemoExportButton from '../components/MemoExport/MemoExportButton'
import MemoPageShell from '../components/RightSidebar/MemoPageShell'
import MemoAudioPlayer from '../components/MemoWaveformPlayer/MemoWaveformPlayer'
import MemoTranscriptEditor from '../components/MemoTranscriptEditor/MemoTranscriptEditor'
import { resolveMemoAudioUrl } from '../lib/api'
import { useMemoTranscript } from '../hooks/useMemoTranscript'
import { useAuthStore } from '../stores/authStore'
import { getMemoById, useMemoStore } from '../stores/memoStore'
import { useMemoPlaybackStore } from '../stores/memoPlaybackStore'
import { useWordSelectionStore } from '../stores/wordSelectionStore'
import { useThemeStore } from '../stores/themeStore'
import {
  formatCount,
  formatDuration,
} from '../utils/transcriptToMemo'

const MemoPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const memos = useMemoStore((state) => state.memos)
  const ensureMemoLoaded = useMemoStore((state) => state.ensureMemoLoaded)
  const selectMemo = useMemoStore((state) => state.selectMemo)
  const renameMemo = useMemoStore((state) => state.renameMemo)
  const saveMemoContent = useMemoStore((state) => state.saveMemoContent)
  const deleteMemo = useMemoStore((state) => state.deleteMemo)
  const clearWordSelection = useWordSelectionStore((state) => state.clearSelection)
  const setPlaybackTime = useMemoPlaybackStore((state) => state.setCurrentTime)
  const resetPlayback = useMemoPlaybackStore((state) => state.resetPlayback)
  const memo = id ? getMemoById(id, memos) : undefined
  const { loading, error } = useMemoTranscript(memo)
  const theme = useThemeStore((state) => state.theme)

  const [pageState, setPageState] = useState<'loading' | 'ready' | 'not-found'>('loading')

  const seekRef = useRef<((time: number) => void) | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    resetPlayback()
    return () => {
      clearWordSelection()
      resetPlayback()
    }
  }, [id, clearWordSelection, resetPlayback])

  useEffect(() => {
    if (!id || !user) return

    let cancelled = false
    setPageState('loading')

    ensureMemoLoaded(id)
      .then(() => {
        if (!cancelled) setPageState('ready')
      })
      .catch(() => {
        if (!cancelled) setPageState('not-found')
      })

    return () => {
      cancelled = true
    }
  }, [id, user, ensureMemoLoaded])

  useEffect(() => {
    if (id && memo) selectMemo(id)
  }, [id, memo, selectMemo])

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
    setPlaybackTime(time)
  }, [setPlaybackTime])

  const seekTo = (seconds?: number) => {
    if (seconds == null || !seekRef.current) return
    seekRef.current(seconds)
  }

  const startEditTitle = () => {
    if (!memo) return
    setTitleDraft(memo.title)
    setIsEditingTitle(true)
  }

  const cancelEditTitle = () => {
    setIsEditingTitle(false)
    setTitleDraft('')
  }

  const saveTitle = async () => {
    if (!memo) return
    const trimmed = titleDraft.trim()
    if (!trimmed) {
      toast.error('제목을 입력해주세요.')
      return
    }

    setIsSavingTitle(true)
    try {
      await renameMemo(memo.id, trimmed)
      setIsEditingTitle(false)
      toast.success('메모 이름이 변경되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '이름 변경에 실패했습니다.')
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleDelete = async () => {
    if (!memo) return
    const confirmed = window.confirm(
      '메모, 전사 기록, Cloudinary 오디오 파일이 모두 삭제됩니다. 계속할까요?',
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteMemo(memo.id)
      toast.success('메모가 삭제되었습니다.')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '메모 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!id) return <Navigate to="/" replace />

  if (!user) {
    return (
      <MemoPageShell>
        <div className="flex h-full items-center justify-center px-10 text-sm text-black/50 dark:text-white/50">
          <Loader2 size={16} className="mr-2 animate-spin" />
          로그인 확인 중...
        </div>
      </MemoPageShell>
    )
  }

  if (pageState === 'loading' || (pageState === 'ready' && !memo)) {
    return (
      <MemoPageShell>
        <div className="flex h-full items-center justify-center px-10 text-sm text-black/50 dark:text-white/50">
          <Loader2 size={16} className="mr-2 animate-spin" />
          메모를 불러오는 중...
        </div>
      </MemoPageShell>
    )
  }

  if (pageState === 'not-found' || !memo) return <Navigate to="/" replace />

  const durationLabel = formatDuration(memo.duration)
  const segmentCountLabel = formatCount(memo.segmentCount, '개 구간')
  const wordCountLabel = formatCount(memo.wordCount, '개 단어')
  const hasWords = (memo.words?.length ?? 0) > 0
  const hasSegments = (memo.segments?.length ?? 0) > 0
  const hasTranscript = hasWords || hasSegments
  const audioUrl = memo ? resolveMemoAudioUrl(memo) : ''

  return (
    <MemoPageShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex h-full min-h-0 flex-col overflow-hidden text-left"
      >
      <div className="shrink-0 px-10 pt-12 pb-4 md:px-16 md:pt-14 lg:px-20 lg:pt-16">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs text-black/50 dark:text-white/50">{memo.updatedAt}</p>
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void saveTitle()
                  if (event.key === 'Escape') cancelEditTitle()
                }}
                className="w-full rounded-md border border-black/20 bg-transparent px-3 py-2 text-2xl font-bold text-black outline-none focus:border-black dark:border-white/20 dark:text-white dark:focus:border-white"
                autoFocus
                disabled={isSavingTitle}
              />
              <button
                type="button"
                onClick={() => void saveTitle()}
                disabled={isSavingTitle}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-black/20 text-black transition-colors hover:bg-black hover:text-white disabled:opacity-50 dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-black"
                aria-label="이름 저장"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={cancelEditTitle}
                disabled={isSavingTitle}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-black/20 text-black transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                aria-label="이름 변경 취소"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-black dark:text-white">{memo.title}</h1>
              <button
                type="button"
                onClick={startEditTitle}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="메모 이름 변경"
              >
                <Pencil size={15} />
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <MemoExportButton memo={memo} disabled={!hasTranscript} />
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            삭제
          </button>
        </div>
      </div>

      {(durationLabel ||
        memo.language ||
        segmentCountLabel ||
        wordCountLabel ||
        (memo.speakers?.length ?? 0) > 0) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {durationLabel && (
            <span className="rounded-md border border-black/15 px-2 py-0.5 text-xs text-black/60 dark:border-white/15 dark:text-white/60">
              {durationLabel}
            </span>
          )}
          {memo.language && (
            <span className="rounded-md border border-black/15 px-2 py-0.5 text-xs text-black/60 dark:border-white/15 dark:text-white/60">
              {memo.language.toUpperCase()}
            </span>
          )}
          {segmentCountLabel && (
            <span className="rounded-md border border-black/15 px-2 py-0.5 text-xs text-black/60 dark:border-white/15 dark:text-white/60">
              {segmentCountLabel}
            </span>
          )}
          {wordCountLabel && (
            <span className="rounded-md border border-black/15 px-2 py-0.5 text-xs text-black/60 dark:border-white/15 dark:text-white/60">
              {wordCountLabel}
            </span>
          )}
          {(memo.speakers?.length ?? 0) > 0 && (
            <span className="rounded-md border border-black/15 px-2 py-0.5 text-xs text-black/60 dark:border-white/15 dark:text-white/60">
              화자 {memo.speakers!.length}명
            </span>
          )}
        </div>
      )}

      {audioUrl && (
        <div className="mb-6 w-full min-w-0">
          <ErrorBoundary>
            <MemoAudioPlayer
              audioUrl={audioUrl}
              title={memo.title}
              theme={theme}
              onTimeUpdate={handleTimeUpdate}
              seekRef={seekRef}
            />
          </ErrorBoundary>
        </div>
      )}

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
          <Loader2 size={14} className="animate-spin" />
          전사 데이터를 불러오는 중...
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <div className="scrollbar-modern min-h-0 flex-1 overflow-y-auto px-10 pb-12 md:px-16 md:pb-14 lg:px-20 lg:pb-16">
      {hasTranscript ? (
        <MemoTranscriptEditor
          memoId={memo.id}
          segments={memo.segments}
          words={memo.words}
          speakers={memo.speakers ?? []}
          currentTime={currentTime}
          canSeek={!!audioUrl}
          onSeek={seekTo}
          onSaveContent={async ({ words, segments }) => {
            try {
              await saveMemoContent(memo.id, {
                words,
                segments: segments.length > 0 ? segments : memo.segments ?? [],
              })
            } catch (err) {
              toast.error(err instanceof Error ? err.message : '전사 저장에 실패했습니다.')
              throw err
            }
          }}
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-black dark:text-white">
          {memo.content}
        </p>
      )}
      </div>
      </motion.div>
    </MemoPageShell>
  )
}

export default MemoPage
