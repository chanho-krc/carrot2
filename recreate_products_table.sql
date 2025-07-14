-- Carrot2 - products 테이블 완전 재생성
-- 기존 테이블을 삭제하고 모든 필요한 컬럼을 포함해서 새로 생성

-- 1. 기존 products 테이블 삭제 (CASCADE로 관련 제약조건도 함께 삭제)
DROP TABLE IF EXISTS products CASCADE;

-- 2. 코드에 맞는 완전한 products 테이블 생성
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL, -- DECIMAL로 수정 (소수점 지원)
  original_price DECIMAL(10,2), -- 원가
  usage_period VARCHAR(100),
  contact VARCHAR(100) NOT NULL,
  seller_name VARCHAR(100) NOT NULL,
  seller_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'selling' CHECK (status IN ('selling', 'reserved', 'sold')),
  type VARCHAR(10) DEFAULT 'sale' CHECK (type IN ('sale', 'share')), -- 판매/나눔 구분
  category VARCHAR(100), -- 카테고리
  images TEXT[], -- 이미지 URL 배열
  view_count INTEGER DEFAULT 0, -- 조회수
  -- 예약자 정보
  reserved_by_id UUID,
  reserved_by_name VARCHAR(100),
  reserved_by_phone VARCHAR(20),
  reserved_at TIMESTAMP WITH TIME ZONE,
  -- 시간 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 모든 필요한 인덱스 생성
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at);

-- 4. 관리자 사용자 생성 (이미 존재하는 경우 업데이트)
INSERT INTO users (name, phone, created_at, updated_at)
VALUES ('관리자', 'admin', NOW(), NOW())
ON CONFLICT (phone) 
DO UPDATE SET 
    name = EXCLUDED.name,
    updated_at = NOW();

-- 5. 완료 메시지
SELECT 'Products table recreated successfully with all required columns!' as result; 