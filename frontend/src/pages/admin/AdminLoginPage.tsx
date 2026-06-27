import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminLogin } from '../../lib/adminApi'
import { useAdminAuthStore } from '../../stores/adminAuthStore'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const login = useAdminAuthStore((state) => state.login)
  const token = useAdminAuthStore((state) => state.token)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      navigate('/admin', { replace: true })
    }
  }, [token, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const data = await adminLogin(email.trim(), password)
      login(data.admin, data.token)
      toast.success('관리자 로그인되었습니다.')
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-1 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">관리자 로그인</h1>
        <p className="mt-2 text-xs sm:text-sm text-black/60 dark:text-white/60">
          허용된 IP에서만 접근할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium">
            이메일
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            className="w-full rounded-lg border border-black/20 bg-white px-4 py-3 text-base sm:text-sm outline-none transition-colors focus:border-black dark:border-white/20 dark:bg-black dark:focus:border-white"
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium">
            비밀번호
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="w-full rounded-lg border border-black/20 bg-white px-4 py-3 text-base sm:text-sm outline-none transition-colors focus:border-black dark:border-white/20 dark:bg-black dark:focus:border-white"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  )
}

export default AdminLoginPage
