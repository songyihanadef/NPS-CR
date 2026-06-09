# 네플스 작업 가이드 (NPS Guide)

Vite + React + TypeScript + Supabase 기반의 네플스 작업 가이드 페이지입니다.

## 폴더 구조

```txt
nps-guide
├ package.json
├ index.html
├ vite.config.ts
├ tsconfig.json
├ tsconfig.node.json
├ .env.example
├ .gitignore
├ supabase.sql
└ src
   ├ main.tsx
   ├ App.tsx
   ├ app.css
   ├ types
   │  └ index.ts
   ├ lib
   │  └ supabase.ts
   └ components
      ├ PostCard.tsx
      ├ PostForm.tsx
      └ SearchBar.tsx
```

## Supabase 세팅

1. Supabase 프로젝트 접속
2. SQL Editor 실행
3. `supabase.sql` 전체 실행
4. Project Settings → API에서 아래 2개 값 확인
   - Project URL
   - anon public key

## 로컬 환경변수

`.env.example`을 복사해서 `.env`로 만들고 실제 값을 넣습니다.

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxx
```

## Vercel 환경변수

Vercel 프로젝트 생성 후 Settings → Environment Variables에 아래 2개를 추가합니다.

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 기능

- 홈 화면: 카테고리 카드 4개 + 전체 검색
- 카테고리 상세: 해당 카테고리 글 목록, 검색, 새 글 등록
- 글 카드: 상세 펼침, 수정, 삭제
- Supabase 테이블명: `NPS`
- 관리자 비밀번호 없음
- 썸네일 이미지 없음
