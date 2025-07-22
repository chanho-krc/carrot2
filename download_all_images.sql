-- =============================================
-- Carrot2 이미지 다운로드 URL 생성 SQL
-- Storage에서 모든 이미지의 다운로드 링크를 생성합니다
-- =============================================

-- 1. 모든 이미지 파일의 다운로드 URL 생성
SELECT 
  name as filename,
  'https://mnjnikatvcxgaayldmak.supabase.co/storage/v1/object/public/product-images/' || name as download_url,
  metadata->>'size' as file_size,
  created_at,
  updated_at
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name LIKE 'products/images/%'
  AND name != 'products/images/'
ORDER BY created_at DESC;

-- 2. 다운로드용 간단한 URL 목록만
SELECT 
  ROW_NUMBER() OVER (ORDER BY created_at DESC) as 순번,
  'https://mnjnikatvcxgaayldmak.supabase.co/storage/v1/object/public/product-images/' || name as 다운로드_URL
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name LIKE 'products/images/%'
  AND name != 'products/images/'
ORDER BY created_at DESC;

-- 3. wget 명령어 형태로 생성 (Windows에서 사용 가능)
SELECT 
  'curl -o "carrot_image_' || ROW_NUMBER() OVER (ORDER BY created_at DESC) || '.jpg" "https://mnjnikatvcxgaayldmak.supabase.co/storage/v1/object/public/product-images/' || name || '"' as curl_command
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name LIKE 'products/images/%'
  AND name != 'products/images/'
ORDER BY created_at DESC;

-- 4. HTML 다운로드 링크 형태로 생성
SELECT 
  '<a href="https://mnjnikatvcxgaayldmak.supabase.co/storage/v1/object/public/product-images/' || name || '" download="carrot_image_' || ROW_NUMBER() OVER (ORDER BY created_at DESC) || '.jpg">이미지 ' || ROW_NUMBER() OVER (ORDER BY created_at DESC) || ' 다운로드</a>' as html_link
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name LIKE 'products/images/%'
  AND name != 'products/images/'
ORDER BY created_at DESC;

-- 5. JavaScript 배열 형태로 생성 (브라우저에서 일괄 다운로드용)
SELECT 
  'const imageUrls = [' || chr(10) ||
  string_agg(
    '  "https://mnjnikatvcxgaayldmak.supabase.co/storage/v1/object/public/product-images/' || name || '"',
    ',' || chr(10)
    ORDER BY created_at DESC
  ) || chr(10) || '];' || chr(10) || chr(10) ||
  'imageUrls.forEach((url, index) => {' || chr(10) ||
  '  const link = document.createElement("a");' || chr(10) ||
  '  link.href = url;' || chr(10) ||
  '  link.download = `carrot_image_${index + 1}.jpg`;' || chr(10) ||
  '  link.click();' || chr(10) ||
  '});' as javascript_download_code
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name LIKE 'products/images/%'
  AND name != 'products/images/'
LIMIT 1;

-- 6. 파일 개수 확인
SELECT 
  COUNT(*) as 총_이미지_개수,
  ROUND(SUM((metadata->>'size')::numeric) / 1024 / 1024, 2) as 총_용량_MB
FROM storage.objects 
WHERE bucket_id = 'product-images' 
  AND name LIKE 'products/images/%'
  AND name != 'products/images/';

-- 사용법 안내
SELECT '
=== 사용 방법 ===

1. 첫 번째 쿼리: 모든 이미지의 상세 정보와 다운로드 URL
2. 두 번째 쿼리: 간단한 다운로드 URL 목록
3. 세 번째 쿼리: curl 명령어로 터미널에서 일괄 다운로드
4. 네 번째 쿼리: HTML 링크로 브라우저에서 다운로드
5. 다섯 번째 쿼리: JavaScript 코드로 브라우저에서 자동 다운로드

추천: 다섯 번째 쿼리 결과를 복사해서 브라우저 개발자도구(F12) Console에서 실행!
' as 사용법; 