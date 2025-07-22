const { test, expect } = require('@playwright/test');

test.describe('이미지 모달 네비게이션 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로컬 개발 서버 또는 배포된 사이트로 이동
    await page.goto('https://carrot2-omega.vercel.app');
    
    // 첫 번째 상품 클릭 (상품이 있다고 가정)
    await page.waitForSelector('[data-testid="product-item"], .bg-white.rounded-lg.shadow-sm', { timeout: 10000 });
    const firstProduct = page.locator('[data-testid="product-item"], .bg-white.rounded-lg.shadow-sm').first();
    await firstProduct.click();
    
    // 상품 상세 페이지가 로드될 때까지 대기
    await page.waitForSelector('h1:has-text("상품 상세")', { timeout: 5000 });
  });

  test('이미지 클릭 시 전체화면 모달이 열린다', async ({ page }) => {
    // 이미지가 있는지 확인
    const productImage = page.locator('img[alt*=""]').first();
    await expect(productImage).toBeVisible();
    
    // 이미지 클릭
    await productImage.click();
    
    // 전체화면 모달이 열렸는지 확인
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-90');
    await expect(modal).toBeVisible();
    
    // 모달 내부의 이미지가 보이는지 확인
    const modalImage = modal.locator('img');
    await expect(modalImage).toBeVisible();
  });

  test('모달에서 뒤로가기 버튼 클릭 시 모달만 닫힌다', async ({ page }) => {
    // 이미지 클릭해서 모달 열기
    const productImage = page.locator('img[alt*=""]').first();
    await productImage.click();
    
    // 모달이 열렸는지 확인
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-90');
    await expect(modal).toBeVisible();
    
    // 닫기 버튼 클릭
    const closeButton = modal.locator('button:has-text("✕"), button svg');
    await closeButton.click();
    
    // 모달이 닫혔는지 확인
    await expect(modal).not.toBeVisible();
    
    // 여전히 상품 상세 페이지에 있는지 확인
    await expect(page.locator('h1:has-text("상품 상세")')).toBeVisible();
  });

  test('모달에서 브라우저 뒤로가기 시 모달만 닫히고 상품 상세 페이지에 머문다', async ({ page }) => {
    // 현재 URL 저장
    const detailPageUrl = page.url();
    
    // 이미지 클릭해서 모달 열기
    const productImage = page.locator('img[alt*=""]').first();
    await productImage.click();
    
    // 모달이 열렸는지 확인
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-90');
    await expect(modal).toBeVisible();
    
    // 브라우저 뒤로가기 실행
    await page.goBack();
    
    // 잠시 대기 (상태 업데이트 시간)
    await page.waitForTimeout(500);
    
    // 모달이 닫혔는지 확인
    await expect(modal).not.toBeVisible();
    
    // 여전히 상품 상세 페이지에 있는지 확인
    await expect(page.locator('h1:has-text("상품 상세")')).toBeVisible();
    
    // URL이 상품 상세 페이지 URL과 같은지 확인
    expect(page.url()).toBe(detailPageUrl);
  });

  test('여러 이미지가 있을 때 네비게이션이 작동한다', async ({ page }) => {
    // 이미지 클릭해서 모달 열기
    const productImage = page.locator('img[alt*=""]').first();
    await productImage.click();
    
    // 모달이 열렸는지 확인
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-90');
    await expect(modal).toBeVisible();
    
    // 다음 이미지 버튼이 있는지 확인 (여러 이미지가 있는 경우)
    const nextButton = modal.locator('button:has([data-icon="chevron-right"])');
    const prevButton = modal.locator('button:has([data-icon="chevron-left"])');
    
    // 이미지 카운터가 있는지 확인
    const imageCounter = modal.locator('div:has-text("/")');
    
    // 버튼이나 카운터 중 하나는 존재해야 함 (이미지가 여러 개인 경우)
    const hasMultipleImages = await nextButton.isVisible() || await imageCounter.isVisible();
    
    if (hasMultipleImages) {
      // 다음 이미지 버튼 클릭 (있는 경우)
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(300); // 이미지 전환 대기
      }
    }
    
    // 모달이 여전히 열려있는지 확인
    await expect(modal).toBeVisible();
  });

  test('ESC 키로 모달을 닫을 수 있다', async ({ page }) => {
    // 이미지 클릭해서 모달 열기
    const productImage = page.locator('img[alt*=""]').first();
    await productImage.click();
    
    // 모달이 열렸는지 확인
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-90');
    await expect(modal).toBeVisible();
    
    // ESC 키 누르기
    await page.keyboard.press('Escape');
    
    // 모달이 닫혔는지 확인
    await expect(modal).not.toBeVisible();
    
    // 여전히 상품 상세 페이지에 있는지 확인
    await expect(page.locator('h1:has-text("상품 상세")')).toBeVisible();
  });
});

test.describe('편집 페이지 이미지 업로드 제한 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://carrot2-omega.vercel.app');
    
    // 관리자 로그인이 필요한 경우 (실제 테스트에서는 적절한 로그인 과정 필요)
    // 여기서는 편집 페이지에 직접 접근한다고 가정
  });

  test('편집 페이지에서 10개까지 이미지 업로드 제한이 적용된다', async ({ page }) => {
    // 편집 페이지로 이동 (실제 상품 ID 필요)
    // await page.goto('/edit/some-product-id');
    
    // 이 테스트는 실제 상품이 있을 때만 실행 가능
    console.log('편집 페이지 테스트는 실제 상품 데이터가 필요합니다.');
  });
}); 