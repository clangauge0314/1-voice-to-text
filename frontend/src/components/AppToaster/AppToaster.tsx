import { AlertCircle, Check, Info, Loader2, XCircle } from 'lucide-react'
import { Toaster } from 'sonner'
import { useThemeStore } from '../../stores/themeStore'

const iconClass = 'text-black dark:text-white'

const AppToaster = () => {
  const theme = useThemeStore((state) => state.theme)

  return (
    <Toaster
      theme={theme}
      position="bottom-center"
      richColors={false}
      icons={{
        success: <Check size={16} strokeWidth={2} className={iconClass} />,
        error: <XCircle size={16} strokeWidth={2} className={iconClass} />,
        info: <Info size={16} strokeWidth={2} className={iconClass} />,
        warning: <AlertCircle size={16} strokeWidth={2} className={iconClass} />,
        loading: <Loader2 size={16} strokeWidth={2} className={`${iconClass} animate-spin`} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-md border border-black/20 bg-white px-4 py-3 text-black shadow-none dark:border-white/20 dark:bg-black dark:text-white',
          title: 'text-sm font-medium text-black dark:text-white',
          description: 'text-xs text-black/50 dark:text-white/50',
          content: 'flex flex-col gap-0.5',
          icon: 'shrink-0 text-black dark:text-white',
          closeButton:
            'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border border-black/20 bg-white text-black transition-colors hover:bg-black hover:text-white dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black',
        },
      }}
    />
  )
}

export default AppToaster
