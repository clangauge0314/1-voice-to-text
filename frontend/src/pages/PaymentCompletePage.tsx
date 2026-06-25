import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { completePayment } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { useUsageStore } from '../stores/usageStore'

const PaymentCompletePage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const setUsage = useUsageStore((state) => state.setUsage)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('결제를 확인하는 중입니다...')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setStatus('error')
      setMessage('로그인이 필요합니다.')
      return
    }

    const code = searchParams.get('code')
    const errorMessage = searchParams.get('message')
    const paymentId = searchParams.get('paymentId')

    if (code) {
      setStatus('error')
      setMessage(errorMessage ?? '결제가 취소되었거나 실패했습니다.')
      return
    }

    if (!paymentId) {
      setStatus('error')
      setMessage('결제 정보를 찾을 수 없습니다.')
      return
    }

    let cancelled = false

    completePayment(paymentId)
      .then((result) => {
        if (cancelled) return
        setUsage(result.usage)
        setStatus('success')
        setMessage(result.message ?? '크레딧 충전이 완료되었습니다.')
        toast.success('충전이 완료되었습니다.')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setMessage(err instanceof Error ? err.message : '결제 확인에 실패했습니다.')
      })

    return () => {
      cancelled = true
    }
  }, [retryCount, searchParams, setUsage, user])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      {status === 'loading' && (
        <>
          <Loader2 size={28} className="mb-4 animate-spin text-black/50 dark:text-white/50" />
          <p className="text-sm text-black/60 dark:text-white/60">{message}</p>
          <p className="mt-2 text-xs text-black/40 dark:text-white/40">
            PG 승인 반영까지 최대 10초 정도 걸릴 수 있습니다.
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <p className="text-lg font-semibold text-black dark:text-white">충전 완료</p>
          <p className="mt-2 max-w-md text-sm text-black/60 dark:text-white/60">{message}</p>
          <Link
            to="/membership"
            className="mt-6 rounded-lg border border-black bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
          >
            충전 페이지로 돌아가기
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">결제 실패</p>
          <p className="mt-2 max-w-md text-sm text-black/60 dark:text-white/60">{message}</p>
          <p className="mt-2 max-w-md text-xs text-black/45 dark:text-white/45">
            카드 승인 문자가 왔다면 잠시 후 다시 시도하거나 고객센터에 문의해 주세요.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStatus('loading')
                setMessage('결제를 다시 확인하는 중입니다...')
                setRetryCount((prev) => prev + 1)
              }}
              className="rounded-lg border border-black bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
            >
              충전 확인 다시 시도
            </button>
            <button
              type="button"
              onClick={() => navigate('/membership')}
              className="rounded-lg border border-black/20 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              충전 페이지로 돌아가기
            </button>
            {!user && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-lg border border-black bg-black px-4 py-2 text-sm font-medium text-white dark:border-white dark:bg-white dark:text-black"
              >
                홈으로
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default PaymentCompletePage
