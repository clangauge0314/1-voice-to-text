# Ch 4-1 프롬프트 모음

> 각 Step을 **순서대로** 실행하세요. `@docs/spec.md` `@docs/4-1/layout-and-colors.md` 를 함께 첨부하면 좋습니다.

---

## Step 1 — 전역 색상·폰트·다크모드

```
@docs/4-1/layout-and-colors.md §2만 구현해줘.

- frontend/src/index.css: NanumSquareNeo 폰트, html/body 배경·글자색, .dark 변형
- @custom-variant dark 설정
- .scrollbar-modern 스크롤바 스타일 (라이트/다크)
- frontend/src/stores/themeStore.ts: theme light|dark, toggleTheme, applyTheme, persist
- Sonner 토스트 색상 변수는 이번 단계에서 제외

완료 조건:
- 콘솔에서 document.documentElement.classList.toggle('dark') 시 배경/글자 반전
- themeStore.toggleTheme() 동작
```

---

## Step 2 — MainLayout + 라우트 뼈대

```
@docs/4-1/layout-and-colors.md §3.1, §5 구현 (Step 2 범위만).

- frontend/src/layouts/MainLayout.tsx 생성
  - flex h-screen, bg-white dark:bg-black
  - Navbar 자리 + main(Outlet) + ThemeToggle import (ThemeToggle은 Step 7에서 구현, 지금은 placeholder div)
- frontend/src/App.tsx: MainLayout 하위에 /, /membership placeholder 페이지
- HomePage, MembershipPage는 각각 "홈", "크레딧 충전" 텍스트만 있는 최소 컴포넌트

제외: LeftSidebar, AuthModal, init 훅, AppToaster

완료 조건:
- http://localhost:1000/ 에서 "홈" 표시
- /membership 이동 가능
- main 영역만 스크롤 (h-screen overflow-hidden)
```

---

## Step 3 — Navbar + 색상

```
@docs/4-1/layout-and-colors.md §3.2 구현.

- frontend/src/components/Navbar/Navbar.tsx
  - h-10, border-b border-black/20 dark:border-white/20
  - bg-white dark:bg-black, transition-colors
  - NavLink to="/" : "Voice to Text" font-bold
- MainLayout에 <Navbar /> 마운트

완료 조건:
- 상단 40px 네비게이션 바 표시
- 다크모드 전환 시 Navbar 배경/테두리/글자색 변경
```

---

## Step 4 — LeftSidebar + sidebarStore

```
@docs/4-1/layout-and-colors.md §3.3, §4 sidebarStore 구현 (간소화 버전).

- frontend/src/stores/sidebarStore.ts: isOpen, toggle, open, close, SIDEBAR_WIDTH=288, persist
- frontend/src/components/LeftSidebar/LeftSidebar.tsx
  - 헤더: "메뉴" + 닫기(X) 버튼
  - navItems: 홈(/), 크레딧 충전(/membership)
  - NavLink 활성: bg-black text-white / dark:bg-white dark:text-black
  - NavLink 기본: hover:bg-black/5
  - 메모 섹션: "아직 메모가 없습니다" placeholder
  - 푸터: "로그인" 버튼 UI만 (onClick 없음)
  - 데스크톱: width 애니메이션 (framer-motion), w-72, border-r
  - 모바일: slide + overlay (bg-black/20)
- MainLayout에 <LeftSidebar /> 마운트

제외: MemoList, SidebarFooter 실제 로그인, memoStore 연동

완료 조건:
- 사이드바 열림/닫힘
- 홈·크레딧 충전 nav 활성 하이라이트
- 색상: layout-and-colors.md §3.3 표 준수
```

---

## Step 5 — SidebarToggle

```
@docs/4-1/layout-and-colors.md §3.4 구현.

- frontend/src/components/LeftSidebar/SidebarToggle.tsx
  - isOpen이 false일 때만 표시
  - fixed left-0 top-1/2, h-10 w-8, rounded-r-md
  - hover 시 border-black bg-black text-white (다크는 반대)
  - framer-motion whileHover scale
- MainLayout에 <SidebarToggle /> 마운트

완료 조건:
- 사이드바 닫으면 왼쪽 중앙에 열기 버튼 표시
- 클릭 시 사이드바 다시 열림
```

---

## Step 6 — RightSidebar + MemoPageShell

```
@docs/4-1/layout-and-colors.md §3.5, §3.6, rightSidebarStore 구현 (placeholder 본문).

- frontend/src/stores/rightSidebarStore.ts: isOpen, width(320, clamp 260~520), persist
- frontend/src/components/RightSidebar/RightSidebar.tsx
  - 헤더: StickyNote + "단어 메모" + 닫기
  - 본문 placeholder: "단어 메모 패널 (준비 중)"
  - 데스크톱: width 애니메이션, border-l, 리사이즈 핸들(GripVertical)
  - 모바일: slide from right + overlay
- frontend/src/components/RightSidebar/RightSidebarToggle.tsx
- frontend/src/components/RightSidebar/MemoPageShell.tsx
- frontend/src/pages/MemoPage.tsx: placeholder "메모 페이지" + MemoPageShell
- App.tsx에 /memo/:id 라우트 추가

제외: WordNotePanel, wordSelectionStore

완료 조건:
- /memo/test 접속 시 오른쪽 패널 표시
- / 는 오른쪽 패널 없음
- 패널 너비 드래그 리사이즈 (데스크톱)
- 색상: bg-white dark:bg-black, border-black/20
```

---

## Step 7 — ThemeToggle + MainLayout 마무리

```
@docs/4-1/layout-and-colors.md §3.7 구현.

- frontend/src/components/ThemeToggle/ThemeToggle.tsx
  - fixed bottom-6 right-6 z-30
  - h-12 w-12 rounded-full, border-black/bg-white (다크 반전)
  - Moon/Sun 아이콘, themeStore.toggleTheme
- MainLayout:
  - ThemeToggle 마운트
  - useEffect로 applyTheme(theme) 동기화
  - placeholder ThemeToggle div 제거

완료 조건:
- 우하단 버튼으로 라이트/다크 전환
- 새로고침 후 theme persist 유지
- Navbar·Sidebar·main 전체 색상 일관
```

---

## 보너스 — 레이아웃 통합 검증 프롬프트

```
Ch 4-1 Step 1~7 완료 상태를 @docs/4-1/layout-and-colors.md §7 체크리스트 기준으로 점검해줘.

- 빠진 컴포넌트/색상 클래스 목록
- 다크모드에서 border/ hover 반전 누락
- z-index 충돌 (overlay 40, sidebar 50, toggle 40, theme 30)
- 수정은 최소 diff로
```

---

## 다음 챕터 연결 프롬프트 (참고)

```
Ch 4-1 레이아웃 위에 Ch01 Auth 연결:
- SidebarFooter에 authStore + authModalStore 연동
- MainLayout에 AuthModal, useAuthInit 추가
- 기존 레이아웃 색상/구조는 변경하지 말 것
```

```
Ch 4-1 LeftSidebar에 Ch03 메모 목록 연결:
- MemoList, MemoSidebarItem 추가
- memoStore, useMemoInit 연동
- RightSidebar에 WordNotePanel 연결 (Ch08)
```
