import { motion } from 'framer-motion'
import { Check, ChevronRight, FileAudio, Loader2, Upload } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { uploadAudio, startTranscription } from '../lib/api'
import { useAuthModalStore } from '../stores/authModalStore'
import { useAuthStore } from '../stores/authStore'
import { useMemoStore } from '../stores/memoStore'
import { formatAiNotes, formatDurationSeconds, formatMinutes, useUsageStore } from '../stores/usageStore'

const ACCEPTED_TYPES = ['audio/', 'video/']
const ACCEPTED_EXTENSIONS = /\.(mp3|wav|ogg|m4a|aac|flac|webm|mp4|mov|mkv)$/i

const UsageProgress = () => {
  const user = useAuthStore((state) => state.user)
  const planLabel = useUsageStore((state) => state.getPlanLabel())
  const usedMinutes = useUsageStore((state) => state.usedMinutes)
  const totalMinutes = useUsageStore((state) => state.getTotalMinutes())
  const remainingMinutes = useUsageStore((state) => state.getRemainingMinutes())
  const usagePercent = useUsageStore((state) => state.getUsagePercent())
  const usedAiNotes = useUsageStore((state) => state.usedAiNotes)
  const totalAiNotes = useUsageStore((state) => state.totalAiNotes)
  const remainingAiNotes = useUsageStore((state) => state.getRemainingAiNotes())
  const aiUsagePercent = useUsageStore((state) => state.getAiUsagePercent())

  return (
    <section className="mb-8 rounded-lg border border-black/20 p-5 dark:border-white/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-black dark:text-white">이번 달 사용량</p>
          <p className="mt-1 text-sm text-black/50 dark:text-white/50">
            {user ? (
              <>
                <span className="font-medium text-black/70 dark:text-white/70">{user.name}</span>
                <span> · {planLabel} 플랜</span>
              </>
            ) : (
              '비로그인 · Free 체험'
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-sm font-medium text-black/80 dark:text-white/80">음성 변환</p>
            <p className="text-sm tabular-nums text-black/55 dark:text-white/55">
              {formatMinutes(usedMinutes)} / {formatMinutes(totalMinutes)}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-black dark:bg-white"
            />
          </div>
          <p className="mt-2 text-sm text-black/50 dark:text-white/50">
            남은 시간 <span className="font-medium text-black/70 dark:text-white/70">{formatMinutes(remainingMinutes)}</span>
          </p>
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-sm font-medium text-black/80 dark:text-white/80">AI 학습 메모</p>
            <p className="text-sm tabular-nums text-black/55 dark:text-white/55">
              {formatAiNotes(usedAiNotes)} / {formatAiNotes(totalAiNotes)}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${aiUsagePercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-black/60 dark:bg-white/60"
            />
          </div>
          <p className="mt-2 text-sm text-black/50 dark:text-white/50">
            남은 횟수 <span className="font-medium text-black/70 dark:text-white/70">{formatAiNotes(remainingAiNotes)}</span>
          </p>
        </div>
      </div>
    </section>
  )
}

const isAcceptedFile = (file: File) =>
  ACCEPTED_TYPES.some((type) => file.type.startsWith(type)) ||
  ACCEPTED_EXTENSIONS.test(file.name)

const PROGRESS = {
  UPLOAD_MAX: 33,
  TRANSCRIBE: 66,
  MEMO: 90,
  COMPLETE: 100,
} as const

type ProcessStep = 'idle' | 'uploading' | 'transcribing' | 'creating-memo' | 'complete'

const getStepLabel = (step: ProcessStep) => {
  switch (step) {
    case 'uploading':
      return '파일 업로드 중…'
    case 'transcribing':
      return '음성을 텍스트로 변환 중…'
    case 'creating-memo':
      return '메모 저장 중…'
    case 'complete':
      return '완료! 메모가 준비됐어요'
    default:
      return '녹음 파일을 여기에 놓으세요'
  }
}

const ProcessProgressBar = ({ progress }: { progress: number }) => (
  <div className="mt-4 w-full max-w-sm">
    <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
      <motion.div
        className="h-full rounded-full bg-black dark:bg-white"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />
    </div>
  </div>
)

const StageSteps = ({ step }: { step: ProcessStep }) => {
  const stages = [
    { key: 'upload', label: '파일 업로드' },
    { key: 'transcribe', label: '텍스트 변환' },
    { key: 'memo', label: '메모 저장' },
  ] as const

  const stageIndex =
    step === 'uploading'
      ? 0
      : step === 'transcribing'
        ? 1
        : step === 'creating-memo'
          ? 2
          : step === 'complete'
            ? 3
            : -1

  return (
    <div className="mt-5 flex w-full max-w-sm flex-col gap-2 text-left">
      {stages.map((stage, index) => {
        const isDone = stageIndex > index
        const isActive = stageIndex === index && step !== 'complete'

        return (
          <div
            key={stage.key}
            className={`flex items-center gap-2.5 text-sm ${
              isDone || isActive
                ? 'text-black dark:text-white'
                : 'text-black/40 dark:text-white/40'
            }`}
          >
            {isDone ? (
              <Check size={15} strokeWidth={2} />
            ) : isActive ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <span className="h-3.5 w-3.5 rounded-full border border-black/20 dark:border-white/20" />
            )}
            <span className={isActive ? 'font-medium' : ''}>{stage.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const HomePage = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((state) => state.user)
  const openLogin = useAuthModalStore((state) => state.openLogin)
  const loadMemos = useMemoStore((state) => state.loadMemos)
  const memos = useMemoStore((state) => state.memos)
  const setUsage = useUsageStore((state) => state.setUsage)
  const recentMemos = memos.slice(0, 3)

  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [step, setStep] = useState<ProcessStep>('idle')
  const [overallProgress, setOverallProgress] = useState(0)

  const isProcessing =
    step === 'uploading' || step === 'transcribing' || step === 'creating-memo'
  const showProgress = step !== 'idle'

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = ''
  }

  const startUpload = useCallback(
    async (file: File) => {
      if (!user) {
        toast.error('로그인이 필요합니다.')
        openLogin()
        resetInput()
        return
      }

      setFileName(file.name)
      setStep('uploading')
      setOverallProgress(0)

      try {
        const upload = await uploadAudio(file, (fileProgress) => {
          setOverallProgress(Math.round((fileProgress / 100) * PROGRESS.UPLOAD_MAX))
        })

        setStep('transcribing')
        setOverallProgress(PROGRESS.TRANSCRIBE)

        const transcript = await startTranscription(upload.id)

        if (transcript.status !== 'completed') {
          setStep('idle')
          setFileName(null)
          setOverallProgress(0)
          toast.error(transcript.error ?? '전사에 실패했습니다.', {
            description: '파일은 Cloudinary에 업로드되었습니다.',
          })
          return
        }

        if (transcript.usage) {
          setUsage(transcript.usage)
        }

        setStep('creating-memo')
        setOverallProgress(PROGRESS.MEMO)

        await loadMemos()

        setOverallProgress(PROGRESS.COMPLETE)
        setStep('complete')

        toast.success('메모가 생성되었습니다.', {
          description: upload.duration
            ? `${formatDurationSeconds(upload.duration)} 차감 · ${upload.format.toUpperCase()}`
            : upload.format.toUpperCase(),
        })
      } catch (err) {
        setFileName(null)
        setStep('idle')
        setOverallProgress(0)
        toast.error(err instanceof Error ? err.message : '처리에 실패했습니다.')
      } finally {
        resetInput()
      }
    },
    [user, openLogin, loadMemos, setUsage],
  )

  const handleFile = useCallback(
    (file: File) => {
      if (!isAcceptedFile(file)) {
        toast.error('오디오 또는 비디오 파일만 업로드할 수 있습니다.')
        resetInput()
        return
      }

      if (isProcessing) return
      startUpload(file)
    },
    [isProcessing, startUpload],
  )

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      if (!isProcessing) setIsDragging(true)
    },
    [isProcessing],
  )

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      const file = event.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleZoneClick = () => {
    if (isProcessing) return
    inputRef.current?.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full px-10 py-12 text-left text-[1.0625rem] leading-relaxed md:px-16 md:py-14 lg:px-20 lg:py-16"
    >
      <section className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white md:text-4xl">
          음성을 텍스트 메모로
        </h1>
        <p className="mt-3 text-base text-black/60 dark:text-white/60 md:text-lg">
          회의·인터뷰·강의 녹음을 올리면 자동으로 글자로 바꿔 드려요.
          <br className="hidden sm:block" />
          단어별 AI 학습 메모까지 한곳에서 관리할 수 있습니다.
        </p>
        <p className="mt-2 text-sm text-black/45 dark:text-white/45">
          MP3 · WAV · M4A · MP4 지원
        </p>
      </section>

      <motion.button
        type="button"
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={isProcessing}
        animate={{ scale: isDragging ? 1.01 : 1 }}
        transition={{ duration: 0.15 }}
        className={`mb-8 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-14 text-center transition-colors ${
          isProcessing
            ? 'cursor-wait border-black/20 opacity-80 dark:border-white/20'
            : isDragging
              ? 'border-black bg-black/5 dark:border-white dark:bg-white/5'
              : 'border-black/20 hover:bg-black/[0.02] dark:border-white/20 dark:hover:bg-white/[0.02]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          disabled={isProcessing}
          onChange={handleInputChange}
        />

        <motion.div
          animate={{ y: isDragging && !isProcessing ? -4 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-lg border ${
            isProcessing
              ? 'border-black/20 text-black dark:border-white/20 dark:text-white'
              : isDragging
                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                : 'border-black/20 text-black dark:border-white/20 dark:text-white'
          }`}
        >
          {isProcessing ? (
            <Loader2 size={28} strokeWidth={1.5} className="animate-spin" />
          ) : isDragging ? (
            <Upload size={28} strokeWidth={1.5} />
          ) : step === 'complete' ? (
            <Check size={28} strokeWidth={1.5} />
          ) : (
            <FileAudio size={28} strokeWidth={1.5} />
          )}
        </motion.div>

        <p className="text-base font-semibold text-black dark:text-white md:text-lg">
          {isDragging && step === 'idle'
            ? '놓으면 바로 시작합니다'
            : getStepLabel(step)}
        </p>
        <p className="mt-1.5 text-sm text-black/50 dark:text-white/50">
          {showProgress ? '잠시만 기다려 주세요' : '또는 클릭해서 파일 선택'}
        </p>

        {fileName && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 max-w-full truncate rounded-md border border-black/20 px-3.5 py-1.5 text-sm text-black dark:border-white/20 dark:text-white"
          >
            {fileName}
          </motion.p>
        )}

        {showProgress && (
          <>
            <StageSteps step={step} />
            <ProcessProgressBar progress={overallProgress} />
          </>
        )}
      </motion.button>

      <UsageProgress />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-black dark:text-white md:text-lg">최근 메모</h2>
          <span className="text-sm text-black/45 dark:text-white/45">{memos.length}개</span>
        </div>
        {recentMemos.length === 0 ? (
          <p className="py-5 text-base text-black/50 dark:text-white/50">
            아직 메모가 없어요. 위에서 녹음 파일을 올려 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {recentMemos.map((memo) => (
              <li key={memo.id}>
                <Link
                  to={`/memo/${memo.id}`}
                  className="group flex items-center justify-between py-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="truncate text-base font-medium text-black dark:text-white">
                      {memo.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-black/50 dark:text-white/50">
                      {memo.preview}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="text-xs text-black/40 dark:text-white/40">
                      {memo.updatedAt}
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-black/30 transition-transform group-hover:translate-x-0.5 dark:text-white/30"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.div>
  )
}

export default HomePage
