-- =============================================
-- KRC 당근 데이터베이스 백업 스크립트
-- 생성일: 2025-01-17
-- 목적: 동영상 업로드 기능 배포 전 데이터 백업
-- =============================================

-- 1. 사용자 데이터 백업
SELECT 'users 테이블 백업 시작' as backup_status;
\copy (SELECT * FROM users ORDER BY created_at) to 'users_backup_20250117.csv' with csv header;

-- 2. 상품 데이터 백업  
SELECT 'products 테이블 백업 시작' as backup_status;
\copy (SELECT * FROM products ORDER BY created_at) to 'products_backup_20250117.csv' with csv header;

-- 3. 나눔 신청 데이터 백업 (있는 경우)
SELECT 'share_requests 테이블 백업 시작' as backup_status;
\copy (SELECT * FROM share_requests ORDER BY created_at) to 'share_requests_backup_20250117.csv' with csv header;

-- 4. 데이터 통계 조회
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM users
UNION ALL
SELECT 
    'products' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record  
FROM products;

-- 5. 현재 products 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 6. 이미지가 있는 상품 개수 확인
SELECT 
    '이미지 있는 상품' as category,
    COUNT(*) as count
FROM products 
WHERE images IS NOT NULL AND array_length(images, 1) > 0
UNION ALL
SELECT 
    '이미지 없는 상품' as category,
    COUNT(*) as count
FROM products 
WHERE images IS NULL OR array_length(images, 1) = 0 OR array_length(images, 1) IS NULL;

-- 7. Storage 파일 정보 백업 (Supabase Storage objects)
SELECT 'storage.objects 백업 시작' as backup_status;
\copy (SELECT name, bucket_id, owner, created_at, updated_at FROM storage.objects WHERE bucket_id = 'product-images' ORDER BY created_at) to 'storage_objects_backup_20250117.csv' with csv header; 