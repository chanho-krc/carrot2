-- products 테이블에 videos 컬럼 추가
ALTER TABLE products ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- 컬럼 코멘트 추가
COMMENT ON COLUMN products.videos IS '상품 동영상 URL 배열';

-- 확인용 쿼리
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'videos')
ORDER BY column_name; 