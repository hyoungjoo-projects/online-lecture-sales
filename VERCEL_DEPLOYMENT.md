# Vercel 배포 가이드

## 1. Vercel 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. **"Add New Project"** 클릭
3. GitHub 저장소 연결 (또는 Git 저장소 import)
4. 프로젝트 import

## 2. 환경 변수 설정 (필수!)

**Vercel Dashboard → Settings → Environment Variables**에서 다음 변수들을 추가:

### Supabase 설정
```
NEXT_PUBLIC_SUPABASE_URL=https://ayxmqwvgsveypnbgujma.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Ncyaz50X8YRYERYDqiRjxw_l-8kRATS
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eG1xd3Znc3ZleXBuYmd1am1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMxODg3NSwiZXhwIjoyMDg0ODk0ODc1fQ.CrYumA-1cuMSqBM2rLlezot_s7r5A8kOno5RbkEa7yc
```

### PortOne 설정
```
NEXT_PUBLIC_PORTONE_STORE_ID=store-06f2da7d-a1e7-4137-9c6d-a3c338bc64b2
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-3a83adbc-8f4c-4134-8377-ed9f17226b09
PORTONE_API_KEY=ou1T9Q9wacz9PQpbLdpSjxEe97c4e8wesoGOdHkLDnWANqBgAwAPdQ0jk5SNkRSv59FvUmHalHls5uo6
```

### 관리자 이메일 (선택사항)
```
NEXT_PUBLIC_ADMIN_EMAILS=your-admin@email.com
```

**⚠️ 중요: 모든 환경 변수에 대해 "Production", "Preview", "Development" 모두 체크!**

## 3. Supabase 인증 설정 업데이트

### 3.1 Redirect URLs 추가

**Supabase Dashboard → Authentication → URL Configuration**

다음 URL들을 **"Redirect URLs"**에 추가:

```
# 로컬 개발
http://localhost:3000/auth/callback

# Vercel 배포 (실제 도메인으로 변경)
https://your-app.vercel.app/auth/callback
https://your-custom-domain.com/auth/callback
```

### 3.2 Site URL 설정

**Supabase Dashboard → Authentication → URL Configuration**

**"Site URL"**을 Vercel 도메인으로 설정:

```
https://your-app.vercel.app
```

또는 커스텀 도메인:

```
https://your-custom-domain.com
```

## 4. PortOne 설정 업데이트

### 4.1 Redirect URL 추가

**PortOne Dashboard → 설정 → Redirect URL**

결제 완료 후 리다이렉트 URL 추가:

```
# Vercel 도메인
https://your-app.vercel.app/purchase/complete
```

### 4.2 웹훅 URL 설정 (선택사항)

**PortOne Dashboard → 웹훅 설정**

```
https://your-app.vercel.app/api/payment/webhook
```

## 5. 배포 확인

### 5.1 첫 배포
1. Vercel이 자동으로 빌드 시작
2. 빌드 로그 확인
3. 배포 완료 후 도메인 접속

### 5.2 배포 후 확인 사항
- [ ] 홈페이지 정상 로드
- [ ] 카카오 로그인 작동
- [ ] 결제 버튼 클릭 시 포트원 결제창 표시
- [ ] 결제 완료 후 Supabase `purchases` 테이블 업데이트
- [ ] 구매 내역 페이지 정상 작동
- [ ] 관리자 페이지 접근 (관리자 계정)

## 6. 문제 해결

### 빌드 실패 시
```bash
# 로컬에서 빌드 테스트
npm run build

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

### 환경 변수 문제
- Vercel Dashboard에서 환경 변수 재확인
- 변수명 오타 확인
- **재배포 필요**: 환경 변수 변경 후 재배포해야 적용됨

### 인증 문제
- Supabase Redirect URLs 확인
- 카카오 개발자 센터에서 Redirect URI 추가:
  ```
  https://ayxmqwvgsveypnbgujma.supabase.co/auth/v1/callback
  ```

### 결제 문제
- PortOne Redirect URL 확인
- 브라우저 콘솔에서 에러 확인
- Vercel Functions 로그 확인

## 7. 커스텀 도메인 설정 (선택사항)

### 7.1 Vercel에서 도메인 추가
1. **Vercel Dashboard → Settings → Domains**
2. 커스텀 도메인 추가
3. DNS 설정 (A 레코드 또는 CNAME)

### 7.2 Supabase & PortOne 업데이트
- 위의 3, 4번 단계를 커스텀 도메인으로 다시 설정

## 8. 배포 워크플로우

```bash
# 1. 로컬에서 개발
npm run dev

# 2. Git 커밋 & 푸시
git add .
git commit -m "feat: 새 기능 추가"
git push origin main

# 3. Vercel이 자동으로 배포
# - main 브랜치 푸시 → Production 배포
# - 다른 브랜치 푸시 → Preview 배포
```

## 9. 성능 최적화 (선택사항)

### 9.1 이미지 최적화
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['ayxmqwvgsveypnbgujma.supabase.co'],
  },
};
```

### 9.2 헤더 설정
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};
```

## 10. 모니터링

### Vercel Analytics
- **Vercel Dashboard → Analytics** 탭 확인
- 페이지 성능, 방문자 수 등 확인

### Supabase Logs
- **Supabase Dashboard → Logs** 탭 확인
- API 호출, 에러 로그 확인

## 체크리스트

배포 전:
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있음
- [ ] 모든 환경 변수를 Vercel에 설정함
- [ ] 로컬에서 `npm run build` 성공

배포 후:
- [ ] Supabase Redirect URLs 추가
- [ ] PortOne Redirect URL 추가
- [ ] 카카오 로그인 테스트
- [ ] 결제 테스트
- [ ] 관리자 페이지 접근 테스트

---

## 참고 링크

- [Vercel 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 인증 가이드](https://supabase.com/docs/guides/auth)
- [PortOne 개발자 문서](https://developers.portone.io/)
