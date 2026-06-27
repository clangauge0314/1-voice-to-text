import { useEffect } from 'react'
import { fetchAdminMe } from '../lib/adminApi'
import { useAdminAuthStore } from '../stores/adminAuthStore'

export function useAdminAuthInit() {
  useEffect(() => {
    const { token, login, logout } = useAdminAuthStore.getState()
    if (!token) return

    fetchAdminMe()
      .then(({ admin }) => login(admin, token))
      .catch(() => logout())
  }, [])
}
