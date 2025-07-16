-- 🆓 Supabase 무료 플랜용 백업 솔루션

-- ==================== 백업 생성 ====================
-- 1단계: 현재 데이터를 백업 테이블로 복사
CREATE TABLE products_backup_20250716 AS SELECT * FROM products;

-- 2단계: 백업 확인
SELECT 
  '백업 완료! 총 ' || COUNT(*) || '개 상품이 백업되었습니다.' as backup_status
FROM products_backup_20250716;

-- 3단계: 백업 데이터 조회 (필요시)
-- SELECT * FROM products_backup_20250716;

-- ==================== 새 스키마 적용 ====================
-- 4단계: 기존 테이블 삭제 및 새 테이블 생성
-- (여기에 새로운 스키마 코드 입력)

-- ==================== 데이터 복원 ====================
-- 5단계: 백업에서 데이터 복원
INSERT INTO products (
  id, title, description, price, original_price, usage_period,
  contact, seller_name, seller_id, status, type, category,
  images, view_count, reserved_by_id, reserved_by_name,
  reserved_by_phone, reserved_at, created_at, updated_at
)
SELECT 
  id, title, description, price, original_price, usage_period,
  contact, seller_name, seller_id, status,
  COALESCE(type, 'sale') as type, -- 새 컬럼에 기본값 설정
  category,
  COALESCE(images, '{}') as images,
  view_count, reserved_by_id, reserved_by_name,
  reserved_by_phone, reserved_at, created_at, updated_at
FROM products_backup_20250716;

-- 6단계: 복원 확인
SELECT 
  '복원 완료! 총 ' || COUNT(*) || '개 상품이 복원되었습니다.' as restore_status
FROM products;

-- 7단계: 백업 테이블 삭제 (확인 후 수동 실행)
-- DROP TABLE products_backup_20250716;

-- ==================== 간편 백업 조회 ====================
-- 백업 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'products_backup_%'
ORDER BY table_name; 