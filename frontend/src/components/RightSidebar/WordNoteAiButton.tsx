import { Loader2, Sparkles } from 'lucide-react'

interface WordNoteAiButtonProps {
  isLoading?: boolean
  disabled?: boolean
  className?: string
  onClick: () => void
}

const WordNoteAiButton = ({
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
}: WordNoteAiButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || isLoading}
    title="AI가 문장 맥락을 읽고 메모 작성"
    aria-label="AI 메모 작성"
    className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border border-black/15 px-2 py-1 text-[11px] font-medium text-black/70 transition-colors hover:border-black/30 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-white/70 dark:hover:border-white/30 dark:hover:bg-white dark:hover:text-black ${className}`}
  >
    {isLoading ? (
      <Loader2 size={12} className="shrink-0 animate-spin" />
    ) : (
      <Sparkles size={12} className="shrink-0" />
    )}
    <span>{isLoading ? '작성 중' : 'AI 메모'}</span>
  </button>
)

export default WordNoteAiButton
