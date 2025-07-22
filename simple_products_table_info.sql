-- =============================================
-- 간단한 products 테이블 구조 확인 SQL
-- 핵심 정보만 빠르게 확인
-- =============================================

-- 🎯 1. 테이블 존재 여부 및 기본 정보
SELECT 
  'products 테이블 정보' as 구분,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products') 
    THEN '✅ 테이블 존재함' 
    ELSE '❌ 테이블 없음' 
  END as 상태;

-- 🎯 2. 컬럼 목록 (핵심 정보만)
SELECT 
  ordinal_position as 순서,
  column_name as 컬럼명,
  CASE 
    WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
    WHEN data_type = 'numeric' THEN 'DECIMAL(' || numeric_precision || ',' || numeric_scale || ')'
    WHEN data_type = 'ARRAY' THEN 'TEXT[]'
    ELSE UPPER(data_type)
  END as 타입,
  CASE WHEN is_nullable = 'YES' THEN 'NULL 가능' ELSE 'NOT NULL' END as NULL여부,
  COALESCE(column_default, '없음') as 기본값
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 🎯 3. 기본키 및 인덱스
SELECT 
  '기본키: ' || string_agg(column_name, ', ') as 기본키_정보
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'products' AND tc.constraint_type = 'PRIMARY KEY';

-- 🎯 4. 인덱스 목록
SELECT 
  indexname as 인덱스명,
  indexdef as 인덱스_정의
FROM pg_indexes 
WHERE tablename = 'products';

-- 🎯 5. 현재 데이터 개수
SELECT 
  COUNT(*) as 현재_상품_개수,
  COUNT(CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 1 END) as 이미지_있는_상품,
  COUNT(CASE WHEN videos IS NOT NULL AND array_length(videos, 1) > 0 THEN 1 END) as 동영상_있는_상품,
  COUNT(CASE WHEN type = 'sale' THEN 1 END) as 판매_상품,
  COUNT(CASE WHEN type = 'share' THEN 1 END) as 나눔_상품,
  COUNT(CASE WHEN type = 'wanted' THEN 1 END) as 구하기_상품
FROM products;

-- 🎯 6. RLS 정책 (간단히)
SELECT 
  COUNT(*) as RLS_정책_개수,
  string_agg(policyname, ', ') as 정책명들
FROM pg_policies 
WHERE tablename = 'products';

-- 🎯 7. 테이블 크기
SELECT 
  pg_size_pretty(pg_total_relation_size('products')) as 총_테이블_크기,
  pg_size_pretty(pg_relation_size('products')) as 데이터_크기,
  pg_size_pretty(pg_total_relation_size('products') - pg_relation_size('products')) as 인덱스_크기;

-- 🎯 8. 최근 데이터 샘플 (상위 3개)
SELECT 
  '최근 등록된 상품 3개' as 구분,
  id,
  title,
  type,
  price,
  array_length(images, 1) as 이미지수,
  array_length(videos, 1) as 동영상수,
  created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 3; 