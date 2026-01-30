# Supabase 카카오톡 로그인 설정 가이드

## 1. Supabase 프로젝트 설정

### 1.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 **URL**과 **Publishable Key** (또는 Anon Key)를 복사합니다.

### 1.2 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**참고**: 최신 Supabase는 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 사용하지만, 기존 `NEXT_PUBLIC_SUPABASE_ANON_KEY`도 호환성을 위해 지원됩니다.

**SUPABASE_SERVICE_ROLE_KEY**: 구매 API에서 결제 완료 후 Supabase `purchases` 테이블에 저장할 때 사용한다. Supabase 대시보드 > Project Settings > API에서 **service_role** (secret) 키를 복사하여 `.env.local`에 넣는다. **절대 클라이언트에 노출하지 말 것.**

### 1.3 관리자 메뉴(관리 탭) 표시 (선택)
카카오 로그인 후 **관리** 탭을 보이게 하려면 다음 중 하나를 사용한다.

**방법 1: profiles 테이블의 is_admin 사용 (권장)**

1. Supabase 대시보드 > SQL Editor에서 `supabase_profiles_add_is_admin.sql` 내용을 실행하여 `profiles` 테이블에 `is_admin` 컬럼을 추가한다.
2. 관리자로 지정할 사용자의 `profiles` 행에서 `is_admin`을 `true`로 설정한다.

```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'admin@example.com';
```

**방법 2: 환경 변수 fallback**

`profiles.is_admin`이 없거나 조회 전에는 환경 변수로 판별한다.

```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,another@example.com
```

- 쉼표로 구분하여 여러 이메일을 넣을 수 있다.
- `profiles`에 `is_admin`이 설정된 사용자는 DB 값을 우선 사용하고, 그 외에는 위 이메일 목록 또는 `user_metadata.role === 'admin'`으로 관리자 여부를 판별한다.

**관리자 대시보드(총 매출액·총 사용자·최근 구매 내역) 사용 시**

- 관리자 탭에서 전체 구매·프로필을 조회하려면 Supabase SQL Editor에서 `supabase_admin_rls.sql`을 실행하여 관리자용 RLS 정책을 추가한다.

## 2. 카카오톡 OAuth 설정

### 2.1 카카오 개발자 센터 설정

#### 단계 1: 애플리케이션 생성
1. [카카오 개발자 센터](https://developers.kakao.com)에 접속합니다.
2. 로그인 후 **내 애플리케이션** 메뉴로 이동합니다.
3. **애플리케이션 추가하기** 버튼을 클릭합니다.
4. 앱 이름을 입력하고 저장합니다.

#### 단계 2: REST API 키 확인
1. 생성한 애플리케이션을 선택합니다.
2. 왼쪽 메뉴에서 **앱 키**를 클릭합니다.
3. **REST API 키**를 복사합니다. (예: `e985fa99390dfc7cefa29fc7dfee34fb`)

#### 단계 3: Web 플랫폼 등록 (선택사항)
**참고**: Web 플랫폼 등록은 필수가 아닐 수 있습니다. Redirect URI만 등록해도 작동할 수 있습니다.

만약 Web 플랫폼 등록이 필요한 경우:
1. 왼쪽 사이드바에서 **앱 설정 > 일반** 메뉴를 클릭합니다.
2. 페이지에서 **플랫폼** 섹션을 찾습니다 (보이지 않으면 스킵 가능).
3. **Web** 플랫폼을 등록하고 사이트 도메인에 `http://localhost:3000`을 입력합니다.

**대부분의 경우 이 단계는 건너뛰고 다음 단계(카카오 로그인 활성화 및 Redirect URI 등록)로 진행하면 됩니다.**

#### 단계 4: 카카오 로그인 활성화
1. 왼쪽 메뉴에서 **제품 설정**을 클릭합니다.
2. **카카오 로그인**을 찾아 **활성화 설정**을 클릭합니다.
3. **카카오 로그인 활성화** 토글을 **ON**으로 설정합니다.

#### 단계 5: 동의 항목 설정 (필수)
**⚠️ 중요**: Supabase는 사용자 이메일 정보를 요청하므로, 이메일 동의 항목을 반드시 활성화해야 합니다.

1. **제품 설정 > 카카오 로그인** 페이지에서 아래로 스크롤합니다.
2. **동의 항목** 또는 **카카오 로그인 동의항목** 섹션을 찾습니다.
3. **동의 항목 관리** 또는 **동의 항목 설정** 버튼을 클릭합니다.
4. **필수 동의** 또는 **선택 동의** 섹션에서 **이메일** 항목을 찾습니다.
5. **이메일 (account_email)** 항목을 활성화합니다:
   - **필수 동의**로 설정하거나
   - **선택 동의**로 설정 (둘 다 가능)
6. **저장** 버튼을 클릭합니다.

**참고**: 
- 이메일 동의 항목이 활성화되지 않으면 "설정하지 않은 동의 항목: account_email" 오류가 발생합니다.
- 동의 항목 설정 후 약간의 시간(몇 분)이 걸릴 수 있으니, 설정 후 잠시 기다렸다가 다시 시도하세요.

#### 단계 6: Redirect URI 등록
1. **제품 설정 > 카카오 로그인** 페이지에서 아래로 스크롤합니다.
2. **Redirect URI** 섹션을 찾습니다.
3. **Redirect URI 등록** 버튼을 클릭합니다.
4. 다음 URL을 정확히 입력합니다:
   ```
   https://ayxmqwvgsveypnbgujma.supabase.co/auth/v1/callback
   ```
   **⚠️ 중요**: 위 URL을 정확히 복사해서 붙여넣으세요. 공백이나 오타가 있으면 작동하지 않습니다.
5. **저장** 버튼을 클릭합니다.

**참고**: 
- Supabase 프로젝트 URL이 `https://ayxmqwvgsveypnbgujma.supabase.co`인 경우, Redirect URI는 위와 같이 설정합니다.
- 다른 Supabase 프로젝트를 사용하는 경우, URL의 `ayxmqwvgsveypnbgujma` 부분을 해당 프로젝트의 참조 ID로 변경하세요.

### 2.2 Supabase에서 카카오톡 Provider 설정
1. Supabase 대시보드에서 **Authentication > Providers**로 이동합니다.
2. **Kakao**를 찾아 활성화합니다.
3. 다음 정보를 입력합니다:
   - **Client ID (REST API 키)**: 카카오 개발자 센터에서 복사한 REST API 키
   - **Client Secret**: 카카오 개발자 센터에서 발급받은 Client Secret
   - **Redirect URL**: 자동으로 설정됩니다 (`https://your-project-ref.supabase.co/auth/v1/callback`)

### 2.3 Client Secret 발급 (선택사항)
일부 경우 Client Secret이 필요할 수 있습니다:
1. 카카오 개발자 센터에서 **제품 설정 > 카카오 로그인**으로 이동
2. **보안** 탭에서 **Client Secret** 확인
3. 필요시 **Client Secret 코드 발급** 버튼 클릭

## 3. Profiles 테이블 설정

### 3.1 Profiles 테이블 생성
카카오 로그인 시 사용자 정보를 저장하기 위해 `profiles` 테이블을 생성해야 합니다.

1. Supabase 대시보드에서 **SQL Editor**로 이동합니다.
2. `supabase_profiles_setup.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣습니다.
3. **Run** 버튼을 클릭하여 실행합니다.

**또는** 수동으로 다음 단계를 따르세요:

1. **Table Editor**에서 **New Table**을 클릭합니다.
2. 테이블 이름을 `profiles`로 설정합니다.
3. 다음 컬럼을 추가합니다:
   - `id` (UUID, Primary Key, Foreign Key → auth.users(id))
   - `email` (Text)
   - `name` (Text)
   - `avatar_url` (Text)
   - `created_at` (Timestamp with time zone, Default: now())
   - `updated_at` (Timestamp with time zone, Default: now())

4. **Row Level Security (RLS)**를 활성화합니다.
5. 다음 정책을 추가합니다:
   - **SELECT**: `auth.uid() = id`
   - **UPDATE**: `auth.uid() = id`
   - **INSERT**: `auth.uid() = id`

### 3.2 자동 프로필 생성 (선택사항)
`supabase_profiles_setup.sql` 스크립트에는 사용자가 생성될 때 자동으로 profiles 레코드를 생성하는 트리거가 포함되어 있습니다. 이 트리거는 선택사항이지만 권장됩니다.

**참고**: 
- `supabase_profiles_setup.sql` 파일은 프로젝트 루트에 있습니다.
- 이 스크립트는 테이블 생성, RLS 정책, 자동 업데이트 트리거, 자동 프로필 생성 트리거를 모두 포함합니다.

## 4. 로컬 개발 환경 설정

### 3.1 환경 변수 확인
`.env.local` 파일이 올바르게 설정되었는지 확인하세요.

### 3.2 개발 서버 실행
```bash
npm run dev
```

## 5. 배포 환경 설정

### 5.1 Vercel 배포 시
1. Vercel 프로젝트 설정에서 **Environment Variables**에 다음을 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 5.2 카카오 개발자 센터 Redirect URI 업데이트
배포된 도메인에 맞게 Redirect URI를 업데이트:
```
https://your-deployed-domain.com/auth/callback
```

## 6. 테스트

1. 개발 서버를 실행합니다.
2. 네비게이션 바의 **"카카오로 로그인"** 버튼을 클릭합니다.
3. 카카오톡 로그인 페이지로 리다이렉트됩니다.
4. 로그인 후 자동으로 돌아와 로그인 상태가 표시됩니다.

## 문제 해결

### "설정하지 않은 동의 항목: account_email" 오류
**가장 흔한 오류입니다!** 이 오류는 카카오 개발자 센터에서 이메일 동의 항목을 활성화하지 않아서 발생합니다.

**해결 방법:**
1. 카카오 개발자 센터 → **제품 설정 > 카카오 로그인**으로 이동
2. **동의 항목** 또는 **카카오 로그인 동의항목** 섹션 찾기
3. **이메일 (account_email)** 항목을 활성화 (필수 동의 또는 선택 동의 모두 가능)
4. 저장 후 몇 분 기다렸다가 다시 시도

**참고**: 동의 항목 설정이 반영되는 데 몇 분 정도 걸릴 수 있습니다.

### 로그인 후 리다이렉트가 안 되는 경우
- 카카오 개발자 센터의 Redirect URI가 정확히 설정되었는지 확인
- Supabase의 Redirect URL이 올바른지 확인

### "Invalid redirect URL" 오류
- 카카오 개발자 센터의 Redirect URI 목록에 Supabase 콜백 URL이 등록되어 있는지 확인

### 환경 변수가 인식되지 않는 경우
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버를 재시작
