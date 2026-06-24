interface AiNoteSuggestionBannerProps {
  preview: string
  onApply: () => void
  onDismiss: () => void
}

const AiNoteSuggestionBanner = ({
  preview,
  onApply,
  onDismiss,
}: AiNoteSuggestionBannerProps) => {
  const lines = preview.trim().split('\n')
  const shortPreview =
    lines.length > 2 ? `${lines.slice(0, 2).join('\n')}…` : preview.trim()

  return (
    <div className="rounded-md border border-violet-500/25 bg-violet-500/5 px-2.5 py-2 dark:border-violet-400/25 dark:bg-violet-400/5">
      <p className="text-[11px] font-medium text-violet-800 dark:text-violet-200">
        AI가 메모를 제안했습니다
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-black/60 [overflow-wrap:anywhere] dark:text-white/60">
        {shortPreview}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          className="rounded border border-violet-600/30 bg-violet-600 px-2 py-0.5 text-[10px] font-medium text-white transition-colors hover:bg-violet-700 dark:border-violet-400/40 dark:bg-violet-500 dark:hover:bg-violet-400"
        >
          적용
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded border border-black/15 px-2 py-0.5 text-[10px] font-medium text-black/60 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10"
        >
          유지
        </button>
      </div>
    </div>
  )
}

export default AiNoteSuggestionBanner
