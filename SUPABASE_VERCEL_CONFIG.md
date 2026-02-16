# Supabase 설정 가이드 (Vercel 배포용)

## Vercel URL
```
https://online-lecture-sales-igwq.vercel.app/
```

## 1. Supabase Authentication 설정

### 단계 1: Supabase Dashboard 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `ayxmqwvgsveypnbgujma`
3. 좌측 메뉴 → **Authentication** → **URL Configuration** 클릭

### 단계 2: Site URL 설정
**Site URL** 필드에 다음 입력:
```
https://online-lecture-sales-igwq.vercel.app
```

### 단계 3: Redirect URLs 추가
**Redirect URLs** 섹션에 다음 URL들을 **모두** 추가:

```
http://localhost:3000/auth/callback
https://online-lecture-sales-igwq.vercel.app/auth/callback
```

**⚠️ 주의:**
- 각 URL을 한 줄씩 입력
- 로컬 개발용 URL도 유지 (localhost:3000)
- 마지막에 `/`를 붙이지 않음

### 단계 4: 저장
- **Save** 또는 **Update** 버튼 클릭

---

## 2. 카카오 개발자 센터 설정 (선택사항)

만약 카카오 로그인이 작동하지 않는다면:

### 단계 1: 카카오 개발자 센터 접속
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 선택

### 단계 2: Redirect URI 확인
**카카오 로그인 → Redirect URI** 섹션에 다음이 있는지 확인:

```
https://ayxmqwvgsveypnbgujma.supabase.co/auth/v1/callback
```

이미 설정되어 있다면 추가 작업 불필요!

---

## 3. PortOne 설정

### 단계 1: PortOne Dashboard 접속
1. https://admin.portone.io/ 접속
2. 스토어 선택

### 단계 2: Redirect URL 추가
**설정 → Redirect URL** 섹션에 추가:

```
https://online-lecture-sales-igwq.vercel.app/purchase/complete
```

### 단계 3: 웹훅 URL 설정 (선택사항)
**설정 → 웹훅 → Endpoint URL**:

```
https://online-lecture-sales-igwq.vercel.app/api/payment/webhook
```

---

## 4. 설정 확인 요약

### Supabase
- [x] Site URL: `https://online-lecture-sales-igwq.vercel.app`
- [x] Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://online-lecture-sales-igwq.vercel.app/auth/callback`

### PortOne
- [x] Redirect URL: `https://online-lecture-sales-igwq.vercel.app/purchase/complete`
- [x] 웹훅 URL: `https://online-lecture-sales-igwq.vercel.app/api/payment/webhook` (선택)

---

## 5. 테스트 순서

### 5.1 카카오 로그인 테스트
1. https://online-lecture-sales-igwq.vercel.app/ 접속
2. 우측 상단 "로그인" 버튼 클릭
3. 카카오 로그인 진행
4. 성공적으로 로그인되는지 확인

❌ **실패 시:**
- 브라우저 콘솔 확인 (F12)
- Supabase Redirect URLs 재확인
- 카카오 개발자 센터 Redirect URI 확인

### 5.2 결제 테스트
1. 로그인 후 "결제하기" 버튼 클릭
2. 포트원 결제창이 정상적으로 뜨는지 확인
3. 테스트 결제 진행
4. 결제 완료 후 "구매 내역" 탭에서 확인

❌ **결제창이 안 뜨면:**
- Vercel 환경 변수 확인:
  - `NEXT_PUBLIC_PORTONE_STORE_ID`
  - `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`
  - `PORTONE_API_KEY`

❌ **결제 완료 후 DB 업데이트 안 되면:**
- Vercel 환경 변수 확인:
  - `SUPABASE_SERVICE_ROLE_KEY`
- PortOne Redirect URL 확인
- Vercel Functions 로그 확인 (Vercel Dashboard → Logs)

### 5.3 구매 내역 확인
1. "구매 내역" 탭 클릭
2. 방금 구매한 내역이 표시되는지 확인

### 5.4 관리자 페이지 테스트 (관리자 계정)
1. 관리자 계정으로 로그인
2. "관리" 탭이 표시되는지 확인
3. 총 매출액, 사용자 수 등 통계 확인

---

## 6. 문제 해결

### "로그인 오류" 발생
**원인:** Supabase Redirect URLs 미설정

**해결:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Redirect URLs에 `https://online-lecture-sales-igwq.vercel.app/auth/callback` 추가
3. 저장 후 재시도

### "결제창이 뜨지 않음"
**원인:** Vercel 환경 변수 미설정

**해결:**
1. Vercel Dashboard → Settings → Environment Variables
2. `NEXT_PUBLIC_PORTONE_STORE_ID` 등 확인
3. 재배포 (Vercel Dashboard → Deployments → Redeploy)

### "결제 완료했는데 DB 업데이트 안 됨"
**원인:** Service Role Key 미설정 또는 Redirect URL 문제

**해결:**
1. Vercel 환경 변수에서 `SUPABASE_SERVICE_ROLE_KEY` 확인
2. PortOne Dashboard에서 Redirect URL 확인
3. Vercel Functions 로그 확인:
   - Vercel Dashboard → Deployments → 최신 배포 클릭 → Functions 탭

### "관리 탭이 안 보임"
**원인:** 관리자 권한 미설정

**해결:**
1. Supabase Dashboard → Table Editor → `profiles` 테이블
2. 해당 사용자의 `is_admin` 컬럼을 `true`로 변경
3. 또는 Vercel 환경 변수에 `NEXT_PUBLIC_ADMIN_EMAILS` 추가

---

## 7. 로그 확인 방법

### Vercel 로그
```
Vercel Dashboard → Deployments → 최신 배포 클릭 → Logs 탭
```

### Supabase 로그
```
Supabase Dashboard → Logs → API Logs
```

### 브라우저 콘솔
```
F12 → Console 탭
```

---

## 체크리스트

배포 후 필수 설정:
- [ ] Supabase Site URL 설정
- [ ] Supabase Redirect URLs 추가 (2개)
- [ ] PortOne Redirect URL 추가
- [ ] 카카오 로그인 테스트
- [ ] 결제 테스트
- [ ] 구매 내역 확인 테스트

문제 발생 시:
- [ ] Vercel 환경 변수 확인
- [ ] Supabase URL 설정 재확인
- [ ] PortOne URL 설정 재확인
- [ ] Vercel Functions 로그 확인
- [ ] 브라우저 콘솔 확인
