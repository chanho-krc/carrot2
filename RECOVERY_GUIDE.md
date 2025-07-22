# 🚨 Carrot2 데이터 복구 가이드

> **상황**: 무료 플랜으로 인한 백업 부재, 데이터 삭제 발생  
> **목표**: Storage 이미지 활용 + 관리자 모드 상품 등록으로 시스템 복구

## 📋 복구 순서

### **1단계: Storage 이미지 다운로드** 📥

```bash
# 1. 의존성 설치
npm install @supabase/supabase-js

# 2. 이미지 다운로드 스크립트 실행
node download_storage_images.js
```

**결과물:**
- `downloaded_images/` 폴더에 모든 이미지 저장
- `download_report.json` 다운로드 리포트 생성

### **2단계: 데이터베이스 복원** 🗄️

**Supabase SQL Editor에서 순서대로 실행:**

#### **2-1. products 테이블 복원**
```sql
-- restore_original_carrot2.sql 전체 복사해서 실행
```
✅ **결과**: products 테이블 + 5개 테스트 상품 생성

#### **2-2. users 테이블 생성**
```sql
-- create_users_table.sql 전체 복사해서 실행
```
✅ **결과**: users 테이블 + 5명 샘플 사용자 생성

### **3단계: 코드 배포** 🚀

```bash
# 변경사항 커밋 및 배포
git add .
git commit -m "feat: 관리자 모드 사용자 선택 기능 추가"
git push origin main
```

✅ **결과**: Vercel 자동 배포 완료

### **4단계: 관리자 모드로 상품 등록** 👑

1. **웹사이트 접속**: https://carrot2-omega.vercel.app
2. **관리자로 로그인** 
3. **상품 등록** 페이지 이동
4. **"👑 관리자 모드: 판매자 선택"** 드롭다운에서 사용자 선택
5. **다운로드한 이미지들 업로드**하여 상품 재등록

## 🎯 관리자 모드 새로운 기능

### **사용자 선택 기능**
- 관리자는 다른 사용자 이름으로 상품 등록 가능
- 판매자 정보 자동 설정
- 성공 메시지에 판매자명 표시

### **UI 개선사항**
- 관리자 전용 파란색 영역
- 선택된 사용자 정보 미리보기
- 헤더에 "관리자 상품 등록" 표시

## 📂 생성된 파일들

```
carrot2/
├── restore_original_carrot2.sql     # products 테이블 복원
├── create_users_table.sql           # users 테이블 생성
├── download_storage_images.js       # Storage 이미지 다운로드
├── downloaded_images/               # 다운로드된 이미지들
│   ├── download_report.json        # 다운로드 리포트
│   └── [이미지파일들...]
└── RECOVERY_GUIDE.md               # 이 가이드
```

## 🔧 문제 해결

### **이미지 다운로드 실패시**
```bash
# 1. Supabase 키 확인
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. 스크립트 직접 수정
# download_storage_images.js 파일에서 URL과 KEY 직접 입력
```

### **사용자 목록이 안 보일 때**
```sql
-- users 테이블 존재 확인
SELECT table_name FROM information_schema.tables WHERE table_name = 'users';

-- 없다면 create_users_table.sql 다시 실행
```

### **관리자 모드 접근 안 될 때**
- 로컬스토리지의 `isAdmin: true` 확인
- 브라우저 캐시 클리어 후 재로그인

## 📈 향후 백업 전략

### **정기 백업 시스템 구축**
1. **매주 수동 백업**: `pg_dump` 사용
2. **Pro 플랜 업그레이드** 고려 ($25/월, 7일 백업)
3. **외부 백업 서비스** 연동

### **백업 스크립트 예시**
```bash
# 매주 실행할 백업 명령
pg_dump "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.com:5432/postgres" > backup_$(date +%Y%m%d).sql
```

## ✅ 복구 완료 체크리스트

- [ ] Storage 이미지 다운로드 완료
- [ ] products 테이블 복원 완료
- [ ] users 테이블 생성 완료
- [ ] 코드 배포 완료
- [ ] 관리자 모드 상품 등록 테스트
- [ ] 이미지 업로드 테스트
- [ ] 사용자 선택 기능 테스트

## 🎉 성공!

모든 단계를 완료하면:
- ✅ 원래 상태의 시스템 복원
- ✅ 관리자가 사용자별 상품 등록 가능
- ✅ Storage 이미지들 활용 가능
- ✅ 향후 백업 시스템 준비

---

**💡 참고**: 이번 경험을 통해 **정기 백업의 중요성**을 학습했습니다. 앞으로는 주기적인 백업을 권장합니다! 