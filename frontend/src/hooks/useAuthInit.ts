import { useEffect } from 'react'
import { fetchMe } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

export function useAuthInit() {
  useEffect(() => {
    const { token, login, logout } = useAuthStore.getState()
    if (!token) return

    fetchMe()
      .then(({ user }) => login(user, token))
      .catch(() => logout())
  }, [])
}
