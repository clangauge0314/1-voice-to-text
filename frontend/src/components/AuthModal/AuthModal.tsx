import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { login as loginApi, register as registerApi } from '../../lib/api'
import { useAuthModalStore } from '../../stores/authModalStore'
import { useAuthStore } from '../../stores/authStore'

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
}

const formVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 28 : -28,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -28 : 28,
  }),
}

const AuthModal = () => {
  const mode = useAuthModalStore((state) => state.mode)
  const close = useAuthModalStore((state) => state.close)
  const setMode = useAuthModalStore((state) => state.setMode)
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)

  const isOpen = mode !== null
  const isLogin = mode === 'login'

  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setPassword('')
      setName('')
      setConfirmPassword('')
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  const switchToSignup = () => {
    setDirection(1)
    setError('')
    setMode('signup')
  }

  const switchToLogin = () => {
    setDirection(-1)
    setError('')
    setMode('login')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    if (!isLogin && !name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (!isLogin && password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        const data = await loginApi(email.trim(), password)
        login(data.user, data.token)
        toast.success('로그인되었습니다.')
        close()
        return
      }

      await registerApi(name.trim(), email.trim(), password)

      setName('')
      setPassword('')
      setConfirmPassword('')
      setDirection(-1)
      setMode('login')

      toast.success('회원가입이 완료되었습니다.', {
        description: '로그인 후 서비스를 이용해주세요.',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && mode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="모달 닫기"
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={close}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-sm overflow-hidden rounded-md border border-black/20 bg-white p-6 dark:border-white/20 dark:bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label="닫기"
              className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-md text-black transition-colors hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black"
            >
              <X size={16} />
            </button>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={mode}
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                <h2
                  id="auth-modal-title"
                  className="mb-1 text-lg font-bold text-black dark:text-white"
                >
                  {isLogin ? '로그인' : '회원가입'}
                </h2>
                <p className="mb-6 text-sm text-black/50 dark:text-white/50">
                  {isLogin
                    ? 'Voice to Text 계정으로 로그인하세요.'
                    : '새 계정을 만들어 시작하세요.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <label
                        htmlFor="auth-name"
                        className="mb-1.5 block text-xs font-medium text-black dark:text-white"
                      >
                        이름
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="이름"
                        className="w-full rounded-md border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="auth-email"
                      className="mb-1.5 block text-xs font-medium text-black dark:text-white"
                    >
                      이메일
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-md border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="auth-password"
                      className="mb-1.5 block text-xs font-medium text-black dark:text-white"
                    >
                      비밀번호
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      className="w-full rounded-md border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                    />
                  </div>

                  {!isLogin && (
                    <div>
                      <label
                        htmlFor="auth-confirm-password"
                        className="mb-1.5 block text-xs font-medium text-black dark:text-white"
                      >
                        비밀번호 확인
                      </label>
                      <input
                        id="auth-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full rounded-md border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                      />
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-black dark:text-white" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md border border-black bg-black py-2.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
                  >
                    {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-black/50 dark:text-white/50">
                  {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
                  <button
                    type="button"
                    onClick={isLogin ? switchToSignup : switchToLogin}
                    className="font-medium text-black underline underline-offset-2 dark:text-white"
                  >
                    {isLogin ? '회원가입' : '로그인'}
                  </button>
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal
