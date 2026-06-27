# Voice to Text - SPEC

## 1. 제품 한 줄 정의
- 음성/영상 파일을 업로드하면 전사하고, 단어 단위 메모와 AI 메모를 관리하는 웹 앱.

## 2. 목표
- 업로드 -> 전사 -> 메모 편집 -> 크레딧 충전까지 하나의 흐름 제공.
- 전사 결과를 단어/문장 단위로 빠르게 수정 가능하게 제공.

## 3. 범위 (In Scope)
- 인증(회원가입/로그인)
- 파일 업로드 및 전사
- 메모 편집기, 단어 메모, AI 메모
- 크레딧(음성 초 + AI 메모) 사용량 표시
- 결제(크레딧 팩 충전)

## 4. 비범위 (Out of Scope)
- 구독형 플랜
- 팀 협업/실시간 공동 편집
- 모바일 네이티브 앱

## 5. 핵심 도메인
- User
- Memo
- Transcript
- Payment
- CreditPack

## 6. 크레딧 정책
- 음성 크레딧: `audioSecondsBalance`
- AI 메모 크레딧: `aiNotesBalance`
- 누적 통계: `usedSeconds`, `usedAiNotes`
- 유효기간 없음, 월 리셋 없음

## 7. API 개요
- Auth: `/auth/register`, `/auth/login`, `/auth/me`
- Uploads: `/uploads/audio`, `/uploads/:id`, `/uploads/:id/audio`
- Transcripts: `/transcripts`, `/transcripts/:id`
- Memos: `/memos`, `/memos/:id`, `/memos/:id/words/:wordIndex/ai-note`
- Usage: `/usage/me`
- Payments: `/payments/prepare`, `/payments/complete`, `/payments/webhook/portone`

## 8. 프론트 라우트 개요
- `/` : 홈/업로드
- `/memo/:id` : 메모 편집
- `/membership` : 크레딧 충전
- `/payment/complete` : 결제 완료

## 9. 환경변수 (요약)
- Backend: DB, JWT, PortOne, Frontend URL, WhisperX 연동 변수
- Frontend: API URL, PortOne 클라이언트 변수

## 10. 챕터 로드맵 (초안)
- Ch00: Setup
- Ch01: Auth
- Ch02: Layout
- Ch03: Upload
- Ch04: Transcription
- Ch05~07: Transcript Editor
- Ch08~09: Word Note + AI
- Ch10: Credit UX
- Ch11: Payment
- Ch12: Ship

## 11. 변경 이력
- 2026-06: 구독형 모델에서 크레딧 충전형 모델로 전환.

