import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ContextMenuState } from './types'

interface WordContextMenuProps {
  menu: ContextMenuState
  canMerge: boolean
  canSplit: boolean
  canSeek: boolean
  hasSelection: boolean
  mergePreview: string | null
  splitPreview: string | null
  onMerge: () => void
  onSplit: () => void
  onSeek: () => void
  onClearSelection: () => void
  onClose: () => void
}

const WordContextMenu = ({
  menu,
  canMerge,
  canSplit,
  canSeek,
  hasSelection,
  mergePreview,
  splitPreview,
  onMerge,
  onSplit,
  onSeek,
  onClearSelection,
  onClose,
}: WordContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return
      onClose()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', onClose, true)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-9999 min-w-40 overflow-hidden rounded-md border border-black/15 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-neutral-950"
      style={{ top: menu.y, left: menu.x }}
      role="menu"
    >
      {canMerge && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onMerge()
            onClose()
          }}
          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          <span>합치기 (Ctrl+M)</span>
          {mergePreview && (
            <span className="text-xs text-black/50 dark:text-white/50">{mergePreview}</span>
          )}
        </button>
      )}
      {canSplit && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onSplit()
            onClose()
          }}
          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          <span>나누기 (Ctrl+Shift+M)</span>
          {splitPreview && (
            <span className="text-xs text-black/50 dark:text-white/50">{splitPreview}</span>
          )}
        </button>
      )}
      {canSeek && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onSeek()
            onClose()
          }}
          className="w-full px-3 py-2 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          이 위치로 이동
        </button>
      )}
      {hasSelection && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClearSelection()
            onClose()
          }}
          className="w-full px-3 py-2 text-left text-sm text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
        >
          선택 해제
        </button>
      )}
    </div>,
    document.body,
  )
}

export default WordContextMenu
