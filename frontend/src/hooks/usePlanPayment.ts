import * as PortOne from '@portone/browser-sdk/v2'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { completePayment, preparePayment } from '../lib/api'
import { useAuthModalStore } from '../stores/authModalStore'
import { useAuthStore } from '../stores/authStore'
import { useUsageStore } from '../stores/usageStore'

export type CreditPackId = 'nano' | 'starter' | 'plus' | 'standard' | 'pro' | 'power'

const BILLING_CUSTOMER_PHONE = '010-0000-0000'

export function usePlanPayment() {
  const user = useAuthStore((state) => state.user)
  const openLogin = useAuthModalStore((state) => state.openLogin)
  const setUsage = useUsageStore((state) => state.setUsage)
  const [isPaying, setIsPaying] = useState(false)

  const requestPlanPayment = useCallback(
    async (packId: CreditPackId) => {
      if (!user) {
        toast.error('로그인이 필요합니다.')
        openLogin()
        return
      }

      setIsPaying(true)
      try {
        const prepared = await preparePayment(packId)

        const paymentResponse = await PortOne.requestPayment({
          storeId: prepared.storeId,
          channelKey: prepared.channelKey,
          paymentId: prepared.paymentId,
          orderName: prepared.orderName,
          totalAmount: prepared.totalAmount,
          currency: prepared.currency,
          payMethod: prepared.payMethod,
          redirectUrl: prepared.redirectUrl,
          forceRedirect: true,
          customer: {
            customerId: user.id,
            fullName: user.name,
            email: user.email,
            phoneNumber: BILLING_CUSTOMER_PHONE,
          },
        })

        if (!paymentResponse) return

        if (paymentResponse.code) {
          throw new Error(paymentResponse.message ?? '결제가 취소되었거나 실패했습니다.')
        }

        const result = await completePayment(prepared.paymentId)
        setUsage(result.usage)
        toast.success(result.message ?? '크레딧 충전이 완료되었습니다.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '결제에 실패했습니다.')
      } finally {
        setIsPaying(false)
      }
    },
    [user, openLogin, setUsage],
  )

  return { requestPlanPayment, isPaying }
}
