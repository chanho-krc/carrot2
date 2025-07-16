-- Carrot2 - products 테이블 완전 재생성 (wanted 타입 포함)
-- 기존 테이블을 삭제하고 모든 필요한 컬럼을 포함해서 새로 생성

-- 1. 기존 products 테이블 삭제 (CASCADE로 관련 제약조건도 함께 삭제)
DROP TABLE IF EXISTS products CASCADE;

-- 2. 코드에 맞는 완전한 products 테이블 생성 (wanted 타입 포함)
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
  type VARCHAR(10) DEFAULT 'sale' CHECK (type IN ('sale', 'share', 'wanted')), -- 판매/나눔/구하기 구분
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

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 products를 읽을 수 있음
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

-- 인증된 사용자는 자신의 상품을 생성할 수 있음
CREATE POLICY "Authenticated users can create products" ON products FOR INSERT 
  WITH CHECK (auth.uid() = seller_id);

-- 사용자는 자신의 상품만 수정할 수 있음
CREATE POLICY "Users can update their own products" ON products FOR UPDATE 
  USING (auth.uid() = seller_id);

-- 사용자는 자신의 상품만 삭제할 수 있음
CREATE POLICY "Users can delete their own products" ON products FOR DELETE 
  USING (auth.uid() = seller_id);

-- 7. 관리자 사용자 생성 (users 테이블이 존재한다고 가정)
-- users 테이블이 존재하지 않으면 이 부분은 별도로 실행 필요
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    INSERT INTO users (name, phone, created_at, updated_at)
    VALUES ('관리자', 'admin', NOW(), NOW())
    ON CONFLICT (phone) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
  ELSE
    RAISE NOTICE 'users 테이블이 존재하지 않습니다. 먼저 users 테이블을 생성해주세요.';
  END IF;
END
$$;

-- 8. 샘플 데이터 삽입 (선택사항)
-- 테스트용 데이터가 필요한 경우 주석을 해제하고 실행
/*
INSERT INTO products (title, description, price, contact, seller_name, type, category, images)
VALUES 
  ('아이폰 15 판매', '거의 새 상품입니다. 케이스와 함께 드립니다.', 800000, '010-1234-5678', '김판매', 'sale', '전자기기', ARRAY['https://example.com/iphone.jpg']),
  ('무료 나눔 - 책', '읽지 않는 책들 나눔합니다.', 0, '010-9876-5432', '이나눔', 'share', '도서', ARRAY['https://example.com/books.jpg']),
  ('맥북 구합니다', 'M1 또는 M2 맥북 구하고 있습니다.', 1500000, '010-5555-1234', '박구매', 'wanted', '전자기기', ARRAY[]);
*/

-- 9. 완료 메시지
SELECT 'Products table recreated successfully with all required columns including wanted type!' as result; 