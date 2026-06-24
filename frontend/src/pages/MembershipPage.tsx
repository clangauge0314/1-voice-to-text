import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import MembershipPromo from '../components/Membership/MembershipPromo'

const plans = [
  {
    name: 'Free',
    tagline: '먼저 써 보기',
    price: '₩0',
    period: '/월',
    description: '가입만 하면 바로 시작. 매월 무료 할당이 채워집니다.',
    quota: '음성 60분 · AI 메모 10회',
    features: ['기본 음성 → 텍스트 변환', '단어별 메모 저장', '표준 처리 속도'],
    highlighted: false,
  },
  {
    name: 'Basic',
    tagline: '가장 많이 선택',
    price: '₩4,900',
    period: '/월',
    description: '매일 조금씩 들으며 공부하는 분께 딱 맞는 플랜입니다.',
    quota: '음성 240분 · AI 메모 30회',
    features: ['하루 약 8분, 한 달 꾸준히', '전문 용어 인식', '메모 무제한 저장'],
    highlighted: true,
  },
  {
    name: 'Pro',
    tagline: '긴 녹음·집중 학습',
    price: '₩9,900',
    period: '/월',
    description: '긴 회의·강의·인터뷰를 자주 다루는 분을 위한 플랜입니다.',
    quota: '음성 600분 · AI 메모 50회',
    features: ['하루 약 20분 분량', '우선 처리 속도', '고급 맥락 AI 메모'],
    highlighted: false,
  },
]

const MembershipPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full px-10 py-12 text-left text-[1.0625rem] leading-relaxed md:px-16 md:py-14 lg:px-20 lg:py-16"
    >
      <section className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white md:text-4xl">
          나에게 맞는 플랜
        </h1>
        <p className="mt-3 text-base text-black/60 dark:text-white/60 md:text-lg">
          음성 변환 시간과 AI 학습 메모는 <strong className="font-semibold text-black/80 dark:text-white/80">매월 1일 초기화</strong>됩니다.
          쓰지 않은 분은 다음 달로 넘어가지 않아요.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-xl border p-6 ${
              plan.highlighted
                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                : 'border-black/20 bg-white dark:border-white/20 dark:bg-black'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-semibold">{plan.name}</p>
              {plan.tagline && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    plan.highlighted
                      ? 'bg-white/15 text-white dark:bg-black/10 dark:text-black/70'
                      : 'bg-black/5 text-black/55 dark:bg-white/10 dark:text-white/55'
                  }`}
                >
                  {plan.tagline}
                </span>
              )}
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight">
              {plan.price}
              <span
                className={`text-base font-normal ${
                  plan.highlighted
                    ? 'text-white/70 dark:text-black/70'
                    : 'text-black/50 dark:text-white/50'
                }`}
              >
                {plan.period}
              </span>
            </p>

            <p
              className={`mt-3 text-sm leading-relaxed ${
                plan.highlighted
                  ? 'text-white/75 dark:text-black/75'
                  : 'text-black/55 dark:text-white/55'
              }`}
            >
              {plan.description}
            </p>

            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
                plan.highlighted
                  ? 'bg-white/10 text-white dark:bg-black/5 dark:text-black'
                  : 'bg-black/[0.04] text-black/80 dark:bg-white/[0.06] dark:text-white/80'
              }`}
            >
              {plan.quota}
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm md:text-base">
                  <Check size={17} className="mt-0.5 shrink-0" strokeWidth={2} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`mt-7 w-full rounded-lg border py-3 text-base font-medium transition-colors ${
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

      <MembershipPromo />
    </motion.div>
  )
}

export default MembershipPage
