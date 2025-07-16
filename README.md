# Carrot2 - 사내 중고거래 마켓플레이스

Next.js + Supabase로 개발된 회사 내부 중고거래 플랫폼입니다.

## 기능

- 🔐 사용자 로그인/회원가입 (전화번호 기반)
- 📱 상품 등록/수정/삭제
- 🔍 상품 검색 및 필터링
- 👥 관리자 대시보드
- 💫 PWA 지원 (모바일 앱처럼 설치 가능)
- 🎯 구하기(wanted) 기능

## 관리자 계정

**⚠️ 보안 중요사항 ⚠️**

관리자 계정 정보는 별도로 관리되며, 담당자에게 문의하시기 바랍니다.

### 보안 가이드라인

1. **관리자 비밀번호는 정기적으로 변경하세요**
2. **관리자 계정 정보를 외부에 노출하지 마세요**
3. **운영 환경에서는 더 강력한 인증 시스템 도입을 권장합니다**
4. **소스코드를 공개 저장소에 올릴 때는 관리자 정보를 환경변수로 분리하세요**

## 개발 환경 설정

1. 프로젝트 클론
2. 의존성 설치: `npm install`
3. 환경변수 설정: `.env.local` 파일 생성
4. 개발 서버 실행: `npm run dev`

## 배포

- **Vercel**: https://carrot2-omega.vercel.app
- **GitHub**: https://github.com/chanho-krc/carrot2

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **배포**: Vercel
- **PWA**: Service Worker, Web App Manifest
