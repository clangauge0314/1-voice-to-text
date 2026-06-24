import { motion } from 'framer-motion'
import { GripVertical, PanelRightClose, StickyNote } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useRightSidebarStore } from '../../stores/rightSidebarStore'
import WordNotePanel from './WordNotePanel'

interface SidebarPanelProps {
  resizable: boolean
  onClose: () => void
  onResizeStart?: (event: ReactPointerEvent<HTMLButtonElement>) => void
}

const ResizeHandle = ({
  onResizeStart,
}: {
  onResizeStart: (event: ReactPointerEvent<HTMLButtonElement>) => void
}) => (
  <button
    type="button"
    aria-label="패널 너비 조절"
    title="드래그하여 너비 조절"
    onPointerDown={onResizeStart}
    className="absolute inset-y-0 left-0 z-10 hidden w-5 -translate-x-1/2 cursor-col-resize items-center justify-center border-0 bg-transparent p-0 md:flex"
  >
    <span className="flex h-10 w-4 items-center justify-center rounded-full border border-black/15 bg-white text-black/40 shadow-sm transition-colors hover:border-black/30 hover:text-black/70 dark:border-white/15 dark:bg-black dark:text-white/40 dark:hover:border-white/30 dark:hover:text-white/70">
      <GripVertical size={12} strokeWidth={2} aria-hidden />
    </span>
  </button>
)

const SidebarPanel = ({ resizable, onClose, onResizeStart }: SidebarPanelProps) => (
  <>
    {resizable && onResizeStart && <ResizeHandle onResizeStart={onResizeStart} />}

    <div className="flex h-10 shrink-0 items-center justify-between border-b border-black/20 px-4 dark:border-white/20">
      <div className="flex items-center gap-2 text-sm font-medium text-black dark:text-white">
        <StickyNote size={16} />
        <span>단어 메모</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="오른쪽 사이드바 닫기"
        className="flex h-7 w-7 items-center justify-center rounded-md text-black transition-colors hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black"
      >
        <PanelRightClose size={16} />
      </button>
    </div>

    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4">
      <WordNotePanel />
    </div>
  </>
)

function getMobilePanelWidth(storedWidth: number) {
  if (typeof window === 'undefined') return storedWidth
  return Math.min(storedWidth, window.innerWidth - 40)
}

const RightSidebar = () => {
  const isOpen = useRightSidebarStore((state) => state.isOpen)
  const width = useRightSidebarStore((state) => state.width)
  const close = useRightSidebarStore((state) => state.close)
  const setWidth = useRightSidebarStore((state) => state.setWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [mobileWidth, setMobileWidth] = useState(() => getMobilePanelWidth(width))

  useEffect(() => {
    const syncMobileWidth = () => setMobileWidth(getMobilePanelWidth(width))

    syncMobileWidth()
    window.addEventListener('resize', syncMobileWidth)
    return () => window.removeEventListener('resize', syncMobileWidth)
  }, [width])

  const handleResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      const handle = event.currentTarget
      handle.setPointerCapture(event.pointerId)
      setIsResizing(true)

      const startX = event.clientX
      const startWidth = width

      const onPointerMove = (moveEvent: PointerEvent) => {
        const delta = startX - moveEvent.clientX
        setWidth(startWidth + delta)
      }

      const onPointerUp = (upEvent: PointerEvent) => {
        setIsResizing(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        handle.releasePointerCapture(upEvent.pointerId)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    },
    [setWidth, width],
  )

  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [])

  const widthTransition = isResizing
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 28, stiffness: 320 }

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? width : 0 }}
        transition={widthTransition}
        className="relative hidden h-full shrink-0 overflow-hidden border-l border-black/20 bg-white dark:border-white/20 dark:bg-black md:block"
        aria-hidden={!isOpen}
      >
        <div className="relative flex h-full flex-col" style={{ width }}>
          <SidebarPanel resizable onClose={close} onResizeStart={handleResizeStart} />
        </div>
      </motion.aside>

      <motion.div
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/20 dark:bg-white/10 md:hidden"
        onClick={close}
        aria-hidden={!isOpen}
      />

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed inset-y-0 right-0 z-50 flex max-w-[calc(100vw-2.5rem)] flex-col border-l border-black/20 bg-white dark:border-white/20 dark:bg-black md:hidden"
        style={{ width: mobileWidth }}
        aria-hidden={!isOpen}
      >
        <SidebarPanel resizable={false} onClose={close} />
      </motion.aside>
    </>
  )
}

export default RightSidebar
