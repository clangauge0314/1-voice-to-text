import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useMemoStore } from '../stores/memoStore'

export function useMemoInit() {
  const user = useAuthStore((state) => state.user)
  const loadMemos = useMemoStore((state) => state.loadMemos)
  const clearSelection = useMemoStore((state) => state.clearSelection)
  const setMemos = useMemoStore((state) => state.setMemos)

  useEffect(() => {
    if (!user) {
      setMemos([])
      clearSelection()
      return
    }

    void loadMemos()
  }, [user, loadMemos, clearSelection, setMemos])
}
