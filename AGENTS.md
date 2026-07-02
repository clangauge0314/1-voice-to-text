# AGENTS.md

음성·영상 업로드 → WhisperX 전사 → 메모 편집·AI 단어 노트·멤버십 결제를 제공하는 **voice-to-text** 풀스택 SPA.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Vite 8, React 19, TypeScript, React Router 7, Zustand, Tailwind v4, framer-motion, recharts, sonner |
| Backend | Node.js (ESM), Express 4, Mongoose, JWT, multer, Cloudinary |
| External | MongoDB Atlas, WhisperX API, Google Gemini, PortOne V2, Cloudinary |

**사용하지 않음:** Next.js, App Router, RSC, Shadcn, Radix, `@/` path alias

## Repository Layout

```
frontend/          Vite SPA (port 1000)
  src/
    pages/         *Page.tsx
    layouts/       MainLayout, AdminLayout
    components/    feature별 PascalCase 폴더
    hooks/         use*.ts
    stores/        *Store.ts (Zustand)
    lib/           api.ts (유저), adminApi.ts (관리자)
backend/           Express API (port 1001)
  src/
    config/        env, db, cloudinary
    routes/        /api/* (+ routes/admin/)
    models/        User, Admin, Memo, Upload, Transcript, Payment
    middleware/    auth, adminAuth, ipWhitelist, upload
    utils/         serializers, usage, memo*, whisperx, portone, gemini …
    constants/     creditPacks.js
  scripts/         create-admin.js
.cursor/rules/     Cursor 상세 규칙 (*.mdc)
```

## Dev Commands

프론트·백엔드를 **각각 별도 터미널**에서 실행한다.

```bash
# Backend (backend/)
npm install
npm run dev              # http://localhost:1001, --watch

# Frontend (frontend/)
npm install
npm run dev              # http://localhost:1000, /api → 1001 proxy

# Frontend quality
npm run lint
npm run build

# Admin 계정 생성 (backend/, MongoDB 연결 필요)
npm run create-admin -- --email admin@example.com --password secret123 --name "관리자"
```

헬스체크: `GET http://localhost:1001/api/health` → `{ status, db }`

## Architecture (요약)

### 데이터 모델

```
User ──1:N── Upload ──1:1── Transcript
  │              └──1:1── Memo
  └──1:N── Payment
Admin (독립)
```

### API Routes

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | 유저 회원가입·로그인·me |
| `/api/admin` | IP 검사, 관리자 auth, stats |
| `/api/uploads` | 오디오/비디오 업로드 (Cloudinary) |
| `/api/transcripts` | 전사 요청·조회 |
| `/api/memos` | 메모 CRUD, AI 단어 노트 |
| `/api/usage` | 크레딧·사용량 |
| `/api/payments` | PortOne 결제 |

상세 엔드포인트: `.cursor/rules/backend-api-routes.mdc`

### Frontend Routes

| Path | Layout | Notes |
|------|--------|-------|
| `/` | MainLayout | Home — 업로드·전사 |
| `/membership` | MainLayout | 크레딧 패키지 |
| `/memo/:id` | MainLayout | 메모·전사·웨이브폼 |
| `/payment/complete` | MainLayout | 결제 완료 |
| `/admin/login` | AdminLayout | 관리자 로그인 |
| `/admin` | AdminLayout + AdminProtectedRoute | 대시보드 |

### Auth Model (중요)

- **User**와 **Admin**은 **별도 컬렉션** (`users`, `admins`)
- 관리자 이메일로 일반 `/api/auth/register|login` 시 **403**
- JWT: 유저 `{ userId }`, 관리자 `{ adminId, type: 'admin' }`, 만료 7d
- 프론트: `lib/api.ts` + `authStore` / `lib/adminApi.ts` + `adminAuthStore`
- 토큰: `Authorization: Bearer` 또는 `?token=` (오디오 URL)

### 핵심 플로우

1. **홈 E2E**: upload → transcribe → memo 생성 → `/memo/:id`
2. **메모 편집**: words/segments PATCH, 웨이브폼 seek, AI 단어 노트
3. **결제**: prepare → PortOne → complete → usage 갱신
4. **관리자**: IP 검사 → login → stats 대시보드

상세: `.cursor/rules/project-architecture.mdc`

## Environment Variables

`backend/.env` (템플릿: `backend/.env.example`)

| Variable | Purpose |
|----------|---------|
| `PORT` | 백엔드 포트 (기본 1001) |
| `CORS_ORIGIN` | 프론트 origin (기본 http://localhost:1000) |
| `MONGODB_URI` | MongoDB Atlas |
| `JWT_SECRET` | JWT 서명 |
| `CLOUDINARY_*` | 미디어 저장 |
| `WHISPERX_API_URL` | 전사 서버 (URL 변경 시 백엔드 재시작) |
| `GOOGLE_AI_API_KEY`, `GEMINI_MODEL` | AI 단어 노트 |
| `PORTONE_*` | 결제 (V2 API Secret) |
| `FRONTEND_URL` | 결제 리다이렉트 |
| `ADMIN_ALLOWED_IPS` | 관리자 IP 화이트리스트 |
| `ADMIN_IP_CHECK` | `false`면 IP 검사 off |

**`.env`, API 키, JWT secret 커밋 금지.**

## Code Conventions

### Cursor Rules

| 파일 | 내용 |
|------|------|
| `project-architecture.mdc` | 전체 아키텍처, 플로우, 재구현 순서 (**alwaysApply**) |
| `backend-api-routes.mdc` | API 엔드포인트·요청·응답 계약 |
| `backend-models-domain.mdc` | 모델, 미들웨어, utils, 크레딧·메모 도메인 |
| `backend-express-structure.mdc` | app/index/config 구조 |
| `backend-api-error-auth.mdc` | 에러 형식, 인증·관리자 보안 |
| `backend-workflow.mdc` | 작업 절차, 검증 |
| `frontend-app-architecture.mdc` | 라우팅, 스토어, 페이지, 플로우 |
| `frontend-state-api.mdc` | Zustand, API, 에러 처리 |
| `frontend-react-structure.mdc` | 폴더, export, import |
| `frontend-workflow.mdc` | TypeScript, 네이밍, UX |
| `frontend-ui-tailwind.mdc` | Tailwind, 다크모드, admin 차트 |

### 핵심 요약

**Frontend**
- 페이지·컴포넌트: `default export` / hooks·stores·lib: `named export`
- Zustand selector 구독, 서버 데이터 persist 금지
- UI·에러·toast: **한국어**
- Tailwind light/dark **쌍** (`bg-white dark:bg-black`)
- `React.FC`, `@/` alias, `.tsx` import 확장자 금지
- Vite 프록시: `/api` → `http://localhost:1001`

**Backend**
- ESM only, 라우트 `routes/` 하위, 허브 `routes/index.js`
- API 에러: `{ error: '한국어' }` (404/500 글로벌은 영문)
- admin: `routes/admin/` + IP + `adminAuthMiddleware`

### 재구현 순서 (권장)

**Backend:** health → MongoDB → auth → upload → usage → transcript → memo → payments → admin

**Frontend:** layout/auth → usage → home upload flow → memo list → memo page → membership → admin

상세: `project-architecture.mdc`

## Agent Constraints

1. **포트 1000·1001** — 임의로 테스트 서버 실행하지 말 것
2. **최소 diff** — 범위 밖 리팩터·의존성·파일 이동 금지
3. **DB reset 후** — admin·유저·결제 데이터 재생성 (`create-admin`, 회원가입)
4. **결제 테스트** — PortOne sandbox·`FRONTEND_URL` 일치
5. **크레딧 패키지 ID** — `backend/constants/creditPacks.js`와 `frontend/lib/api.ts` 동기화

## Common Tasks

| Task | Where |
|------|-------|
| 유저 API·타입 | `frontend/src/lib/api.ts` |
| 관리자 API·통계 | `frontend/src/lib/adminApi.ts`, `backend/src/utils/adminStats.js` |
| 크레딧 패키지 | `backend/src/constants/creditPacks.js` |
| Serializer | `backend/src/utils/serializers.js` |
| 메모 도메인 | `backend/src/utils/memo*.js` |
| 관리자 생성 | `backend/scripts/create-admin.js` |

## Testing Checklist (manual)

- [ ] `GET /api/health` → `status: ok`, `db: connected`
- [ ] 유저 회원가입·로그인
- [ ] 홈 업로드 → 전사 → 메모 페이지·웨이브폼 E2E
- [ ] 메모 제목·words 편집·AI 단어 노트
- [ ] 크레딧 차감·멤버십 결제 → usage 갱신
- [ ] `/admin/login` → IP 허용 시 대시보드
- [ ] IP 차단 시 `AdminBlockedPage` + `clientIp`
- [ ] `npm run lint` / `npm run build` (frontend) 통과
