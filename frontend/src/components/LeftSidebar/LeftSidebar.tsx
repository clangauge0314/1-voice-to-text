import { motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Crown,
  FileText,
  Home,
  Loader2,
  LogIn,
  LogOut,
  PanelLeftClose,
  Pencil,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthModalStore } from '../../stores/authModalStore'
import { useAuthStore } from '../../stores/authStore'
import { useMemoStore, type Memo } from '../../stores/memoStore'
import { SIDEBAR_WIDTH, useSidebarStore } from '../../stores/sidebarStore'
import { formatAiNotes, formatMinutes, type PlanType, useUsageStore } from '../../stores/usageStore'

const planBadgeStyles: Record<PlanType, string> = {
  free: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-white',
  basic: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  pro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
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
  const usedAiNotes = useUsageStore((state) => state.usedAiNotes)
  const remainingAiNotes = useUsageStore((state) => state.remainingAiNotes)

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
              음성 {formatMinutes(usedMinutes)} 사용 · {formatMinutes(remainingMinutes)} 남음
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-black/55 dark:text-white/60">
              AI {formatAiNotes(usedAiNotes)} 사용 · {formatAiNotes(remainingAiNotes)} 남음
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

const MemoSidebarItem = ({
  memo,
  isActive,
  onSelect,
  onDeleted,
}: {
  memo: Memo
  isActive: boolean
  onSelect: () => void
  onDeleted: () => void
}) => {
  const renameMemo = useMemoStore((state) => state.renameMemo)
  const deleteMemo = useMemoStore((state) => state.deleteMemo)
  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const startEdit = (event: MouseEvent) => {
    event.stopPropagation()
    setTitleDraft(memo.title)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setTitleDraft('')
  }

  const saveTitle = async () => {
    const trimmed = titleDraft.trim()
    if (!trimmed) {
      toast.error('제목을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      await renameMemo(memo.id, trimmed)
      setIsEditing(false)
      toast.success('메모 이름이 변경되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '이름 변경에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (event: MouseEvent) => {
    event.stopPropagation()
    const confirmed = window.confirm(
      '메모, 전사 기록, Cloudinary 오디오 파일이 모두 삭제됩니다. 계속할까요?',
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteMemo(memo.id)
      toast.success('메모가 삭제되었습니다.')
      onDeleted()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '메모 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const actionButtonClass = isActive
    ? 'text-white/70 hover:bg-white/20 hover:text-white dark:text-black/70 dark:hover:bg-black/10 dark:hover:text-black'
    : 'text-black/40 hover:bg-black/10 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white'

  return (
    <li>
      <div
        className={`flex items-start gap-1 rounded-lg px-2 py-2 transition-colors ${
          isActive
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
        }`}
      >
        <FileText size={15} className="mt-0.5 shrink-0" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void saveTitle()
                  if (event.key === 'Escape') cancelEdit()
                }}
                className={`w-full rounded border px-1.5 py-0.5 text-sm font-medium outline-none ${
                  isActive
                    ? 'border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-white dark:border-black/30 dark:bg-black/5 dark:text-black dark:placeholder:text-black/50 dark:focus:border-black'
                    : 'border-black/20 bg-white text-black focus:border-black dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white'
                }`}
                autoFocus
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => void saveTitle()}
                disabled={isSaving}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${actionButtonClass} disabled:opacity-50`}
                aria-label="이름 저장"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isSaving}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${actionButtonClass} disabled:opacity-50`}
                aria-label="이름 변경 취소"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={onSelect} className="w-full text-left">
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
            </button>
          )}
        </div>

        {!isEditing && (
          <div className="flex shrink-0 gap-0.5">
            <button
              type="button"
              onClick={startEdit}
              className={`flex h-6 w-6 items-center justify-center rounded ${actionButtonClass}`}
              aria-label="메모 이름 변경"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={(event) => void handleDelete(event)}
              disabled={isDeleting}
              className={`flex h-6 w-6 items-center justify-center rounded text-red-500/70 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:text-red-400/70 dark:hover:bg-red-500/20 dark:hover:text-red-400 ${
                isActive ? 'hover:bg-red-500/20' : ''
              }`}
              aria-label="메모 삭제"
            >
              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

const MEMO_ITEM_FALLBACK_HEIGHT = 64
const MEMO_ITEM_GAP = 4

function pickRecentMemos(memos: Memo[], limit: number, activeMemoId?: string) {
  if (memos.length <= limit) return memos

  const recent = memos.slice(0, limit)
  if (!activeMemoId || recent.some((memo) => memo.id === activeMemoId)) {
    return recent
  }

  const active = memos.find((memo) => memo.id === activeMemoId)
  if (!active) return recent

  return [...recent.slice(0, limit - 1), active]
}

const MemoList = ({
  memos,
  activeMemoId,
  onSelect,
  isExpanded,
  onExpandedChange,
}: {
  memos: Memo[]
  activeMemoId: string | undefined
  onSelect: (memoId: string) => void
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
}) => {
  const navigate = useNavigate()
  const viewportRef = useRef<HTMLDivElement>(null)
  const [maxVisible, setMaxVisible] = useState(5)

  const needsCollapse = memos.length > maxVisible
  const displayMemos =
    needsCollapse && !isExpanded ? pickRecentMemos(memos, maxVisible, activeMemoId) : memos

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const measure = () => {
      const height = viewport.clientHeight
      if (height <= 0) return

      const firstItem = viewport.querySelector('li')
      const itemHeight = firstItem
        ? firstItem.getBoundingClientRect().height + MEMO_ITEM_GAP
        : MEMO_ITEM_FALLBACK_HEIGHT

      setMaxVisible(Math.max(1, Math.floor(height / itemHeight)))
    }

    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    measure()

    return () => observer.disconnect()
  }, [memos.length, isExpanded])

  useEffect(() => {
    if (!needsCollapse) {
      onExpandedChange(false)
    }
  }, [needsCollapse, onExpandedChange])

  const handleDeleted = (memoId: string) => {
    if (activeMemoId === memoId) {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={viewportRef} className="min-h-0 flex-1 overflow-hidden">
        <ul className={`space-y-1 ${isExpanded ? 'h-full overflow-y-auto pr-0.5' : ''}`}>
          {memos.length === 0 ? (
            <li className="px-2.5 py-3 text-xs text-black/50 dark:text-white/50">
              아직 메모가 없습니다.
            </li>
          ) : (
            displayMemos.map((memo) => (
              <MemoSidebarItem
                key={memo.id}
                memo={memo}
                isActive={activeMemoId === memo.id}
                onSelect={() => onSelect(memo.id)}
                onDeleted={() => handleDeleted(memo.id)}
              />
            ))
          )}
        </ul>
      </div>

      {needsCollapse && (
        <button
          type="button"
          onClick={() => onExpandedChange(!isExpanded)}
          className="mt-2 flex w-full shrink-0 items-center justify-center gap-1 rounded-lg border border-black/10 px-2 py-1.5 text-[11px] font-medium text-black/60 transition-colors hover:border-black/20 hover:bg-black/5 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
          {isExpanded ? '접기' : `전체 ${memos.length}개 보기`}
        </button>
      )}
    </div>
  )
}

const SidebarContent = ({
  close,
  memos,
  activeMemoId,
  handleMemoSelect,
}: {
  close: () => void
  memos: Memo[]
  activeMemoId: string | undefined
  handleMemoSelect: (memoId: string) => void
}) => {
  const [memoListExpanded, setMemoListExpanded] = useState(false)

  return (
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

    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-4">
      <section className="shrink-0">
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

      <section className="mt-6 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between px-2">
          <p className="text-xs font-medium text-black/50 dark:text-white/50">메모</p>
          <div className="flex items-center gap-1.5">
            {memos.length > 0 && (
              <span className="text-[10px] tabular-nums text-black/40 dark:text-white/40">
                {memos.length}개
              </span>
            )}
          </div>
        </div>
        <MemoList
          memos={memos}
          activeMemoId={activeMemoId}
          onSelect={handleMemoSelect}
          isExpanded={memoListExpanded}
          onExpandedChange={setMemoListExpanded}
        />
      </section>
    </div>

    <div className="shrink-0 border-t border-black/20 px-3 py-3 dark:border-white/20">
      <SidebarFooter />
    </div>
  </>
  )
}

const LeftSidebar = () => {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const close = useSidebarStore((state) => state.close)
  const memos = useMemoStore((state) => state.memos)
  const selectMemo = useMemoStore((state) => state.selectMemo)
  const navigate = useNavigate()
  const location = useLocation()
  const { id: activeMemoId } = useParams()
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      close()
      prevPathRef.current = location.pathname
    }
  }, [location.pathname, close])

  const handleMemoSelect = (memoId: string) => {
    selectMemo(memoId)
    navigate(`/memo/${memoId}`)
  }

  const content = (
    <SidebarContent
      close={close}
      memos={memos}
      activeMemoId={activeMemoId}
      handleMemoSelect={handleMemoSelect}
    />
  )

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
