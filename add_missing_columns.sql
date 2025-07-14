-- Carrot2 - 기존 테이블에 누락된 컬럼 추가
-- products, users 테이블이 이미 존재하는 경우 사용

-- 누락된 컬럼들 추가 (이미 존재하는 경우 에러 무시)
DO $$ 
BEGIN
    -- type 컬럼 추가 (판매/나눔 구분)
    BEGIN
        ALTER TABLE products ADD COLUMN type VARCHAR(10) DEFAULT 'sale' CHECK (type IN ('sale', 'share'));
        RAISE NOTICE 'Added type column';
    EXCEPTION 
        WHEN duplicate_column THEN 
        RAISE NOTICE 'type column already exists';
    END;

    -- category 컬럼 추가
    BEGIN
        ALTER TABLE products ADD COLUMN category VARCHAR(100);
        RAISE NOTICE 'Added category column';
    EXCEPTION 
        WHEN duplicate_column THEN 
        RAISE NOTICE 'category column already exists';
    END;

    -- original_price 컬럼 추가
    BEGIN
        ALTER TABLE products ADD COLUMN original_price DECIMAL(10,2);
        RAISE NOTICE 'Added original_price column';
    EXCEPTION 
        WHEN duplicate_column THEN 
        RAISE NOTICE 'original_price column already exists';
    END;

    -- view_count 컬럼 추가
    BEGIN
        ALTER TABLE products ADD COLUMN view_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added view_count column';
    EXCEPTION 
        WHEN duplicate_column THEN 
        RAISE NOTICE 'view_count column already exists';
    END;

    -- 예약자 정보 컬럼들 추가
    BEGIN
        ALTER TABLE products ADD COLUMN reserved_by_id UUID;
        RAISE NOTICE 'Added reserved_by_id column';
    EXCEPTION 
        WHEN duplicate_column THEN 
        RAISE NOTICE 'reserved_by_id column already exists';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN reserved_by_name VARCHAR(100);
        RAISE NOTICE 'Added reserved_by_name column';
    EXCEPTION 
        WHEN duplicate_column THEN 
        RAISE NOTICE 'reserved_by_name column already exists';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN reserved_by_phone VARCHAR(20);
        RAISE NOTICE 'Added reserved_by_phone column';
    EXCEPTION 
        WHEN duplicate_column THEN 
        RAISE NOTICE 'reserved_by_phone column already exists';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN reserved_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added reserved_at column';
    EXCEPTION 
        WHEN duplicate_column THEN 
        RAISE NOTICE 'reserved_at column already exists';
    END;

END $$;

-- 필요한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- 관리자 사용자 생성 (이미 존재하는 경우 업데이트)
INSERT INTO users (name, phone, created_at, updated_at)
VALUES ('관리자', 'admin', NOW(), NOW())
ON CONFLICT (phone) 
DO UPDATE SET 
    name = EXCLUDED.name,
    updated_at = NOW();

-- 완료 메시지
SELECT 'Missing columns added successfully! Check the messages above for details.' as result; 