# 레이아웃 & 색상 명세 (Ch 4-1)

## 1. 디자인 원칙

- **모노크롬**: 흑(#000) / 백(#fff) 기반, 포인트 컬러 최소화
- **다크모드**: `html`에 `.dark` 클래스 → Tailwind `dark:` 변형
- **테두리**: `border-black/20` (라이트) · `dark:border-white/20` (다크)
- **활성 nav**: 반전 — `bg-black text-white` · `dark:bg-white dark:text-black`
- **호버**: 은은하게 — `hover:bg-black/5` · `dark:hover:bg-white/10`
- **전환**: `transition-colors` (레이아웃), framer-motion (사이드바 width/slide)

---

## 2. 전역 색상 토큰 (`index.css`)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `--page-bg` | `#fff` | `#000` |
| `--page-text` | `#000` | `#fff` |
| `--border-default` | `rgb(0 0 0 / 0.2)` | `rgb(255 255 255 / 0.2)` |
| `--border-subtle` | `rgb(0 0 0 / 0.1~0.15)` | `rgb(255 255 255 / 0.1~0.15)` |
| `--text-muted` | `text-black/45~55` | `dark:text-white/45~55` |
| `--overlay-mobile` | `bg-black/20` | `dark:bg-white/10` |
| `--scrollbar-thumb` | `rgb(0 0 0 / 0.16)` | `rgb(255 255 255 / 0.16)` |

### 폰트
- `NanumSquareNeo` (네이버 CDN `@font-face`)
- `* { font-family: 'NanumSquareNeo', sans-serif; }`

### Tailwind 다크모드
```css
@custom-variant dark (&:where(.dark, .dark *));
```

### 스크롤바 (`.scrollbar-modern`)
- width 6px, thumb rounded-full
- 라이트: 검정 16% opacity · hover 30%
- 다크: 흰색 16% opacity · hover 30%

---

## 3. 컴포넌트별 레이아웃 & 색상

### 3.1 MainLayout (`layouts/MainLayout.tsx`)

**역할**: 앱 최상위 flex shell, `<Outlet />` 제공

```
flex h-screen overflow-hidden
├── LeftSidebar
├── SidebarToggle
├── div.flex-1.flex-col (메인 영역)
│   ├── Navbar
│   ├── main.flex-1.overflow-y-auto.scrollbar-modern  ← Outlet
│   └── ThemeToggle
```

| 영역 | 클래스 | 색상 |
|------|--------|------|
| 루트 | `bg-white text-black dark:bg-black dark:text-white transition-colors` | 페이지 배경 |
| main | `scrollbar-modern min-h-0 flex-1 overflow-y-auto` | 스크롤 영역 |

**Ch4-1 Step 2**에서는 AuthModal·init 훅 없이 뼈대만.

---

### 3.2 Navbar (`components/Navbar/Navbar.tsx`)

| 속성 | 값 |
|------|-----|
| 높이 | `h-10` (40px) |
| 배경 | `bg-white dark:bg-black` |
| 하단 테두리 | `border-b border-black/20 dark:border-white/20` |
| 패딩 | `px-4` |
| 타이틀 | `text-base font-bold text-black dark:text-white` |

```tsx
<nav className="bg-white dark:bg-black border-b border-black/20 dark:border-white/20 transition-colors">
  <div className="max-w-8xl mx-auto px-4 h-10 flex items-center">
    <NavLink to="/">Voice to Text</NavLink>
  </div>
</nav>
```

---

### 3.3 LeftSidebar (`components/LeftSidebar/LeftSidebar.tsx`)

| 속성 | 값 |
|------|-----|
| 너비 | `288px` (`SIDEBAR_WIDTH`, Tailwind `w-72`) |
| 배경 | `bg-white dark:bg-black` |
| 우측 테두리 | `border-r border-black/20 dark:border-white/20` |
| 헤더 높이 | `h-10`, `border-b border-black/20` |
| 푸터 | `border-t border-black/20`, `px-3 py-3` |

#### 서브 영역 색상

| 서브 영역 | 클래스 | 용도 |
|-----------|--------|------|
| 섹션 라벨 | `text-xs font-medium text-black/50 dark:text-white/50` | "페이지", "메모" |
| NavLink 활성 | `bg-black text-white dark:bg-white dark:text-black` | 현재 페이지 |
| NavLink 기본 | `text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10` | |
| 닫기 버튼 hover | `hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black` | X 버튼 |
| 모바일 오버레이 | `bg-black/20 dark:bg-white/10` | md 미만 |

#### 애니메이션 (framer-motion)
- 데스크톱: `animate={{ width: isOpen ? 288 : 0 }}` spring
- 모바일: `animate={{ x: isOpen ? 0 : '-100%' }}` slide
- `hidden md:flex` / `md:hidden` 분기

#### Ch4-1 범위 (간소화)
- navItems: `{ to: '/', label: '홈' }`, `{ to: '/membership', label: '크레딧 충전' }`
- 메모 섹션: "아직 메모가 없습니다" placeholder
- 푸터: "로그인" 버튼 placeholder (기능 없이 UI만)

---

### 3.4 SidebarToggle (`components/LeftSidebar/SidebarToggle.tsx`)

| 속성 | 값 |
|------|-----|
| 위치 | `fixed left-0 top-1/2 -translate-y-1/2 z-40` |
| 크기 | `h-10 w-8` |
| 모양 | `rounded-r-md border border-l-0` |
| 배경 | `bg-white dark:bg-black` |
| hover | `hover:border-black hover:bg-black hover:text-white` (반전) |
| 표시 조건 | `isOpen === false` 일 때만 |

---

### 3.5 RightSidebar (`components/RightSidebar/RightSidebar.tsx`)

| 속성 | 값 |
|------|-----|
| 기본 너비 | `320px` (`DEFAULT_RIGHT_SIDEBAR_WIDTH`) |
| 리사이즈 | `260 ~ 520px` |
| 배경 | `bg-white dark:bg-black` |
| 좌측 테두리 | `border-l border-black/20 dark:border-white/20` |
| 헤더 | `h-10 border-b`, 아이콘 StickyNote + "단어 메모" |

#### Ch4-1 범위
- 패널 본문: "단어 메모 패널 (준비 중)" placeholder
- `WordNotePanel` 연결은 Ch08 이후
- 리사이즈 핸들: `GripVertical`, hover `border-black/30`

#### MemoPageShell
```tsx
<div className="flex h-full min-h-0 overflow-hidden">
  <div className="min-w-0 flex-1">{children}</div>
  <RightSidebar />
  <RightSidebarToggle />
</div>
```
→ `MemoPage.tsx`에서만 사용. 홈/멤버십에는 RightSidebar 없음.

---

### 3.6 RightSidebarToggle

SidebarToggle과 대칭, `fixed right-0`, `rounded-l-md`, `PanelRightOpen` 아이콘.

---

### 3.7 ThemeToggle (`components/ThemeToggle/ThemeToggle.tsx`)

| 속성 | 값 |
|------|-----|
| 위치 | `fixed bottom-6 right-6 z-30` |
| 크기 | `h-12 w-12 rounded-full` |
| 테두리 | `border border-black dark:border-white` |
| 배경 | `bg-white dark:bg-black` |
| hover | 반전 (검↔백) |
| 아이콘 | 라이트: Moon · 다크: Sun |

---

## 4. Zustand 스토어

### themeStore
```ts
theme: 'light' | 'dark'
toggleTheme()
applyTheme(theme) → document.documentElement.classList.toggle('dark', ...)
persist: 'theme-storage'
```

### sidebarStore
```ts
isOpen: true (기본 열림)
toggle / open / close
SIDEBAR_WIDTH = 288
persist: 'sidebar-storage'
```

### rightSidebarStore
```ts
isOpen: true
width: 320 (clamp 260~520)
toggle / open / close / setWidth
persist: 'right-sidebar-storage'
```

---

## 5. 라우팅 (`App.tsx`)

```tsx
<Route element={<MainLayout />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/membership" element={<MembershipPage />} />
  <Route path="/memo/:id" element={<MemoPage />} />  {/* MemoPageShell 사용 */}
</Route>
```

Ch4-1에서는 HomePage/MembershipPage를 **placeholder** `<div className="p-10">홈</div>` 로 대체 가능.

---

## 6. Step ↔ 완성본 라인 매핑

| Step | 완성본 참고 |
|------|-------------|
| 1 | `index.css`, `themeStore.ts` |
| 2 | `MainLayout.tsx` L25-38, `App.tsx` |
| 3 | `Navbar.tsx` 전체 |
| 4 | `LeftSidebar.tsx` — SidebarContent 헤더+nav만 (L388-427) |
| 5 | `SidebarToggle.tsx`, LeftSidebar motion (L488-518) |
| 6 | `RightSidebar.tsx` SidebarPanel 헤더만, `MemoPageShell.tsx` |
| 7 | `ThemeToggle.tsx`, MainLayout에 ThemeToggle 마운트 |

---

## 7. 색상 검증 체크리스트

- [ ] 라이트: 배경 흰색, 텍스트 검정, border 20% black
- [ ] 다크: 배경 검정, 텍스트 흰색, border 20% white
- [ ] NavLink 활성 시 배경·글자 반전
- [ ] 사이드바 닫기/열기 hover 반전
- [ ] 모바일 오버레이 반투명
- [ ] main 스크롤바 `.scrollbar-modern` 적용
- [ ] ThemeToggle 우하단 고정, 아이콘 전환
