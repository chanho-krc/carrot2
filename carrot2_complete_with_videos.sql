-- Carrot2 - products 테이블 완전 재생성 (videos 컬럼 포함)
-- 기존 테이블을 삭제하고 모든 필요한 컬럼을 포함해서 새로 생성

-- 1. 기존 products 테이블 삭제 (CASCADE로 관련 제약조건도 함께 삭제)
DROP TABLE IF EXISTS products CASCADE;

-- 2. 코드에 맞는 완전한 products 테이블 생성 (videos 컬럼 포함)
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
  videos TEXT[] DEFAULT '{}', -- 동영상 URL 배열 (새로 추가)
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

-- 3. 모든 필요한 인덱스 생성
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

-- 모든 사용자가 products를 읽을 수 있음
CREATE POLICY "Enable read access for all users" ON products 
  FOR SELECT USING (true);

-- 모든 사용자가 products를 생성할 수 있음
CREATE POLICY "Enable insert for all users" ON products 
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 products를 수정할 수 있음
CREATE POLICY "Enable update for all users" ON products 
  FOR UPDATE USING (true);

-- 모든 사용자가 products를 삭제할 수 있음
CREATE POLICY "Enable delete for all users" ON products 
  FOR DELETE USING (true);

-- 7. Storage 버킷 생성 (이미지/동영상 업로드용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage 정책 설정
DO $$
BEGIN
  -- 기존 정책이 있으면 삭제
  DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
  
  -- 새 정책 생성
  CREATE POLICY "Anyone can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images');

  CREATE POLICY "Anyone can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

  CREATE POLICY "Anyone can update product images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'product-images');

  CREATE POLICY "Anyone can delete product images" ON storage.objects
    FOR DELETE USING (bucket_id = 'product-images');
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Storage policies already exist or error occurred: %', SQLERRM;
END $$;

-- 9. 샘플 테스트 데이터 삽입
INSERT INTO products (title, description, price, contact, seller_name, type, category, status)
VALUES 
  ('테스트 판매 상품', '이것은 테스트용 판매 상품입니다.', 10000, '010-1234-5678', '테스트판매자', 'sale', '기타', 'selling'),
  ('테스트 나눔 상품', '이것은 테스트용 나눔 상품입니다.', 0, '010-2345-6789', '테스트나눔자', 'share', '기타', 'selling'),
  ('테스트 구하기 상품', '이것은 테스트용 구하기 상품입니다.', 15000, '010-3456-7890', '테스트구매자', 'wanted', '기타', 'selling');

-- 10. 컬럼 확인
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'videos')
ORDER BY column_name;

-- 11. 완료 메시지
SELECT 'Carrot2 데이터베이스가 videos 컬럼과 함께 완전히 재생성되었습니다!' as result; 