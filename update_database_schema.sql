-- Carrot2 프로젝트 - Supabase 데이터베이스 스키마 업데이트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 먼저 기존 테이블이 있는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  usage_period VARCHAR(100),
  contact VARCHAR(50) NOT NULL,
  seller_name VARCHAR(100) NOT NULL,
  seller_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'selling' CHECK (status IN ('selling', 'reserved', 'sold')),
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 누락된 컬럼들 추가 (이미 존재하는 경우 에러 무시)
DO $$ 
BEGIN
    -- type 컬럼 추가 (sale/share 구분)
    BEGIN
        ALTER TABLE products ADD COLUMN type VARCHAR(10) DEFAULT 'sale' CHECK (type IN ('sale', 'share'));
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;

    -- category 컬럼 추가
    BEGIN
        ALTER TABLE products ADD COLUMN category VARCHAR(100);
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;

    -- original_price 컬럼 추가
    BEGIN
        ALTER TABLE products ADD COLUMN original_price DECIMAL(10,2);
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;

    -- view_count 컬럼 추가
    BEGIN
        ALTER TABLE products ADD COLUMN view_count INTEGER DEFAULT 0;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;

    -- 예약자 정보 컬럼들 추가
    BEGIN
        ALTER TABLE products ADD COLUMN reserved_by_id UUID;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN reserved_by_name VARCHAR(100);
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN reserved_by_phone VARCHAR(20);
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN reserved_at TIMESTAMP WITH TIME ZONE;
    EXCEPTION 
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- 3. 인덱스 생성 (이미 존재하는 경우 에러 무시)
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 4. 관리자 사용자 생성 (이미 존재하는 경우 업데이트)
INSERT INTO users (name, phone, created_at, updated_at)
VALUES ('관리자', 'admin', NOW(), NOW())
ON CONFLICT (phone) 
DO UPDATE SET 
    name = EXCLUDED.name,
    updated_at = NOW();

-- 스키마 업데이트 완료
SELECT 'Database schema updated successfully!' as message; 