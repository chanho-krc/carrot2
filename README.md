# 사내 중고마켓 🛒

사내 직원들을 위한 중고거래 플랫폼입니다. React, Next.js, Tailwind CSS, Supabase를 사용하여 개발되었습니다.

## 주요 기능

### 🏠 홈 화면
- 등록된 상품을 카드 형식으로 표시
- 실시간 검색 및 카테고리 필터링
- 상품 상태(판매중/예약됨/거래완료) 표시

### 🔐 로그인 시스템
- **일반 사용자**: 이름 + 전화번호로 로그인/가입
- **관리자**: admin/admin123 계정으로 로그인
- 로컬 스토리지를 통한 세션 관리

### 📝 상품 등록
- 상품 정보 입력 (제목, 설명, 가격, 사용기간, 연락처)
- 이미지 업로드 (최대 3장)
- Supabase Storage 활용

### 👀 상품 상세
- 상품 정보 및 이미지 갤러리
- 판매자 연락처 표시
- 상태 변경 및 예약 기능

### 🛍️ 내 상품 관리
- 내가 등록한 상품 목록
- 상품 상태 변경 및 삭제
- 판매 통계 확인

### 🔧 관리자 대시보드
- 전체 상품 및 사용자 관리
- 통계 및 분석 기능
- 모든 상품 상태 변경 및 삭제 권한

## 기술 스택

- **Frontend**: React 18, Next.js 14, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Icons**: React Icons (Feather)
- **Deployment**: Vercel

## 시작하기

### 1. 환경 설정

프로젝트를 클론하고 의존성을 설치합니다:

```bash
git clone <repository-url>
cd carrot2
npm install
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. 데이터베이스 테이블 생성

Supabase SQL Editor에서 다음 쿼리를 실행합니다:

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 상품 테이블
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  usage_period VARCHAR(100),
  contact VARCHAR(50) NOT NULL,
  seller_name VARCHAR(100) NOT NULL,
  seller_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'selling' CHECK (status IN ('selling', 'reserved', 'sold')),
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_created_at ON products(created_at);
```

### 4. Storage 버킷 생성

Supabase Storage에서 `images` 버킷을 생성하고 공개 액세스를 허용합니다.

### 5. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 애플리케이션을 확인할 수 있습니다.

## 사용 방법

### 일반 사용자
1. `/login` 페이지에서 이름과 전화번호 입력
2. 홈 화면에서 상품 목록 확인 및 검색
3. `/upload` 페이지에서 상품 등록
4. `/my` 페이지에서 내 상품 관리

### 관리자
1. `/login` 페이지에서 관리자 탭 선택
2. ID: `admin`, PW: `admin123` 입력
3. `/admin` 페이지에서 전체 상품 및 사용자 관리

## 배포

### Vercel 배포
```bash
npm run build
vercel --prod
```

### 환경 변수 설정
Vercel 대시보드에서 환경 변수를 설정합니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 주요 페이지

- `/` - 홈 (상품 목록)
- `/login` - 로그인
- `/upload` - 상품 등록
- `/detail/[id]` - 상품 상세
- `/my` - 내 상품 관리
- `/admin` - 관리자 대시보드

## 보안 고려사항

- 관리자 계정은 클라이언트 측 하드코딩되어 있음 (개발용)
- 실제 운영 환경에서는 서버 측 인증 구현 권장
- Supabase RLS (Row Level Security) 정책 설정 권장

## 라이선스

MIT License
