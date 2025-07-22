-- =============================================
-- Carrot2 복원 스크립트 (동영상 기능 포함)
-- 동영상 업로드 기능을 포함한 완전한 상태로 복원합니다
-- =============================================

-- 1. 기존 products 테이블 삭제
DROP TABLE IF EXISTS products CASCADE;

-- 2. videos 컬럼이 포함된 products 테이블 생성
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10,2),
  usage_period VARCHAR(100),
  contact VARCHAR(100) NOT NULL,
  seller_name VARCHAR(100) NOT NULL,
  seller_id UUID,
  status VARCHAR(20) DEFAULT 'selling' CHECK (status IN ('selling', 'reserved', 'sold')),
  type VARCHAR(10) DEFAULT 'sale' CHECK (type IN ('sale', 'share', 'wanted')),
  category VARCHAR(100),
  images TEXT[] DEFAULT '{}', -- 이미지 URL 배열
  videos TEXT[] DEFAULT '{}', -- 동영상 URL 배열 ★ 추가 ★
  view_count INTEGER DEFAULT 0,
  -- 예약자 정보
  reserved_by_id UUID,
  reserved_by_name VARCHAR(100),
  reserved_by_phone VARCHAR(20),
  reserved_at TIMESTAMP WITH TIME ZONE,
  -- 시간 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_view_count ON products(view_count);

-- 4. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. updated_at 트리거
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 6. 조회수 증가 함수 생성
CREATE OR REPLACE FUNCTION increment_view_count(product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET view_count = view_count + 1, updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- 7. RLS 정책 설정
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 기존 정책들 삭제 (에러 방지)
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable update for all users" ON products;
DROP POLICY IF EXISTS "Enable delete for all users" ON products;

-- 새 정책 생성 (모든 사용자 접근 허용)
CREATE POLICY "Enable read access for all users" ON products 
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON products 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON products 
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON products 
  FOR DELETE USING (true);

-- 8. 테스트 데이터 삽입 (동영상 기능 테스트용)
INSERT INTO products (title, description, price, contact, seller_name, type, category, status)
VALUES 
  ('아이폰 15 Pro', '상태 좋은 아이폰 15 Pro 판매합니다', 1200000, '010-1234-5678', '김판매', 'sale', '휴대폰/태블릿', 'selling'),
  ('책 무료나눔', '읽지 않는 컴퓨터 관련 책들 나눔합니다', 0, '010-9876-5432', '이나눔', 'share', '도서/문구', 'selling'),
  ('맥북 프로 구합니다', 'M2/M3 맥북 프로 구하고 있습니다', 2000000, '010-5555-1234', '박구매', 'wanted', '노트북/PC', 'selling'),
  ('무선 이어폰 판매', '새것 같은 에어팟 프로 판매합니다', 200000, '010-7777-8888', '최이어폰', 'sale', '모니터/주변기기', 'selling'),
  ('화분 나눔해요', '키우기 쉬운 다육식물 화분들 나눔해요', 0, '010-3333-4444', '정식물', 'share', '생활용품', 'selling');

-- 9. 결과 확인
SELECT 
  'SUCCESS: Carrot2가 동영상 기능과 함께 복원되었습니다!' as result,
  COUNT(*) || '개의 테스트 상품이 생성되었습니다.' as test_data
FROM products;

-- 10. videos 컬럼 확인
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'videos')
ORDER BY column_name;

-- 11. 전체 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position; 