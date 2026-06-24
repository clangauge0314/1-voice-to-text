import { Loader2 } from 'lucide-react'
import { useWordNoteAi } from '../../hooks/useWordNoteAi'
import { formatAiNotes, useUsageStore } from '../../stores/usageStore'
import WordNoteAiButton from './WordNoteAiButton'

interface WordNoteMemoFieldProps {
  memoId: string
  wordIndex: number
  word: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  rows?: number
  isSaving?: boolean
  className?: string
  textareaClassName?: string
}

const WordNoteMemoField = ({
  memoId,
  wordIndex,
  word,
  value,
  onChange,
  onBlur,
  rows = 2,
  isSaving = false,
  className = '',
  textareaClassName = '',
}: WordNoteMemoFieldProps) => {
  const { isGenerating, handleGenerate } = useWordNoteAi(memoId, wordIndex, word)
  const usedAiNotes = useUsageStore((state) => state.usedAiNotes)
  const totalAiNotes = useUsageStore((state) => state.totalAiNotes)
  const remainingAiNotes = useUsageStore((state) => state.remainingAiNotes)
  const aiLimitReached = remainingAiNotes <= 0

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          메모
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tabular-nums text-black/45 dark:text-white/45">
            AI {formatAiNotes(usedAiNotes)}/{formatAiNotes(totalAiNotes)}
          </span>
          <WordNoteAiButton
            isLoading={isGenerating}
            disabled={isSaving || aiLimitReached}
            onClick={() => void handleGenerate()}
          />
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="이 단어에 대한 메모를 입력하세요"
          rows={rows}
          className={`scrollbar-modern w-full resize-y rounded-md border border-black/15 bg-white px-2.5 py-2 text-sm leading-relaxed text-black outline-none transition-colors placeholder:text-black/35 focus:border-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/35 dark:focus:border-white/40 ${textareaClassName}`}
        />
        {(isSaving || isGenerating) && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-black/60 shadow-sm backdrop-blur-sm dark:bg-black/90 dark:text-white/60">
            <Loader2 size={10} className="animate-spin" />
            {isGenerating ? 'AI 작성 중' : '저장 중'}
          </span>
        )}
      </div>
    </div>
  )
}

export default WordNoteMemoField
