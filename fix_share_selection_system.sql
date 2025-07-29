-- ============================================
-- 🎯 나눔 신청자 선택 및 거래 완료 시스템
-- ============================================

-- 현재 상품 개수 확인 (안전 확인)
SELECT COUNT(*) as "현재_상품_개수" FROM products;

-- 1. products 테이블에 선택된 나눔 신청자 정보 컬럼 추가
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS selected_share_request_id UUID,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 2. 외래 키 제약 조건 추가 (선택사항)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_products_selected_share_request'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT fk_products_selected_share_request
        FOREIGN KEY (selected_share_request_id) REFERENCES share_requests(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. 선택된 나눔 신청 확인을 위한 RPC 함수 생성
CREATE OR REPLACE FUNCTION select_share_applicant(
  product_id_param UUID,
  share_request_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  updated_product products;
  selected_request share_requests;
BEGIN
  -- 상품 상태를 거래완료로 업데이트하고 선택된 신청자 정보 저장
  UPDATE products
  SET 
    status = 'completed',
    selected_share_request_id = share_request_id_param,
    completed_at = NOW()
  WHERE id = product_id_param AND type = 'share'
  RETURNING * INTO updated_product;

  IF updated_product.id IS NULL THEN 
    RETURN json_build_object(
      'success', false, 
      'message', '상품을 찾을 수 없거나 나눔 상품이 아닙니다.'
    ); 
  END IF;

  -- 선택된 신청서 정보 조회
  SELECT * INTO selected_request
  FROM share_requests
  WHERE id = share_request_id_param;

  RETURN json_build_object(
    'success', true,
    'message', '나눔 신청자가 선택되어 거래가 완료되었습니다!',
    'product_id', updated_product.id,
    'selected_request_id', selected_request.id,
    'selected_requester', selected_request.requester_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 선택 취소를 위한 RPC 함수 생성
CREATE OR REPLACE FUNCTION unselect_share_applicant(product_id_param UUID)
RETURNS JSON AS $$
DECLARE
  updated_product products;
BEGIN
  -- 상품 상태를 다시 나눔으로 돌리고 선택 해제
  UPDATE products
  SET 
    status = 'share',
    selected_share_request_id = NULL,
    completed_at = NULL
  WHERE id = product_id_param AND type = 'share'
  RETURNING * INTO updated_product;

  IF updated_product.id IS NULL THEN 
    RETURN json_build_object(
      'success', false, 
      'message', '상품을 찾을 수 없습니다.'
    ); 
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', '선택이 취소되어 다시 나눔 중으로 변경되었습니다.',
    'product_id', updated_product.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 권한 설정
GRANT EXECUTE ON FUNCTION select_share_applicant(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION unselect_share_applicant(UUID) TO anon, authenticated;

-- 6. 나눔 상품들의 상태를 'share'로 업데이트 (기존 나눔 상품들이 'selling'으로 되어 있을 수 있음)
UPDATE products 
SET status = 'share' 
WHERE type = 'share' AND status = 'selling';

-- 최종 확인
SELECT 
  '✅ 나눔 신청자 선택 시스템 데이터베이스 설정 완료!' as result,
  (SELECT COUNT(*) FROM products WHERE type = 'share') as "나눔상품수",
  (SELECT COUNT(*) FROM products) as "전체상품수"; 