import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import MembershipPromo from '../components/Membership/MembershipPromo'
import { usePlanPayment, type CreditPackId } from '../hooks/usePlanPayment'
import { formatAiNotes, formatMinutes, useUsageStore } from '../stores/usageStore'

type CreditPackRow = {
  id: CreditPackId
  name: string
  tagline?: string
  price: number
  audioMinutes: number
  aiNotes: number
  description: string
  recommended?: boolean
}

const creditPacks: CreditPackRow[] = [
  {
    id: 'nano',
    name: 'Nano',
    tagline: '초소량',
    price: 2900,
    audioMinutes: 90,
    aiNotes: 15,
    description: '짧은 파일 테스트용',
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: '입문',
    price: 4900,
    audioMinutes: 180,
    aiNotes: 30,
    description: '가볍게 시작하기',
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: '주간 학습',
    price: 7900,
    audioMinutes: 300,
    aiNotes: 55,
    description: '일주일 꾸준히 쓰기',
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: '추천',
    price: 11900,
    audioMinutes: 480,
    aiNotes: 90,
    description: '가장 많이 선택하는 용량',
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: '집중 작업',
    price: 16900,
    audioMinutes: 760,
    aiNotes: 145,
    description: '회의·강의 병행 사용',
  },
  {
    id: 'power',
    name: 'Power',
    tagline: '대용량',
    price: 23900,
    audioMinutes: 1200,
    aiNotes: 250,
    description: '긴 녹음·대량 AI 메모',
  },
]

const formatPrice = (won: number) => `₩${won.toLocaleString('ko-KR')}`

const pricePerAudioMinute = (pack: CreditPackRow) =>
  pack.audioMinutes > 0 ? Math.round(pack.price / pack.audioMinutes) : 0

const pricePerAiNote = (pack: CreditPackRow) =>
  pack.aiNotes > 0 ? Math.round(pack.price / pack.aiNotes) : 0

const bestValuePackId = creditPacks.reduce((best, pack) => {
  const current = pricePerAudioMinute(pack)
  const bestRate = pricePerAudioMinute(best)
  return current < bestRate ? pack : best
}).id

const MembershipPage = () => {
  const remainingMinutes = useUsageStore((state) => state.remainingMinutes)
  const remainingAiNotes = useUsageStore((state) => state.remainingAiNotes)
  const { requestPlanPayment, isPaying } = usePlanPayment()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full px-10 py-12 text-left text-[1.0625rem] leading-relaxed md:px-16 md:py-14 lg:px-20 lg:py-16"
    >
      <section className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white md:text-4xl">
          크레딧 충전
        </h1>
        <p className="mt-3 text-base text-black/60 dark:text-white/60 md:text-lg">
          정기결제 없이 필요한 만큼만 충전합니다. 음성 시간과 AI 메모는 각각 별도로 차감됩니다.
        </p>
        <p className="mt-2 text-sm text-black/45 dark:text-white/45">
          현재 보유: 음성 {formatMinutes(remainingMinutes)} · AI 메모 {formatAiNotes(remainingAiNotes)}
        </p>
      </section>

      {/* 데스크톱 비교 테이블 */}
      <div className="mb-6 hidden overflow-hidden rounded-xl border border-black/15 dark:border-white/15 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/3 text-xs font-semibold uppercase tracking-wide text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
              <th className="px-5 py-3.5">상품</th>
              <th className="px-4 py-3.5">가격</th>
              <th className="px-4 py-3.5">음성</th>
              <th className="px-4 py-3.5">AI 메모</th>
              <th className="px-4 py-3.5">음성 단가</th>
              <th className="px-4 py-3.5">AI 단가</th>
              <th className="px-5 py-3.5 text-right" />
            </tr>
          </thead>
          <tbody>
            {creditPacks.map((pack) => {
              const isRecommended = pack.recommended
              const isBestValue = pack.id === bestValuePackId

              return (
                <tr
                  key={pack.id}
                  className={`border-b border-black/8 last:border-0 dark:border-white/8 ${
                    isRecommended
                      ? 'bg-black/4 dark:bg-white/6'
                      : 'hover:bg-black/2 dark:hover:bg-white/3'
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-black dark:text-white">{pack.name}</span>
                      {pack.tagline ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isRecommended
                              ? 'bg-black text-white dark:bg-white dark:text-black'
                              : 'bg-black/8 text-black/60 dark:bg-white/10 dark:text-white/60'
                          }`}
                        >
                          {pack.tagline}
                        </span>
                      ) : null}
                      {isBestValue ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                          음성 가성비
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-black/50 dark:text-white/50">{pack.description}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold tabular-nums text-black dark:text-white">
                    {formatPrice(pack.price)}
                  </td>
                  <td className="px-4 py-4 tabular-nums text-black/80 dark:text-white/80">
                    {formatMinutes(pack.audioMinutes)}
                  </td>
                  <td className="px-4 py-4 tabular-nums text-black/80 dark:text-white/80">
                    {formatAiNotes(pack.aiNotes)}
                  </td>
                  <td className="px-4 py-4 tabular-nums text-black/70 dark:text-white/70">
                    {formatPrice(pricePerAudioMinute(pack))}/분
                  </td>
                  <td className="px-4 py-4 tabular-nums text-black/70 dark:text-white/70">
                    {formatPrice(pricePerAiNote(pack))}/회
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={() => void requestPlanPayment(pack.id)}
                      className={`inline-flex min-w-22 items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                        isRecommended
                          ? 'border-black bg-black text-white hover:bg-white hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white'
                          : 'border-black/20 text-black hover:border-black hover:bg-black hover:text-white dark:border-white/20 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-black'
                      }`}
                    >
                      {isPaying ? <Loader2 size={14} className="animate-spin" /> : null}
                      충전
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 모바일 비교 목록 */}
      <ul className="space-y-3 md:hidden">
        {creditPacks.map((pack) => {
          const isRecommended = pack.recommended
          const isBestValue = pack.id === bestValuePackId

          return (
            <li
              key={pack.id}
              className={`rounded-xl border p-4 ${
                isRecommended
                  ? 'border-black bg-black/3 dark:border-white dark:bg-white/5'
                  : 'border-black/15 dark:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-black dark:text-white">{pack.name}</span>
                    {pack.tagline ? (
                      <span className="rounded-full bg-black/8 px-2 py-0.5 text-[10px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                        {pack.tagline}
                      </span>
                    ) : null}
                    {isBestValue ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                        음성 가성비
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-black/50 dark:text-white/50">{pack.description}</p>
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums text-black dark:text-white">
                  {formatPrice(pack.price)}
                </p>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-black/45 dark:text-white/45">음성</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-black/80 dark:text-white/80">
                    {formatMinutes(pack.audioMinutes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-black/45 dark:text-white/45">AI 메모</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-black/80 dark:text-white/80">
                    {formatAiNotes(pack.aiNotes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-black/45 dark:text-white/45">음성 단가</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-black/70 dark:text-white/70">
                    {formatPrice(pricePerAudioMinute(pack))}/분
                  </dd>
                </div>
                <div>
                  <dt className="text-black/45 dark:text-white/45">AI 단가</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-black/70 dark:text-white/70">
                    {formatPrice(pricePerAiNote(pack))}/회
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={isPaying}
                onClick={() => void requestPlanPayment(pack.id)}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                  isRecommended
                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-black/20 text-black dark:border-white/20 dark:text-white'
                }`}
              >
                {isPaying ? <Loader2 size={14} className="animate-spin" /> : null}
                충전하기
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-xs text-black/40 dark:text-white/40">
        음성 단가·AI 단가는 충전 금액을 각 크레딧으로 나눈 비교용 수치입니다. 크레딧은 유효기간 없이 누적됩니다.
      </p>

      <MembershipPromo />
    </motion.div>
  )
}

export default MembershipPage
