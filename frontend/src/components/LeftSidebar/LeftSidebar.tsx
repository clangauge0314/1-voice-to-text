import { motion } from 'framer-motion'
import { FileText, Crown, Home, LogIn, LogOut, PanelLeftClose, User, X } from 'lucide-react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthModalStore } from '../../stores/authModalStore'
import { useAuthStore } from '../../stores/authStore'
import { useMemoStore, type Memo } from '../../stores/memoStore'
import { SIDEBAR_WIDTH, useSidebarStore } from '../../stores/sidebarStore'
import { formatMinutes, type PlanType, useUsageStore } from '../../stores/usageStore'

const planBadgeStyles: Record<PlanType, string> = {
  free: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-white',
  pro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  team: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
}

const navItems = [
  { to: '/', label: '홈', icon: Home, end: true },
  { to: '/membership', label: '멤버십', icon: Crown, end: false },
]

const SidebarFooter = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const openLogin = useAuthModalStore((state) => state.openLogin)
  const plan = useUsageStore((state) => state.plan)
  const planLabel = useUsageStore((state) => state.planLabel)
  const usedMinutes = useUsageStore((state) => state.usedMinutes)
  const remainingMinutes = useUsageStore((state) => state.remainingMinutes)

  if (user) {
    const handleLogout = () => {
      logout()
      toast.success('로그아웃되었습니다.')
    }

    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-lg bg-black/[0.03] px-2 py-2 dark:bg-white/[0.06]">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/20 bg-white dark:border-white/20 dark:bg-black">
            <User size={12} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold leading-tight text-black dark:text-white">
              {user.name}
            </p>
            <p className="mt-0.5 truncate text-[10px] leading-tight text-black/75 dark:text-white/80">
              {user.email}
            </p>
            <p className="mt-1 text-[10px] font-medium leading-tight text-black/70 dark:text-white/75">
              {formatMinutes(usedMinutes)} 사용 · {formatMinutes(remainingMinutes)} 남음
            </p>
          </div>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${planBadgeStyles[plan]}`}
          >
            {planLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-black/20 px-3 py-2 text-sm text-black/70 transition-colors hover:border-black hover:bg-black hover:text-white dark:border-white/20 dark:text-white/70 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
        >
          <LogOut size={14} strokeWidth={2} />
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={openLogin}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-black/20 px-3 py-2 text-sm font-medium text-black transition-all duration-200 hover:border-black hover:bg-black hover:text-white dark:border-white/20 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
    >
      <LogIn size={15} strokeWidth={2} />
      로그인
    </button>
  )
}

const sidebarContent = (
  close: () => void,
  memos: Memo[],
  activeMemoId: string | undefined,
  handleMemoSelect: (memoId: string) => void,
) => (
  <>
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-black/20 px-4 dark:border-white/20">
      <div className="flex items-center gap-2 text-sm font-medium text-black dark:text-white">
        <PanelLeftClose size={16} />
        <span>메뉴</span>
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="사이드바 닫기"
        className="flex h-7 w-7 items-center justify-center rounded-md text-black transition-colors hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black"
      >
        <X size={16} />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-3 py-4">
      <section>
        <p className="mb-2 px-2 text-xs font-medium text-black/50 dark:text-white/50">페이지</p>
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
                  }`
                }
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <p className="mb-2 px-2 text-xs font-medium text-black/50 dark:text-white/50">메모</p>
        <ul className="space-y-1">
          {memos.length === 0 ? (
            <li className="px-2.5 py-3 text-xs text-black/50 dark:text-white/50">
              아직 메모가 없습니다.
            </li>
          ) : (
            memos.map((memo) => {
              const isActive = activeMemoId === memo.id

              return (
                <li key={memo.id}>
                  <button
                    type="button"
                    onClick={() => handleMemoSelect(memo.id)}
                    className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                      isActive
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <FileText size={15} className="mt-0.5 shrink-0" strokeWidth={2} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{memo.title}</p>
                        <p
                          className={`mt-0.5 truncate text-xs ${
                            isActive
                              ? 'text-white/70 dark:text-black/70'
                              : 'text-black/50 dark:text-white/50'
                          }`}
                        >
                          {memo.preview}
                        </p>
                        <p
                          className={`mt-1 text-[10px] ${
                            isActive
                              ? 'text-white/50 dark:text-black/50'
                              : 'text-black/40 dark:text-white/40'
                          }`}
                        >
                          {memo.updatedAt}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </section>
    </div>

    <div className="shrink-0 border-t border-black/20 px-3 py-3 dark:border-white/20">
      <SidebarFooter />
    </div>
  </>
)

const LeftSidebar = () => {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const close = useSidebarStore((state) => state.close)
  const memos = useMemoStore((state) => state.memos)
  const selectMemo = useMemoStore((state) => state.selectMemo)
  const navigate = useNavigate()
  const { id: activeMemoId } = useParams()

  const handleMemoSelect = (memoId: string) => {
    selectMemo(memoId)
    navigate(`/memo/${memoId}`)
  }

  const content = sidebarContent(close, memos, activeMemoId, handleMemoSelect)

  return (
    <>
      <motion.div
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/20 dark:bg-white/10 md:hidden"
        onClick={close}
        aria-hidden={!isOpen}
      />

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? SIDEBAR_WIDTH : 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="hidden h-screen shrink-0 overflow-hidden border-r border-black/20 bg-white dark:border-white/20 dark:bg-black md:flex md:flex-col"
        aria-hidden={!isOpen}
      >
        <div className="flex h-full w-72 flex-col">{content}</div>
      </motion.aside>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-black/20 bg-white dark:border-white/20 dark:bg-black md:hidden"
        aria-hidden={!isOpen}
      >
        {content}
      </motion.aside>
    </>
  )
}

export default LeftSidebar
