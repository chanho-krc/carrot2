-- products 테이블의 type 컬럼에 'wanted' 값 추가
-- 기존: 'sale', 'share'
-- 추가: 'wanted' (구하기)

-- 기존 제약조건 삭제 (있는 경우)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;

-- 새로운 제약조건 추가 (sale, share, wanted 허용)
ALTER TABLE products ADD CONSTRAINT products_type_check 
CHECK (type IN ('sale', 'share', 'wanted'));

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_type_status ON products(type, status);

-- 구하기 상품 조회를 위한 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW wanted_products AS
SELECT * FROM products 
WHERE type = 'wanted' 
ORDER BY created_at DESC; 