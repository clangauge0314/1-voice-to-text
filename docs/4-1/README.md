# Ch 4-1 레이아웃 & 색상

> Voice to Text 앱의 **전역 테마**, **MainLayout**, **Navbar**, **LeftSidebar**, **RightSidebar** 뼈대를 단계별로 만드는 챕터입니다.
>
> 참고: [../spec.md](../spec.md)

## 이 챕터에서 만드는 것

| Step | 산출물 | 완료 조건 |
|------|--------|-----------|
| 1 | 전역 색상·폰트·다크모드 | `html.dark` 토글 시 배경/글자 반전 |
| 2 | `MainLayout` + 라우트 | `/`, `/membership` 페이지가 `<Outlet />`에 렌더 |
| 3 | `Navbar` | 상단 40px 바, 로고/타이틀 표시 |
| 4 | `LeftSidebar` + `sidebarStore` | 홈·크레딧 충전 nav, 열림/닫힘 |
| 5 | `SidebarToggle` | 닫힌 상태에서 왼쪽 중앙 열기 버튼 |
| 6 | `RightSidebar` + `MemoPageShell` | `/memo/:id`에서만 오른쪽 패널 표시 |
| 7 | `ThemeToggle` | 우하단 고정, 라이트/다크 전환 |

## 이 챕터에서 **아직** 안 만드는 것

- 메모 목록 CRUD (`MemoSidebarItem`, `MemoList`)
- 로그인 푸터 (`SidebarFooter`)
- `WordNotePanel` 내용
- `AuthModal`, `AppToaster`
- `useAuthInit`, `useMemoInit`, `useUsageInit`

→ Ch01(인증), Ch03(메모) 이후에 연결합니다.

## 파일 구조 (완성본 기준)

```
frontend/src/
├── index.css                          # 전역 색·폰트·스크롤바
├── App.tsx                            # MainLayout 라우트
├── layouts/MainLayout.tsx
├── stores/
│   ├── themeStore.ts
│   ├── sidebarStore.ts
│   └── rightSidebarStore.ts
└── components/
    ├── Navbar/Navbar.tsx
    ├── ThemeToggle/ThemeToggle.tsx
    ├── LeftSidebar/
    │   ├── LeftSidebar.tsx
    │   └── SidebarToggle.tsx
    └── RightSidebar/
        ├── RightSidebar.tsx
        ├── RightSidebarToggle.tsx
        └── MemoPageShell.tsx
```

## 문서

- [layout-and-colors.md](./layout-and-colors.md) — 레이아웃 구조 & 컴포넌트별 색상 명세
- [prompts.md](./prompts.md) — Step 1~7 프롬프트 전문

## 레이아웃 ASCII

```
┌──────────────┬─────────────────────────────────────────────┐
│              │  Navbar (h-10, border-b)                    │
│  LeftSidebar ├──────────────────────────┬──────────────────┤
│  (w-72)      │                          │  RightSidebar    │
│              │  main (Outlet)           │  (memo page만)   │
│              │  scrollbar-modern        │  resizable       │
│              │                          │                  │
└──────────────┴──────────────────────────┴──────────────────┘
  SidebarToggle (닫힘)              ThemeToggle (우하단 고정)
                                    RightSidebarToggle (닫힘)
```
