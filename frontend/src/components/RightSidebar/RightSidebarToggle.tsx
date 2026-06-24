import { motion } from 'framer-motion'
import { PanelRightOpen } from 'lucide-react'
import { useRightSidebarStore } from '../../stores/rightSidebarStore'

const RightSidebarToggle = () => {
  const { isOpen, open } = useRightSidebarStore()

  if (isOpen) return null

  return (
    <motion.button
      type="button"
      onClick={open}
      aria-label="오른쪽 사이드바 열기"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed right-0 top-1/2 z-40 flex h-10 w-8 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-black/20 bg-white text-black transition-colors hover:border-black hover:bg-black hover:text-white dark:border-white/20 dark:bg-black dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
    >
      <PanelRightOpen size={16} strokeWidth={2} />
    </motion.button>
  )
}

export default RightSidebarToggle
