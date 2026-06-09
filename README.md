# NPS CR Guide

## 이번 수정 반영
- 관련 링크 입력칸을 URL 전용(type=url)에서 일반 텍스트(type=text)로 변경했습니다.
- 관련 링크가 `http://` 또는 `https://`로 시작하면 클릭 가능한 링크로 표시합니다.
- URL 형식이 아니면 입력한 텍스트 그대로 카드 상세에 표시합니다.
- 이미지 영역에 Ctrl+V 붙여넣기 기능은 유지했습니다.
- 이미지 영역에 jpg/png/webp 파일을 드래그 앤 드롭해서 추가할 수 있게 했습니다.
- 여러 이미지를 한 번에 드래그해서 추가할 수 있습니다.
- 이미지 업로드 시 파일 확장자와 content-type을 보존하도록 수정했습니다.

## 배포 방법
1. GitHub 레포에 이 ZIP 안의 파일들을 그대로 덮어쓰기 업로드합니다.
2. Commit changes를 누릅니다.
3. Vercel에서 자동 배포가 Ready 상태인지 확인합니다.

## 주의
- `.env.example`은 예시 파일입니다. 실제 Vercel 환경변수에는 아래 두 값을 넣어야 합니다.
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
