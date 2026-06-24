import { ChevronDown, Download, FileText, Subtitles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Memo } from '../../stores/memoStore'
import {
  exportMemoSubtitle,
  exportMemoText,
  type SubtitleFormat,
  type TextExportFormat,
} from '../../utils/memoExport'

interface MemoExportButtonProps {
  memo: Memo
  disabled?: boolean
}

const MemoExportButton = ({ memo, disabled = false }: MemoExportButtonProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const runExport = (action: () => void) => {
    try {
      action()
      setOpen(false)
      toast.success('파일을 보냈습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '파일 보내기에 실패했습니다.')
    }
  }

  const handleSubtitleExport = (format: SubtitleFormat) => {
    runExport(() => exportMemoSubtitle(memo, format))
  }

  const handleTextExport = (format: TextExportFormat) => {
    runExport(() => exportMemoText(memo, format))
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-black/20 px-3 py-2 text-sm text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-black"
      >
        <Download size={14} />
        보내기
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-black/15 bg-white shadow-lg dark:border-white/15 dark:bg-zinc-900"
        >
          <div className="border-b border-black/10 px-3 py-2 dark:border-white/10">
            <p className="text-[11px] font-medium text-black/50 dark:text-white/50">자막 파일</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSubtitleExport('srt')}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          >
            <Subtitles size={15} className="shrink-0 text-black/50 dark:text-white/50" />
            <span>
              SRT (.srt)
              <span className="mt-0.5 block text-[11px] text-black/45 dark:text-white/45">
                일반 자막 형식
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSubtitleExport('vtt')}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          >
            <Subtitles size={15} className="shrink-0 text-black/50 dark:text-white/50" />
            <span>
              VTT (.vtt)
              <span className="mt-0.5 block text-[11px] text-black/45 dark:text-white/45">
                웹·플레이어 자막
              </span>
            </span>
          </button>

          <div className="border-t border-black/10 px-3 py-2 dark:border-white/10">
            <p className="text-[11px] font-medium text-black/50 dark:text-white/50">텍스트 파일</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleTextExport('paragraphs')}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          >
            <FileText size={15} className="shrink-0 text-black/50 dark:text-white/50" />
            <span>
              문단 텍스트 (.txt)
              <span className="mt-0.5 block text-[11px] text-black/45 dark:text-white/45">
                구간별 줄바꿈
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleTextExport('plain')}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          >
            <FileText size={15} className="shrink-0 text-black/50 dark:text-white/50" />
            <span>
              한 줄 텍스트 (.txt)
              <span className="mt-0.5 block text-[11px] text-black/45 dark:text-white/45">
                공백으로 이어 붙임
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

export default MemoExportButton
