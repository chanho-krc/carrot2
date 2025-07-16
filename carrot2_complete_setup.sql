-- Carrot2 - products 테이블 완전 재생성 (RLS 문제 해결 버전)
-- 기존 테이블을 삭제하고 모든 필요한 컬럼을 포함해서 새로 생성

-- 1. 기존 products 테이블 삭제 (CASCADE로 관련 제약조건도 함께 삭제)
DROP TABLE IF EXISTS products CASCADE;

-- 2. 코드에 맞는 완전한 products 테이블 생성 (wanted 타입 포함, 제약조건 완화)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0, -- DECIMAL로 수정 (소수점 지원)
  original_price DECIMAL(10,2), -- 원가
  usage_period VARCHAR(100),
  contact VARCHAR(100) NOT NULL,
  seller_name VARCHAR(100) NOT NULL,
  seller_id UUID, -- users 테이블 참조 제거 (NULL 허용)
  status VARCHAR(20) DEFAULT 'selling' CHECK (status IN ('selling', 'reserved', 'sold')),
  type VARCHAR(10) DEFAULT 'sale' CHECK (type IN ('sale', 'share', 'wanted')), -- 판매/나눔/구하기 구분
  category VARCHAR(100), -- 카테고리
  images TEXT[] DEFAULT '{}', -- 이미지 URL 배열 (기본값 빈 배열)
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
CREATE INDEX idx_products_view_count ON products(view_count); -- 조회수 정렬용

-- 4. updated_at 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. updated_at 자동 업데이트 트리거 생성
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) 정책 설정 - 완화된 버전
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 products를 읽을 수 있음
CREATE POLICY "Enable read access for all users" ON products 
  FOR SELECT USING (true);

-- 모든 사용자가 products를 생성할 수 있음 (임시 - 테스트용)
CREATE POLICY "Enable insert for all users" ON products 
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 products를 수정할 수 있음 (임시 - 테스트용)
CREATE POLICY "Enable update for all users" ON products 
  FOR UPDATE USING (true);

-- 모든 사용자가 products를 삭제할 수 있음 (임시 - 테스트용)
CREATE POLICY "Enable delete for all users" ON products 
  FOR DELETE USING (true);

-- 7. Storage 버킷 생성 (이미지 업로드용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage 정책 설정
CREATE POLICY "Anyone can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');

-- 9. 샘플 테스트 데이터 삽입
INSERT INTO products (title, description, price, contact, seller_name, type, category, status)
VALUES 
  ('테스트 판매 상품', '이것은 테스트용 판매 상품입니다.', 10000, '010-1234-5678', '테스트판매자', 'sale', '기타', 'selling'),
  ('테스트 나눔 상품', '이것은 테스트용 나눔 상품입니다.', 0, '010-2345-6789', '테스트나눔자', 'share', '기타', 'selling'),
  ('테스트 구하기 상품', '이것은 테스트용 구하기 상품입니다.', 15000, '010-3456-7890', '테스트구매자', 'wanted', '기타', 'selling');

-- 10. 완료 메시지
SELECT 'Carrot2 데이터베이스 설정이 완료되었습니다! 상품 등록이 가능합니다.' as result; 