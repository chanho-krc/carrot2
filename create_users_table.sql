-- =============================================
-- users 테이블 생성 스크립트
-- 관리자가 사용자를 선택해서 상품을 등록할 수 있도록 함
-- =============================================

-- 1. users 테이블이 이미 존재하는지 확인
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'users'
    ) 
    THEN 'users 테이블이 이미 존재합니다.'
    ELSE 'users 테이블이 없습니다. 생성이 필요합니다.'
  END as table_status;

-- 2. users 테이블 생성 (존재하지 않는 경우에만)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 4. updated_at 자동 업데이트 함수 (이미 있으면 건너뜀)
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_users_updated_at_column();

-- 6. RLS 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 정책들 삭제 (에러 방지)
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON users;

-- 새 정책 생성 (모든 사용자 접근 허용)
CREATE POLICY "Enable read access for all users" ON users 
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON users 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON users 
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON users 
  FOR DELETE USING (true);

-- 7. 샘플 사용자 데이터 삽입 (테스트용)
INSERT INTO users (name, phone) VALUES 
  ('김철수', '010-1234-5678'),
  ('이영희', '010-9876-5432'),
  ('박민수', '010-5555-1234'),
  ('최영미', '010-7777-8888'),
  ('정대한', '010-3333-4444')
ON CONFLICT (phone) DO NOTHING; -- 이미 존재하면 건너뜀

-- 8. 결과 확인
SELECT 
  'SUCCESS: users 테이블이 생성되었습니다!' as result,
  COUNT(*) || '명의 사용자가 있습니다.' as user_count
FROM users;

-- 9. 사용자 목록 조회
SELECT 
  id,
  name,
  phone,
  created_at
FROM users 
ORDER BY name;

-- 10. 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position; 