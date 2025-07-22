-- =============================================
-- KRC 당근 (Carrot2) Supabase 백업 스크립트
-- 생성일: 2025-01-22
-- 목적: Supabase SQL Editor에서 직접 실행 가능한 백업
-- 사용법: Supabase Dashboard > SQL Editor에서 실행
-- =============================================

-- 백업 시작 시간 기록
SELECT 'KRC 당근 백업 시작: ' || NOW() as backup_start;

-- =============================================
-- 1. 데이터베이스 전체 통계
-- =============================================

SELECT 'Step 1: 데이터베이스 통계 조회' as step;

-- 전체 데이터 현황
SELECT 
  'SUMMARY' as section,
  'users' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM users
UNION ALL
SELECT 
  'SUMMARY' as section,
  'products' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM products
UNION ALL
SELECT 
  'SUMMARY' as section,
  'storage_objects' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM storage.objects 
WHERE bucket_id = 'product-images';

-- =============================================
-- 2. USERS 테이블 백업 데이터
-- =============================================

SELECT 'Step 2: USERS 테이블 데이터' as step;

-- users 전체 데이터 (복사해서 Excel/CSV로 저장)
SELECT 
  '=== USERS TABLE DATA START ===' as separator
UNION ALL
SELECT 'id,name,phone,created_at,updated_at' as csv_header
UNION ALL
SELECT 
  id::text || ',' || 
  '"' || REPLACE(name, '"', '""') || '",' ||
  '"' || phone || '",' ||
  created_at::text || ',' ||
  updated_at::text
FROM users 
ORDER BY created_at
UNION ALL
SELECT '=== USERS TABLE DATA END ===' as separator;

-- =============================================
-- 3. PRODUCTS 테이블 백업 데이터
-- =============================================

SELECT 'Step 3: PRODUCTS 테이블 데이터' as step;

-- products 전체 데이터 (이미지/동영상 URL은 | 구분자로 연결)
SELECT 
  '=== PRODUCTS TABLE DATA START ===' as separator
UNION ALL
SELECT 'id,title,description,price,original_price,usage_period,contact,seller_name,seller_id,status,type,category,images,videos,view_count,reserved_by_id,reserved_by_name,reserved_by_phone,reserved_at,created_at,updated_at' as csv_header
UNION ALL
SELECT 
  id::text || ',' || 
  '"' || REPLACE(REPLACE(title, '"', '""'), E'\n', ' ') || '",' ||
  '"' || REPLACE(REPLACE(description, '"', '""'), E'\n', ' ') || '",' ||
  COALESCE(price::text, '') || ',' ||
  COALESCE(original_price::text, '') || ',' ||
  '"' || COALESCE(usage_period, '') || '",' ||
  '"' || contact || '",' ||
  '"' || seller_name || '",' ||
  COALESCE(seller_id::text, '') || ',' ||
  status || ',' ||
  type || ',' ||
  '"' || COALESCE(category, '') || '",' ||
  '"' || COALESCE(array_to_string(images, '|'), '') || '",' ||
  '"' || COALESCE(array_to_string(videos, '|'), '') || '",' ||
  COALESCE(view_count::text, '0') || ',' ||
  COALESCE(reserved_by_id::text, '') || ',' ||
  '"' || COALESCE(reserved_by_name, '') || '",' ||
  '"' || COALESCE(reserved_by_phone, '') || '",' ||
  COALESCE(reserved_at::text, '') || ',' ||
  created_at::text || ',' ||
  updated_at::text
FROM products 
ORDER BY created_at
UNION ALL
SELECT '=== PRODUCTS TABLE DATA END ===' as separator;

-- =============================================
-- 4. SHARE_REQUESTS 테이블 백업 (있는 경우)
-- =============================================

SELECT 'Step 4: SHARE_REQUESTS 테이블 데이터' as step;

-- share_requests 데이터 (테이블이 존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'share_requests') THEN
    RAISE NOTICE 'share_requests 테이블이 존재합니다.';
  ELSE
    RAISE NOTICE 'share_requests 테이블이 존재하지 않습니다.';
  END IF;
END $$;

-- share_requests 데이터 조회 (테이블이 있으면 실행)
/*
SELECT 
  '=== SHARE_REQUESTS TABLE DATA START ===' as separator
UNION ALL
SELECT 'id,product_id,requester_name,requester_id,reason,created_at' as csv_header
UNION ALL
SELECT 
  id::text || ',' || 
  product_id::text || ',' ||
  '"' || requester_name || '",' ||
  requester_id::text || ',' ||
  '"' || REPLACE(REPLACE(reason, '"', '""'), E'\n', ' ') || '",' ||
  created_at::text
FROM share_requests 
ORDER BY created_at
UNION ALL
SELECT '=== SHARE_REQUESTS TABLE DATA END ===' as separator;
*/

-- =============================================
-- 5. STORAGE 파일 정보
-- =============================================

SELECT 'Step 5: Storage 파일 정보' as step;

-- Storage objects 정보
SELECT 
  '=== STORAGE OBJECTS START ===' as separator
UNION ALL
SELECT 'id,name,bucket_id,owner,created_at,updated_at' as csv_header
UNION ALL
SELECT 
  COALESCE(id::text, '') || ',' ||
  '"' || name || '",' ||
  bucket_id || ',' ||
  COALESCE(owner::text, '') || ',' ||
  created_at::text || ',' ||
  COALESCE(updated_at::text, '')
FROM storage.objects 
WHERE bucket_id = 'product-images'
ORDER BY created_at
UNION ALL
SELECT '=== STORAGE OBJECTS END ===' as separator;

-- =============================================
-- 6. 상품-이미지 매핑 정보
-- =============================================

SELECT 'Step 6: 상품-이미지 매핑 정보' as step;

-- 각 상품의 이미지 URL 개별 행으로 전개
SELECT 
  '=== PRODUCT IMAGES MAPPING START ===' as separator
UNION ALL
SELECT 'product_id,title,seller_name,image_url,created_at' as csv_header
UNION ALL
SELECT 
  p.id::text || ',' ||
  '"' || REPLACE(p.title, '"', '""') || '",' ||
  '"' || p.seller_name || '",' ||
  '"' || image_url || '",' ||
  p.created_at::text
FROM products p, 
     unnest(p.images) as image_url
WHERE p.images IS NOT NULL AND array_length(p.images, 1) > 0
ORDER BY p.created_at, p.id
UNION ALL
SELECT '=== PRODUCT IMAGES MAPPING END ===' as separator;

-- =============================================
-- 7. 테이블 구조 정보
-- =============================================

SELECT 'Step 7: 테이블 구조 정보' as step;

-- 컬럼 정보
SELECT 
  '=== TABLE COLUMNS INFO START ===' as separator
UNION ALL
SELECT 'table_name,column_name,data_type,is_nullable,column_default' as csv_header
UNION ALL
SELECT 
  table_name || ',' ||
  column_name || ',' ||
  data_type || ',' ||
  is_nullable || ',' ||
  '"' || COALESCE(column_default, '') || '"'
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'products', 'share_requests')
ORDER BY table_name, ordinal_position
UNION ALL
SELECT '=== TABLE COLUMNS INFO END ===' as separator;

-- =============================================
-- 8. 통계 및 요약
-- =============================================

SELECT 'Step 8: 통계 및 요약' as step;

-- 카테고리별 상품 통계
SELECT 
  '카테고리별 통계:' as info,
  category as category_name,
  COUNT(*) as product_count,
  COUNT(*) FILTER (WHERE status = 'selling') as selling_count,
  ROUND(AVG(price)::numeric, 0) as avg_price
FROM products 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY product_count DESC;

-- 타입별 상품 통계
SELECT 
  '타입별 통계:' as info,
  type as product_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'selling') as selling_count
FROM products 
GROUP BY type
ORDER BY count DESC;

-- 상태별 상품 통계
SELECT 
  '상태별 통계:' as info,
  status as product_status,
  COUNT(*) as count
FROM products 
GROUP BY status
ORDER BY count DESC;

-- 이미지 보유 통계
SELECT 
  '이미지 통계:' as info,
  CASE 
    WHEN images IS NULL OR array_length(images, 1) = 0 THEN '이미지 없음'
    WHEN array_length(images, 1) = 1 THEN '이미지 1장'
    WHEN array_length(images, 1) <= 3 THEN '이미지 2-3장'
    ELSE '이미지 4장 이상'
  END as image_count_range,
  COUNT(*) as product_count
FROM products 
GROUP BY 
  CASE 
    WHEN images IS NULL OR array_length(images, 1) = 0 THEN '이미지 없음'
    WHEN array_length(images, 1) = 1 THEN '이미지 1장'
    WHEN array_length(images, 1) <= 3 THEN '이미지 2-3장'
    ELSE '이미지 4장 이상'
  END
ORDER BY product_count DESC;

-- =============================================
-- 백업 완료 메시지
-- =============================================

SELECT 
  '🎉 KRC 당근 백업 완료!' as result,
  '위의 데이터를 복사해서 CSV 파일로 저장하세요.' as instruction,
  NOW() as backup_completed_at;

SELECT '📋 백업 완료 안내:' as guide
UNION ALL SELECT '1. 각 섹션의 데이터를 복사해서 별도 파일로 저장'
UNION ALL SELECT '2. === START ===와 === END === 사이의 데이터만 복사'
UNION ALL SELECT '3. 첫 번째 줄은 CSV 헤더입니다'
UNION ALL SELECT '4. Excel이나 텍스트 에디터에 붙여넣기 후 .csv 확장자로 저장'
UNION ALL SELECT '5. 복원할 때는 carrot2_restore_backup.sql 사용';

-- 백업 스크립트 종료
SELECT '===== KRC 당근 백업 스크립트 실행 완료 =====' as final_message; 