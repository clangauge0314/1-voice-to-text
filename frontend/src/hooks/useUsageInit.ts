import { useEffect } from 'react'
import { fetchUsage } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { useUsageStore } from '../stores/usageStore'

export function useUsageInit() {
  const token = useAuthStore((state) => state.token)
  const setUsage = useUsageStore((state) => state.setUsage)
  const resetToGuest = useUsageStore((state) => state.resetToGuest)

  useEffect(() => {
    if (!token) {
      resetToGuest()
      return
    }

    fetchUsage()
      .then(setUsage)
      .catch(() => resetToGuest())
  }, [token, setUsage, resetToGuest])
}
