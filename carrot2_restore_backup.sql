-- =============================================
-- KRC 당근 (Carrot2) 완전 복원 스크립트
-- 생성일: 2025-01-22
-- 목적: 백업된 CSV 파일들로부터 Supabase 데이터베이스 완전 복원
-- 사용법: 
--   1. 백업 CSV 파일들을 Supabase Storage 또는 로컬에 준비
--   2. 이 스크립트를 Supabase SQL Editor에서 실행
--   3. 데이터 무결성 검증
-- =============================================

-- 복원 시작 시간 기록
SELECT 'KRC 당근 완전 복원 시작: ' || NOW() as restore_start;

-- =============================================
-- 1. 기존 데이터 백업 (안전장치)
-- =============================================

SELECT 'Step 1: 기존 데이터 임시 백업' as step;

-- 기존 데이터를 임시 테이블로 백업
CREATE TABLE IF NOT EXISTS temp_users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS temp_products_backup AS SELECT * FROM products;

-- 기존 데이터 개수 확인
SELECT 
  'users' as table_name,
  COUNT(*) as existing_records
FROM users
UNION ALL
SELECT 
  'products' as table_name,
  COUNT(*) as existing_records
FROM products;

-- =============================================
-- 2. 테이블 구조 재생성
-- =============================================

SELECT 'Step 2: 테이블 구조 재생성' as step;

-- 기존 테이블 삭제 (주의: 실제 운영환경에서는 신중하게 사용)
-- DROP TABLE IF EXISTS share_requests CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- products 테이블 생성
CREATE TABLE IF NOT EXISTS products (
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
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  reserved_by_id UUID,
  reserved_by_name VARCHAR(100),
  reserved_by_phone VARCHAR(20),
  reserved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- share_requests 테이블 생성
CREATE TABLE IF NOT EXISTS share_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  requester_name VARCHAR(100) NOT NULL,
  requester_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. 인덱스 생성
-- =============================================

SELECT 'Step 3: 인덱스 생성' as step;

-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- products 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count);

-- share_requests 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_share_requests_product_id ON share_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_share_requests_requester_id ON share_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_share_requests_created_at ON share_requests(created_at);

-- =============================================
-- 4. 트리거 및 함수 생성
-- =============================================

SELECT 'Step 4: 트리거 및 함수 생성' as step;

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- users 테이블 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- products 테이블 트리거
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- view_count 증가 함수
CREATE OR REPLACE FUNCTION increment_view_count(product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET view_count = view_count + 1 
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. RLS 정책 설정
-- =============================================

SELECT 'Step 5: RLS 정책 설정' as step;

-- users 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON users;

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON users FOR DELETE USING (true);

-- products 테이블 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable update for all users" ON products;
DROP POLICY IF EXISTS "Enable delete for all users" ON products;

CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON products FOR DELETE USING (true);

-- share_requests 테이블 RLS
ALTER TABLE share_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON share_requests;
DROP POLICY IF EXISTS "Enable insert for all users" ON share_requests;
DROP POLICY IF EXISTS "Enable update for all users" ON share_requests;
DROP POLICY IF EXISTS "Enable delete for all users" ON share_requests;

CREATE POLICY "Enable read access for all users" ON share_requests FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON share_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON share_requests FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON share_requests FOR DELETE USING (true);

-- =============================================
-- 6. Storage 설정
-- =============================================

SELECT 'Step 6: Storage 설정' as step;

-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책 설정
DO $$
BEGIN
  -- 기존 정책 삭제
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
    RAISE NOTICE 'Storage policies setup completed or error: %', SQLERRM;
END $$;

-- =============================================
-- 7. 데이터 복원 (CSV 파일에서 가져오기)
-- =============================================

SELECT 'Step 7: 백업 데이터 복원' as step;

-- 주의: 실제 복원 시에는 CSV 파일 경로를 올바르게 설정해야 합니다.
-- 다음 명령어들은 백업 CSV 파일들이 접근 가능한 위치에 있어야 합니다.

/*
-- users 데이터 복원
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
\copy users(id, name, phone, created_at, updated_at) FROM 'backup_users_data.csv' WITH CSV HEADER;

-- products 데이터 복원 (이미지/동영상 배열 처리 필요)
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

-- 임시 테이블로 먼저 데이터 로드
CREATE TEMP TABLE temp_products_restore (
  id UUID,
  title VARCHAR(200),
  description TEXT,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  usage_period VARCHAR(100),
  contact VARCHAR(100),
  seller_name VARCHAR(100),
  seller_id UUID,
  status VARCHAR(20),
  type VARCHAR(10),
  category VARCHAR(100),
  images_concatenated TEXT,
  videos_concatenated TEXT,
  view_count INTEGER,
  reserved_by_id UUID,
  reserved_by_name VARCHAR(100),
  reserved_by_phone VARCHAR(20),
  reserved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

\copy temp_products_restore FROM 'backup_products_data.csv' WITH CSV HEADER;

-- 배열 필드 처리하여 실제 테이블에 삽입
INSERT INTO products (
  id, title, description, price, original_price, usage_period,
  contact, seller_name, seller_id, status, type, category,
  images, videos, view_count, reserved_by_id, reserved_by_name,
  reserved_by_phone, reserved_at, created_at, updated_at
)
SELECT 
  id, title, description, price, original_price, usage_period,
  contact, seller_name, seller_id, status, type, category,
  CASE 
    WHEN images_concatenated IS NOT NULL AND images_concatenated != '' 
    THEN string_to_array(images_concatenated, '|')
    ELSE '{}'::TEXT[]
  END as images,
  CASE 
    WHEN videos_concatenated IS NOT NULL AND videos_concatenated != '' 
    THEN string_to_array(videos_concatenated, '|')
    ELSE '{}'::TEXT[]
  END as videos,
  view_count, reserved_by_id, reserved_by_name,
  reserved_by_phone, reserved_at, created_at, updated_at
FROM temp_products_restore;

-- share_requests 데이터 복원 (테이블이 존재하는 경우)
TRUNCATE TABLE share_requests RESTART IDENTITY CASCADE;
\copy share_requests(id, product_id, requester_name, requester_id, reason, created_at) FROM 'backup_share_requests_data.csv' WITH CSV HEADER;
*/

-- 수동 복원 안내 메시지
SELECT 'CSV 파일 복원은 수동으로 실행해야 합니다:' as notice;
SELECT '1. backup_users_data.csv를 users 테이블에 복원' as instruction
UNION ALL SELECT '2. backup_products_data.csv를 products 테이블에 복원'
UNION ALL SELECT '3. backup_share_requests_data.csv를 share_requests 테이블에 복원'
UNION ALL SELECT '4. 이미지/동영상 배열 필드는 수동 처리 필요';

-- =============================================
-- 8. 데이터 무결성 검증
-- =============================================

SELECT 'Step 8: 데이터 무결성 검증' as step;

-- 테이블별 레코드 수 확인
SELECT 
  'users' as table_name,
  COUNT(*) as record_count,
  'restored' as status
FROM users
UNION ALL
SELECT 
  'products' as table_name,
  COUNT(*) as record_count,
  'restored' as status
FROM products
UNION ALL
SELECT 
  'share_requests' as table_name,
  COUNT(*) as record_count,
  'restored' as status
FROM share_requests;

-- 필수 필드 null 체크
SELECT 
  'Data Validation:' as check_type,
  'Users with missing name: ' || COUNT(*) as result
FROM users 
WHERE name IS NULL OR name = ''
UNION ALL
SELECT 
  'Data Validation:' as check_type,
  'Products with missing title: ' || COUNT(*) as result
FROM products 
WHERE title IS NULL OR title = ''
UNION ALL
SELECT 
  'Data Validation:' as check_type,
  'Products with invalid status: ' || COUNT(*) as result
FROM products 
WHERE status NOT IN ('selling', 'reserved', 'sold');

-- =============================================
-- 9. 시퀀스 및 ID 재설정
-- =============================================

SELECT 'Step 9: ID 시퀀스 재설정' as step;

-- UUID 기반이므로 특별한 시퀀스 재설정은 불필요
-- 하지만 필요시 다음과 같이 처리 가능:
-- SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- =============================================
-- 복원 완료 메시지
-- =============================================

SELECT 
  'KRC 당근 데이터베이스 복원 완료!' as result,
  '데이터 무결성을 확인하고 애플리케이션을 테스트하세요.' as instruction,
  NOW() as restore_completed_at;

-- 복원된 데이터 요약
SELECT 
  '복원 요약:' as summary,
  (SELECT COUNT(*) FROM users) || '명의 사용자' as users_restored,
  (SELECT COUNT(*) FROM products) || '개의 상품' as products_restored,
  (SELECT COUNT(*) FROM share_requests) || '개의 나눔 신청' as share_requests_restored;

-- 임시 백업 테이블 정리 안내
SELECT 'temp_users_backup, temp_products_backup 테이블을 확인 후 삭제하세요.' as cleanup_notice;

-- 복원 스크립트 종료
SELECT '===== KRC 당근 복원 스크립트 실행 완료 =====' as final_message; 