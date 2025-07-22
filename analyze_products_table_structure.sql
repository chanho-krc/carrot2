-- =============================================
-- Supabase products 테이블 구조 분석 SQL
-- 테이블 스키마, 컬럼, 인덱스, 제약조건, 트리거 등 모든 정보 조회
-- =============================================

-- 📋 1. 기본 테이블 정보
SELECT 
  '=== 테이블 기본 정보 ===' as section,
  schemaname as 스키마명,
  tablename as 테이블명,
  tableowner as 소유자,
  hasindexes as 인덱스_보유,
  hasrules as 룰_보유,
  hastriggers as 트리거_보유
FROM pg_tables 
WHERE tablename = 'products';

-- 📋 2. 컬럼 상세 정보
SELECT 
  '=== 컬럼 상세 정보 ===' as section,
  ordinal_position as 순서,
  column_name as 컬럼명,
  data_type as 데이터타입,
  CASE 
    WHEN character_maximum_length IS NOT NULL 
    THEN data_type || '(' || character_maximum_length || ')'
    WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL
    THEN data_type || '(' || numeric_precision || ',' || numeric_scale || ')'
    WHEN numeric_precision IS NOT NULL 
    THEN data_type || '(' || numeric_precision || ')'
    ELSE data_type
  END as 완전한_타입,
  is_nullable as NULL_허용,
  column_default as 기본값,
  CASE 
    WHEN is_identity = 'YES' THEN 'IDENTITY'
    WHEN column_default LIKE '%nextval%' THEN 'SERIAL'
    WHEN column_default = 'gen_random_uuid()' THEN 'UUID'
    ELSE ''
  END as 특수속성
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 📋 3. 기본키 정보
SELECT 
  '=== 기본키 정보 ===' as section,
  kcu.constraint_name as 제약조건명,
  kcu.column_name as 컬럼명,
  kcu.ordinal_position as 순서
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'products' 
  AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY kcu.ordinal_position;

-- 📋 4. 외래키 정보
SELECT 
  '=== 외래키 정보 ===' as section,
  tc.constraint_name as 제약조건명,
  kcu.column_name as 컬럼명,
  ccu.table_name as 참조테이블,
  ccu.column_name as 참조컬럼,
  rc.update_rule as 업데이트_규칙,
  rc.delete_rule as 삭제_규칙
FROM information_schema.table_constraints tc 
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'products' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- 📋 5. 체크 제약조건
SELECT 
  '=== 체크 제약조건 ===' as section,
  cc.constraint_name as 제약조건명,
  cc.check_clause as 체크조건
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc 
  ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'products';

-- 📋 6. 인덱스 정보
SELECT 
  '=== 인덱스 정보 ===' as section,
  i.relname as 인덱스명,
  am.amname as 인덱스타입,
  idx.indisunique as 유니크여부,
  idx.indisprimary as 기본키여부,
  ARRAY(
    SELECT pg_get_indexdef(idx.indexrelid, k + 1, true)
    FROM generate_subscripts(idx.indkey, 1) as k
    ORDER BY k
  ) as 인덱스컬럼들,
  pg_get_indexdef(i.oid) as 인덱스정의
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_am am ON i.relam = am.oid
WHERE t.relname = 'products'
ORDER BY i.relname;

-- 📋 7. 트리거 정보
SELECT 
  '=== 트리거 정보 ===' as section,
  trigger_name as 트리거명,
  event_manipulation as 이벤트,
  action_timing as 실행시점,
  action_statement as 실행문
FROM information_schema.triggers 
WHERE event_object_table = 'products'
ORDER BY trigger_name;

-- 📋 8. RLS (Row Level Security) 정책
SELECT 
  '=== RLS 정책 정보 ===' as section,
  schemaname as 스키마,
  tablename as 테이블명,
  policyname as 정책명,
  permissive as 허용타입,
  roles as 대상역할,
  cmd as 명령어,
  qual as 조건식,
  with_check as 체크조건
FROM pg_policies 
WHERE tablename = 'products';

-- 📋 9. 테이블 통계 정보
SELECT 
  '=== 테이블 통계 정보 ===' as section,
  schemaname as 스키마,
  tablename as 테이블명,
  n_tup_ins as 삽입된행수,
  n_tup_upd as 업데이트된행수,
  n_tup_del as 삭제된행수,
  n_live_tup as 현재행수,
  n_dead_tup as 죽은행수,
  last_vacuum as 마지막_배큠,
  last_autovacuum as 마지막_자동배큠,
  last_analyze as 마지막_분석,
  last_autoanalyze as 마지막_자동분석
FROM pg_stat_user_tables 
WHERE relname = 'products';

-- 📋 10. 테이블 크기 정보
SELECT 
  '=== 테이블 크기 정보 ===' as section,
  pg_size_pretty(pg_total_relation_size('products')) as 총크기,
  pg_size_pretty(pg_relation_size('products')) as 테이블크기,
  pg_size_pretty(pg_total_relation_size('products') - pg_relation_size('products')) as 인덱스크기
FROM pg_class 
WHERE relname = 'products';

-- 📋 11. 배열 컬럼 상세 분석 (images, videos)
SELECT 
  '=== 배열 컬럼 분석 ===' as section,
  column_name as 컬럼명,
  data_type as 데이터타입,
  CASE 
    WHEN data_type = 'ARRAY' THEN 
      (SELECT data_type FROM information_schema.element_types 
       WHERE object_name = c.table_name AND collection_type_identifier = c.dtd_identifier)
    ELSE data_type 
  END as 배열요소타입
FROM information_schema.columns c
WHERE table_name = 'products' 
  AND (data_type = 'ARRAY' OR column_name IN ('images', 'videos'));

-- 📋 12. 함수 정보 (products 관련)
SELECT 
  '=== 관련 함수 정보 ===' as section,
  routine_name as 함수명,
  routine_type as 타입,
  data_type as 반환타입,
  routine_definition as 함수정의
FROM information_schema.routines 
WHERE routine_definition ILIKE '%products%' 
  OR routine_name ILIKE '%product%'
ORDER BY routine_name;

-- 📋 13. 시퀀스 정보 (ID 관련)
SELECT 
  '=== 시퀀스 정보 ===' as section,
  sequence_name as 시퀀스명,
  data_type as 데이터타입,
  start_value as 시작값,
  minimum_value as 최소값,
  maximum_value as 최대값,
  increment as 증가값,
  cycle_option as 순환옵션
FROM information_schema.sequences 
WHERE sequence_name LIKE '%product%';

-- 📋 14. 권한 정보
SELECT 
  '=== 테이블 권한 정보 ===' as section,
  grantee as 권한받은자,
  privilege_type as 권한타입,
  is_grantable as 권한부여가능
FROM information_schema.table_privileges 
WHERE table_name = 'products'
ORDER BY grantee, privilege_type;

-- 📋 15. 최종 요약
SELECT 
  '=== 최종 요약 ===' as section,
  COUNT(*) as 총컬럼수
FROM information_schema.columns 
WHERE table_name = 'products'
UNION ALL
SELECT 
  '인덱스 개수',
  COUNT(*)::text
FROM pg_indexes 
WHERE tablename = 'products'
UNION ALL
SELECT 
  '트리거 개수',
  COUNT(*)::text
FROM information_schema.triggers 
WHERE event_object_table = 'products'
UNION ALL
SELECT 
  '제약조건 개수',
  COUNT(*)::text
FROM information_schema.table_constraints 
WHERE table_name = 'products';

-- 사용법 안내
SELECT '
=== 사용 방법 ===

1. 전체 스크립트를 Supabase SQL Editor에서 실행
2. 각 섹션별로 products 테이블의 상세 정보 확인
3. 특정 정보만 필요한 경우 해당 섹션만 실행

주요 확인 포인트:
- 컬럼 구조 (2번 섹션)
- 인덱스 정보 (6번 섹션) 
- RLS 정책 (8번 섹션)
- 배열 컬럼 (11번 섹션) - images, videos
- 관련 함수 (12번 섹션) - increment_view_count 등

' as 사용법; 