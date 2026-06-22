import { motion } from 'framer-motion'
import { PanelLeftOpen } from 'lucide-react'
import { useSidebarStore } from '../../stores/sidebarStore'

const SidebarToggle = () => {
  const { isOpen, toggle } = useSidebarStore()

  if (isOpen) return null

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label="왼쪽 사이드바 열기"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed left-0 top-1/2 z-40 flex h-10 w-8 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-black/20 bg-white text-black transition-colors hover:border-black hover:bg-black hover:text-white dark:border-white/20 dark:bg-black dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
    >
      <PanelLeftOpen size={16} strokeWidth={2} />
    </motion.button>
  )
}

export default SidebarToggle
