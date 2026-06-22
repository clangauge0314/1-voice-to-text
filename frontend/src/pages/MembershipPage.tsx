import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '₩0',
    period: '/월',
    description: '기본 음성 변환 기능을 무료로 이용하세요.',
    features: ['월 60분 음성 변환', '기본 메모 저장', '표준 인식 속도'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₩9,900',
    period: '/월',
    description: '더 긴 녹음과 고급 기능이 필요한 사용자를 위한 플랜입니다.',
    features: [
      '월 600분 음성 변환',
      '전문 용어 인식',
      '메모 무제한 저장',
      '우선 처리 속도',
    ],
    highlighted: true,
  },
  {
    name: 'Team',
    price: '₩29,900',
    period: '/월',
    description: '팀 협업과 공유가 필요한 조직을 위한 플랜입니다.',
    features: [
      'Pro 기능 전체 포함',
      '팀 메모 공유',
      '멤버 5명까지',
      '관리자 대시보드',
    ],
    highlighted: false,
  },
]

const MembershipPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full px-10 py-12 text-left md:px-16 md:py-14 lg:px-20 lg:py-16"
    >
      <h1 className="mb-2 text-2xl font-bold text-black dark:text-white">멤버십</h1>
      <p className="mb-8 max-w-2xl text-sm text-black/50 dark:text-white/50">
        사용량과 필요에 맞는 플랜을 선택하세요. 언제든지 변경하거나 해지할 수 있습니다.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-md border p-5 ${
              plan.highlighted
                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                : 'border-black/20 bg-white dark:border-white/20 dark:bg-black'
            }`}
          >
            <p className="text-sm font-medium">{plan.name}</p>
            <p className="mt-3 text-2xl font-bold">
              {plan.price}
              <span
                className={`text-sm font-normal ${
                  plan.highlighted
                    ? 'text-white/70 dark:text-black/70'
                    : 'text-black/50 dark:text-white/50'
                }`}
              >
                {plan.period}
              </span>
            </p>
            <p
              className={`mt-3 text-xs leading-relaxed ${
                plan.highlighted
                  ? 'text-white/70 dark:text-black/70'
                  : 'text-black/50 dark:text-white/50'
              }`}
            >
              {plan.description}
            </p>

            <ul className="mt-5 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check size={14} className="mt-0.5 shrink-0" strokeWidth={2} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`mt-6 w-full rounded-md border py-2.5 text-sm font-medium transition-colors ${
                plan.highlighted
                  ? 'border-white bg-white text-black hover:bg-black hover:text-white dark:border-black dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black'
                  : 'border-black bg-black text-white hover:bg-white hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white'
              }`}
            >
              {plan.name === 'Free' ? '현재 플랜' : '업그레이드'}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default MembershipPage
