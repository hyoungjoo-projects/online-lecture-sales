# 포트원(PortOne) 결제 시스템 설정 가이드

## 개요

포트원 v2와 토스 페이먼츠를 연동하여 결제 시스템을 구축합니다.

## 1. 포트원 계정 설정

### 1.1 포트원 가입 및 Store 생성

1. [포트원 관리자 콘솔](https://admin.portone.io)에 가입합니다.
2. **Store**를 생성합니다.
3. 생성된 **Store ID**를 복사합니다.

### 1.2 토스 페이먼츠 연동

1. 포트원 관리자 콘솔에서 **PG사 설정**으로 이동합니다.
2. **토스 페이먼츠**를 선택합니다.
3. 토스 페이먼츠에서 발급받은 **Client Key**와 **Secret Key**를 입력합니다.
4. **채널**을 생성하고 **채널 키(Channel Key)**를 복사합니다.

### 1.3 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 포트원 설정
NEXT_PUBLIC_PORTONE_STORE_ID=your-store-id
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=your-channel-key
```

**중요**: 
- `NEXT_PUBLIC_PORTONE_STORE_ID`: 포트원 관리자 콘솔에서 확인한 Store ID
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`: 토스 페이먼츠 채널의 Channel Key

## 2. Supabase 테이블 업데이트

### 2.1 purchases 테이블 컬럼 추가

Supabase SQL Editor에서 다음 SQL을 실행하여 결제 정보 컬럼을 추가합니다:

```sql
-- payment_id와 transaction_id 컬럼 추가 (이미 있으면 무시됨)
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- payment_status 기본값을 'pending'으로 변경
ALTER TABLE public.purchases 
ALTER COLUMN payment_status SET DEFAULT 'pending';
```

또는 `supabase_purchases_setup.sql` 파일을 다시 실행하면 자동으로 추가됩니다.

## 3. 결제 프로세스

### 3.1 결제 흐름

```
사용자 → 결제하기 버튼 클릭 → 포트원 결제창 열림
  → 토스 페이먼츠 결제 진행 → 결제 완료
  → /purchase/complete 페이지로 리다이렉트
  → Supabase에 구매 내역 저장
```

### 3.2 결제 요청 파라미터

포트원 v2 `requestPayment` 함수에 전달되는 파라미터:

- `storeId`: 포트원 Store ID
- `channelKey`: 토스 페이먼츠 채널 키
- `paymentId`: 고유 결제 ID (예: `payment_1234567890_userid`)
- `orderName`: 주문명 (강의 제목)
- `totalAmount`: 결제 금액
- `currency`: 화폐 단위 (`CURRENCY_KRW`)
- `payMethod`: 결제 수단 (`CARD`)
- `customer`: 고객 정보 (이름, 이메일, 전화번호)
- `redirectUrl`: 결제 완료 후 리다이렉트 URL

## 4. 웹훅 설정

### 4.1 포트원 웹훅 URL 등록

1. 포트원 관리자 콘솔에서 **웹훅 설정**으로 이동합니다.
2. 웹훅 URL을 등록합니다:
   ```
   https://your-domain.com/api/payment/webhook
   ```
3. 로컬 개발 시에는 [ngrok](https://ngrok.com) 등을 사용하여 터널링합니다.

### 4.2 웹훅 이벤트

포트원에서 다음 이벤트 발생 시 웹훅을 호출합니다:
- `PAYMENT_STATUS_CHANGED`: 결제 상태 변경 시

## 5. 테스트

### 5.1 테스트 모드

포트원은 테스트 모드를 제공합니다:
- 테스트 Store ID 사용
- 테스트 카드 번호로 결제 테스트 가능

### 5.2 테스트 카드 번호 (토스 페이먼츠)

- **카드 번호**: 4242 4242 4242 4242
- **유효기간**: 임의의 미래 날짜
- **CVC**: 임의의 3자리 숫자
- **비밀번호**: 임의의 2자리 숫자

## 6. 문제 해결

### 6.1 "결제 시스템이 설정되지 않았습니다" 오류

- `.env.local` 파일에 환경 변수가 올바르게 설정되었는지 확인
- 개발 서버를 재시작
- `NEXT_PUBLIC_` 접두사가 있는지 확인

### 6.2 결제창이 열리지 않음

- 브라우저 콘솔에서 에러 메시지 확인
- 포트원 Store ID와 Channel Key가 올바른지 확인
- 네트워크 연결 확인

### 6.3 결제는 완료되었지만 구매 내역이 저장되지 않음

- `/api/purchase` API가 정상적으로 호출되었는지 확인
- Supabase `purchases` 테이블에 `payment_id`, `transaction_id` 컬럼이 있는지 확인
- 브라우저 콘솔과 서버 로그 확인

## 7. 배포 시 주의사항

### 7.1 환경 변수 설정

Vercel 등 배포 플랫폼에서 환경 변수를 설정해야 합니다:
- `NEXT_PUBLIC_PORTONE_STORE_ID`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`

### 7.2 웹훅 URL 업데이트

배포된 도메인에 맞게 웹훅 URL을 업데이트합니다:
```
https://your-production-domain.com/api/payment/webhook
```

## 8. 참고 자료

- [포트원 v2 문서](https://developers.portone.io/docs/ko/v2)
- [토스 페이먼츠 연동 가이드](https://developers.tosspayments.com/)
- [포트원 관리자 콘솔](https://admin.portone.io)
