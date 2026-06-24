import type { ReactNode } from 'react'
import RightSidebar from './RightSidebar'
import RightSidebarToggle from './RightSidebarToggle'

interface MemoPageShellProps {
  children: ReactNode
}

const MemoPageShell = ({ children }: MemoPageShellProps) => (
  <div className="flex h-full min-h-0 overflow-hidden">
    <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    <RightSidebar />
    <RightSidebarToggle />
  </div>
)

export default MemoPageShell
