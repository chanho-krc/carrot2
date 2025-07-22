-- Carrot2 - products 테이블 재생성 (videos 컬럼 포함, Storage 정책 제외)

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
  videos TEXT[] DEFAULT '{}', -- 동영상 URL 배열 ★ 새로 추가 ★
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

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 기존 정책들 삭제 후 다시 생성
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable update for all users" ON products;
DROP POLICY IF EXISTS "Enable delete for all users" ON products;

-- 새 정책 생성
CREATE POLICY "Enable read access for all users" ON products 
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON products 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON products 
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON products 
  FOR DELETE USING (true);

-- 7. 테스트 데이터 삽입
INSERT INTO products (title, description, price, contact, seller_name, type, category, status)
VALUES 
  ('테스트 판매 상품', '이것은 테스트용 판매 상품입니다.', 10000, '010-1234-5678', '테스트판매자', 'sale', '기타', 'selling'),
  ('테스트 나눔 상품', '이것은 테스트용 나눔 상품입니다.', 0, '010-2345-6789', '테스트나눔자', 'share', '기타', 'selling'),
  ('테스트 구하기 상품', '이것은 테스트용 구하기 상품입니다.', 15000, '010-3456-7890', '테스트구매자', 'wanted', '기타', 'selling');

-- 8. videos 컬럼 확인
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'videos')
ORDER BY column_name;

-- 9. 성공 메시지
SELECT 'SUCCESS: products 테이블이 videos 컬럼과 함께 재생성되었습니다!' as result; 