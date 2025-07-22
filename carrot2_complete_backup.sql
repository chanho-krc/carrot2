-- =============================================
-- KRC 당근 (Carrot2) 완전 백업 스크립트
-- 생성일: 2025-01-22
-- 목적: Supabase의 모든 테이블, 데이터, 이미지 등 전체 백업
-- 사용법: 
--   1. 백업: 이 스크립트를 Supabase SQL Editor에서 실행
--   2. 복원: carrot2_restore_backup.sql 스크립트 사용
-- =============================================

-- 백업 시작 시간 기록
SELECT 'KRC 당근 완전 백업 시작: ' || NOW() as backup_start;

-- =============================================
-- 1. 데이터베이스 스키마 정보 백업
-- =============================================

-- 테이블 목록 조회
SELECT 'Step 1: 테이블 구조 백업' as step;
\copy (
  SELECT 
    table_name,
    table_type,
    is_insertable_into,
    is_typed
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('users', 'products', 'share_requests')
  ORDER BY table_name
) to 'backup_tables_info.csv' with csv header;

-- 모든 컬럼 정보 백업
\copy (
  SELECT 
    table_name,
    column_name,
    ordinal_position,
    column_default,
    is_nullable,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name IN ('users', 'products', 'share_requests')
  ORDER BY table_name, ordinal_position
) to 'backup_columns_info.csv' with csv header;

-- =============================================
-- 2. 사용자 데이터 백업
-- =============================================

SELECT 'Step 2: users 테이블 데이터 백업' as step;

-- users 테이블 전체 데이터 백업
\copy (
  SELECT 
    id,
    name,
    phone,
    created_at,
    updated_at
  FROM users 
  ORDER BY created_at
) to 'backup_users_data.csv' with csv header;

-- users 테이블 통계
\copy (
  SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT phone) as unique_phones,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as records_last_30_days
  FROM users
) to 'backup_users_stats.csv' with csv header;

-- =============================================
-- 3. 상품 데이터 백업
-- =============================================

SELECT 'Step 3: products 테이블 데이터 백업' as step;

-- products 테이블 전체 데이터 백업
\copy (
  SELECT 
    id,
    title,
    description,
    price,
    original_price,
    usage_period,
    contact,
    seller_name,
    seller_id,
    status,
    type,
    category,
    array_to_string(images, '|') as images_concatenated,
    array_to_string(videos, '|') as videos_concatenated,
    view_count,
    reserved_by_id,
    reserved_by_name,
    reserved_by_phone,
    reserved_at,
    created_at,
    updated_at
  FROM products 
  ORDER BY created_at
) to 'backup_products_data.csv' with csv header;

-- products 테이블 통계
\copy (
  SELECT 
    'products' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'selling') as selling_count,
    COUNT(*) FILTER (WHERE status = 'reserved') as reserved_count,
    COUNT(*) FILTER (WHERE status = 'sold') as sold_count,
    COUNT(*) FILTER (WHERE type = 'sale') as sale_count,
    COUNT(*) FILTER (WHERE type = 'share') as share_count,
    COUNT(*) FILTER (WHERE type = 'wanted') as wanted_count,
    COUNT(*) FILTER (WHERE images IS NOT NULL AND array_length(images, 1) > 0) as products_with_images,
    COUNT(*) FILTER (WHERE videos IS NOT NULL AND array_length(videos, 1) > 0) as products_with_videos,
    AVG(price) as average_price,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
  FROM products
) to 'backup_products_stats.csv' with csv header;

-- 카테고리별 통계
\copy (
  SELECT 
    category,
    COUNT(*) as product_count,
    COUNT(*) FILTER (WHERE status = 'selling') as selling_count,
    AVG(price) as avg_price,
    MAX(price) as max_price,
    MIN(price) as min_price
  FROM products 
  WHERE category IS NOT NULL
  GROUP BY category
  ORDER BY product_count DESC
) to 'backup_products_by_category.csv' with csv header;

-- =============================================
-- 4. 나눔 신청 데이터 백업
-- =============================================

SELECT 'Step 4: share_requests 테이블 데이터 백업' as step;

-- share_requests 테이블 백업 (테이블이 존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'share_requests') THEN
    -- share_requests 전체 데이터 백업
    EXECUTE '
    \copy (
      SELECT 
        id,
        product_id,
        requester_name,
        requester_id,
        reason,
        created_at
      FROM share_requests 
      ORDER BY created_at
    ) to ''backup_share_requests_data.csv'' with csv header';
    
    -- share_requests 통계
    EXECUTE '
    \copy (
      SELECT 
        ''share_requests'' as table_name,
        COUNT(*) as total_records,
        COUNT(DISTINCT product_id) as unique_products,
        COUNT(DISTINCT requester_id) as unique_requesters,
        MIN(created_at) as oldest_record,
        MAX(created_at) as newest_record
      FROM share_requests
    ) to ''backup_share_requests_stats.csv'' with csv header';
    
    RAISE NOTICE 'share_requests 테이블 백업 완료';
  ELSE
    RAISE NOTICE 'share_requests 테이블이 존재하지 않습니다';
  END IF;
END $$;

-- =============================================
-- 5. Storage 정보 백업
-- =============================================

SELECT 'Step 5: Storage 파일 정보 백업' as step;

-- Storage objects 정보 백업
\copy (
  SELECT 
    id,
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
  FROM storage.objects 
  WHERE bucket_id = 'product-images'
  ORDER BY created_at
) to 'backup_storage_objects.csv' with csv header;

-- Storage buckets 정보 백업
\copy (
  SELECT 
    id,
    name,
    owner,
    created_at,
    updated_at,
    public,
    avif_autodetection,
    file_size_limit,
    allowed_mime_types
  FROM storage.buckets
  ORDER BY created_at
) to 'backup_storage_buckets.csv' with csv header;

-- 이미지 URL과 상품 매핑 정보
\copy (
  SELECT 
    p.id as product_id,
    p.title,
    p.seller_name,
    unnest(p.images) as image_url,
    p.created_at
  FROM products p 
  WHERE p.images IS NOT NULL AND array_length(p.images, 1) > 0
  ORDER BY p.created_at, p.id
) to 'backup_product_images_mapping.csv' with csv header;

-- 동영상 URL과 상품 매핑 정보
\copy (
  SELECT 
    p.id as product_id,
    p.title,
    p.seller_name,
    unnest(p.videos) as video_url,
    p.created_at
  FROM products p 
  WHERE p.videos IS NOT NULL AND array_length(p.videos, 1) > 0
  ORDER BY p.created_at, p.id
) to 'backup_product_videos_mapping.csv' with csv header;

-- =============================================
-- 6. 데이터베이스 메타데이터 백업
-- =============================================

SELECT 'Step 6: 데이터베이스 메타데이터 백업' as step;

-- 인덱스 정보 백업
\copy (
  SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename IN ('users', 'products', 'share_requests')
  ORDER BY tablename, indexname
) to 'backup_indexes.csv' with csv header;

-- 제약조건 정보 백업
\copy (
  SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_schema = 'public' 
  AND tc.table_name IN ('users', 'products', 'share_requests')
  ORDER BY tc.table_name, tc.constraint_name
) to 'backup_constraints.csv' with csv header;

-- RLS 정책 정보 백업
\copy (
  SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename IN ('users', 'products', 'share_requests')
  ORDER BY tablename, policyname
) to 'backup_rls_policies.csv' with csv header;

-- =============================================
-- 7. 시스템 정보 및 통계
-- =============================================

SELECT 'Step 7: 시스템 정보 및 통계 생성' as step;

-- 전체 데이터베이스 통계
\copy (
  SELECT 
    'DATABASE_STATS' as info_type,
    'Total Tables' as metric,
    COUNT(*)::text as value
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  UNION ALL
  SELECT 
    'DATABASE_STATS' as info_type,
    'Backup Date' as metric,
    NOW()::text as value
  UNION ALL
  SELECT 
    'DATABASE_STATS' as info_type,
    'Database Version' as metric,
    version() as value
) to 'backup_system_info.csv' with csv header;

-- 백업 완료 요약
\copy (
  SELECT 
    'BACKUP_SUMMARY' as section,
    'users' as table_name,
    COUNT(*)::text as record_count,
    'OK' as status
  FROM users
  UNION ALL
  SELECT 
    'BACKUP_SUMMARY' as section,
    'products' as table_name,
    COUNT(*)::text as record_count,
    'OK' as status
  FROM products
  UNION ALL
  SELECT 
    'BACKUP_SUMMARY' as section,
    'storage_objects' as table_name,
    COUNT(*)::text as record_count,
    'OK' as status
  FROM storage.objects 
  WHERE bucket_id = 'product-images'
) to 'backup_summary.csv' with csv header;

-- =============================================
-- 백업 완료 메시지
-- =============================================

SELECT 
  'KRC 당근 완전 백업 완료!' as result,
  'backup_*.csv 파일들을 다운로드하여 안전한 곳에 보관하세요.' as instruction,
  NOW() as backup_completed_at;

-- 생성된 백업 파일 목록
SELECT 'Generated Backup Files:' as info;
SELECT '1. backup_tables_info.csv - 테이블 구조 정보' as file_info
UNION ALL SELECT '2. backup_columns_info.csv - 컬럼 상세 정보'
UNION ALL SELECT '3. backup_users_data.csv - 사용자 데이터'
UNION ALL SELECT '4. backup_users_stats.csv - 사용자 통계'
UNION ALL SELECT '5. backup_products_data.csv - 상품 데이터'
UNION ALL SELECT '6. backup_products_stats.csv - 상품 통계'
UNION ALL SELECT '7. backup_products_by_category.csv - 카테고리별 통계'
UNION ALL SELECT '8. backup_share_requests_data.csv - 나눔 신청 데이터'
UNION ALL SELECT '9. backup_share_requests_stats.csv - 나눔 신청 통계'
UNION ALL SELECT '10. backup_storage_objects.csv - Storage 파일 정보'
UNION ALL SELECT '11. backup_storage_buckets.csv - Storage 버킷 정보'
UNION ALL SELECT '12. backup_product_images_mapping.csv - 상품-이미지 매핑'
UNION ALL SELECT '13. backup_product_videos_mapping.csv - 상품-동영상 매핑'
UNION ALL SELECT '14. backup_indexes.csv - 인덱스 정보'
UNION ALL SELECT '15. backup_constraints.csv - 제약조건 정보'
UNION ALL SELECT '16. backup_rls_policies.csv - RLS 정책 정보'
UNION ALL SELECT '17. backup_system_info.csv - 시스템 정보'
UNION ALL SELECT '18. backup_summary.csv - 백업 요약';

-- 백업 스크립트 종료
SELECT '===== KRC 당근 백업 스크립트 실행 완료 =====' as final_message; 