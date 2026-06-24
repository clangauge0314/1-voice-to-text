import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Mic, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

const highlights = [
  {
    icon: Sparkles,
    title: 'AI가 문맥까지 읽어요',
    description: '단어 뜻만이 아니라, 문장·화자·대화 흐름을 보고 학습 메모를 써 줍니다.',
  },
  {
    icon: Mic,
    title: '듣고 바로 편집',
    description: '화자 분리, 타임스탬프, 구간 편집을 한 화면에서 이어서 할 수 있어요.',
  },
  {
    icon: BookOpen,
    title: '언어 공부에 맞춤',
    description: '회의록 저장이 아니라, 표현·뉘앙스·말한 의도를 복습하는 데 초점을 맞췄습니다.',
  },
  {
    icon: Target,
    title: '부담 없는 월 요금',
    description: 'Basic 월 ₩4,900부터. 남은 분은 이월되지 않아 필요한 만큼만 쓰면 됩니다.',
  },
]

const MembershipPromo = () => {
  return (
    <div className="mt-16 space-y-14 border-t border-black/10 pt-14 dark:border-white/10">
      <section>
        <p className="text-sm font-semibold text-black/45 dark:text-white/45">왜 우리 서비스인가요</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
          글자로만 바꿔 주는 앱이 아니에요
        </h2>
        <p className="mt-1 text-lg text-black/50 dark:text-white/50">
          듣고 → 이해하고 → 기억하는 흐름까지 이어집니다
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-black/60 dark:text-white/60">
          일반 음성 변환은 텍스트만 남깁니다. 우리는 음성 분석과 AI 메모를 한곳에 묶어, &quot;왜 이렇게 말했는지&quot;까지 복습할 수 있게 했어요.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="rounded-xl border border-black/15 p-5 dark:border-white/15"
            >
              <item.icon size={22} strokeWidth={1.75} className="text-black/70 dark:text-white/70" />
              <p className="mt-3 text-base font-semibold text-black dark:text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-black bg-black px-8 py-10 text-white dark:border-white dark:bg-white dark:text-black md:px-12 md:py-12">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-white/50 dark:text-black/50">시작하기</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              무료로 먼저 써 보고, 필요할 때 올리세요
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/75 dark:text-black/75">
              Free만으로도 월 60분 변환 + AI 메모 10회를 쓸 수 있어요.
              꾸준히 쓰게 되면 Basic(₩4,900)으로 하루 8분씩 한 달 내내 복습할 수 있습니다.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-lg border border-white bg-white px-6 py-3.5 text-base font-medium text-black transition-colors hover:bg-transparent hover:text-white dark:border-black dark:bg-black dark:text-white dark:hover:bg-transparent dark:hover:text-black"
          >
            녹음 파일 올리기
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default MembershipPromo
