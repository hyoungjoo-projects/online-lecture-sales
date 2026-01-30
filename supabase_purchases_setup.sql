-- ============================================
-- Supabase 구매 시스템 테이블 생성 스크립트
-- ============================================
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- 이 스크립트는 온라인 강의 구매 시스템을 위한 테이블과 정책을 생성합니다.
-- 
-- 주의: 단일 강의만 운영하는 시스템입니다.
-- 프론트엔드에서는 강의 정보를 조회하지 않고 기본값을 사용하며,
-- 구매 시에만 Supabase에서 강의 정보를 확인합니다.

-- ============================================
-- 1. courses 테이블 생성 (강의 정보)
-- ============================================
-- 단일 강의만 저장하는 테이블입니다.
-- 구매 API에서 첫 번째 강의를 찾아서 사용합니다.
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  original_price INTEGER NOT NULL,
  discounted_price INTEGER NOT NULL,
  image_url TEXT,
  content TEXT, -- 마크다운 형식의 강의 상세 내용
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 2. purchases 테이블 생성 (구매 내역)
-- ============================================
-- 사용자의 구매 내역을 저장하는 테이블입니다.
-- 같은 사용자가 같은 강의를 중복 구매할 수 없습니다.
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  price INTEGER NOT NULL, -- 구매 당시 가격 (할인 적용된 가격)
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_id TEXT, -- 포트원 결제 ID
  transaction_id TEXT, -- 포트원 거래 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, course_id) -- 같은 강의를 중복 구매하지 못하도록
);

-- ============================================
-- 3. RLS (Row Level Security) 정책 설정
-- ============================================

-- courses 테이블: 모든 사용자가 조회 가능
-- (구매 API에서 첫 번째 강의를 찾을 때 사용)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 삭제
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;

CREATE POLICY "Anyone can view courses"
  ON public.courses
  FOR SELECT
  USING (true);

-- purchases 테이블: 사용자는 자신의 구매 내역만 조회/생성 가능
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 삭제
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchases;

-- 사용자는 자신의 구매 내역만 조회 가능
CREATE POLICY "Users can view own purchases"
  ON public.purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 구매 내역만 생성 가능
CREATE POLICY "Users can insert own purchases"
  ON public.purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. updated_at 자동 업데이트 함수
-- ============================================
-- 이미 profiles_setup.sql에 있으면 중복 생성 방지
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. updated_at 자동 업데이트 트리거
-- ============================================
-- 기존 트리거가 있으면 삭제
DROP TRIGGER IF EXISTS set_courses_updated_at ON public.courses;
DROP TRIGGER IF EXISTS set_purchases_updated_at ON public.purchases;

CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. 단일 강의 데이터 삽입
-- ============================================
-- 단일 강의만 운영하므로 하나의 강의만 삽입합니다.
-- 기존 데이터가 있으면 삽입하지 않음 (ON CONFLICT DO NOTHING)
INSERT INTO public.courses (title, description, original_price, discounted_price, content)
VALUES (
  'AI 시대의 풀스택 개발자 되기: Next.js × Supabase × Cursor AI',
  '💻 단순히 코드를 배우는 것을 넘어 🚀 Cursor AI와 함께 실전 프로젝트를 완성하며, 현업 개발자의 사고방식을 익히세요. 💡 아이디어 발상, ✍️ 기획, 🖥️ 서비스 배포까지, 당신의 상상을 실제 제품으로 만드는 완전한 여정을 시작하세요.',
  150000,
  99000,
  '## 📚 강의 소개

이 강의는 **Next.js**, **Supabase**, **Cursor AI**를 활용하여 실전 풀스택 애플리케이션을 구축하는 방법을 단계별로 학습합니다.

### 왜 이 강의인가요?

- **실무 중심 학습**: 이론보다는 실제 프로젝트를 완성하며 배웁니다
- **AI 도구 활용**: Cursor AI를 활용하여 개발 생산성을 극대화합니다
- **최신 기술 스택**: 2026년 최신 기술 트렌드를 반영한 커리큘럼입니다
- **완전한 풀스택**: 프론트엔드부터 백엔드, 배포까지 모든 과정을 다룹니다

---

## 📋 커리큘럼

### 1단계: 환경 설정 및 기초 (2주)
- Next.js 16 프로젝트 설정
- Supabase 계정 생성 및 프로젝트 설정
- Cursor AI 기본 사용법
- 개발 환경 구축

### 2단계: 데이터베이스 설계 (1주)
- Supabase 데이터베이스 스키마 설계
- 테이블 생성 및 관계 설정
- Row Level Security (RLS) 설정
- 데이터 시딩 및 마이그레이션

### 3단계: 인증 시스템 구현 (1주)
- Supabase Auth 설정
- 회원가입 및 로그인 기능
- 소셜 로그인 (Google, 카카오톡)
- 세션 관리 및 보안

### 4단계: 프론트엔드 개발 (3주)
- Next.js App Router 활용
- Client Components
- React Server Actions
- 폼 처리 및 유효성 검사
- 실시간 데이터 업데이트

### 5단계: 백엔드 API 개발 (2주)
- Supabase Edge Functions
- RESTful API 설계
- 파일 업로드 처리
- 이메일 발송 기능

### 6단계: 배포 및 운영 (1주)
- Vercel 배포
- 도메인 연결 및 SSL 설정
- 모니터링 및 로깅
- 성능 최적화

---

## 🎯 강의 방식

### 실습 중심 학습
각 단계마다 실제 프로젝트를 함께 만들어가며 학습합니다. 단순히 따라하는 것이 아니라, **왜 이렇게 하는지** 이해할 수 있도록 설명합니다.

### Cursor AI 활용
- 코드 자동 생성 및 리팩토링
- 버그 수정 및 최적화
- 문서 작성 및 주석 생성
- 테스트 코드 작성

### 프로젝트 기반 학습
강의를 마치면 **완전히 동작하는 풀스택 애플리케이션**을 완성하게 됩니다. 이 프로젝트는 포트폴리오로도 활용할 수 있습니다.

### 커뮤니티 지원
- Discord 채널을 통한 질문 및 답변
- 정기적인 라이브 세션
- 프로젝트 코드 리뷰
- 취업 및 포트폴리오 상담

---

## 🛠️ 사용 기술 스택

### 프론트엔드
- **Next.js 16**: React 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **shadcn/ui**: UI 컴포넌트

### 백엔드
- **Supabase**: BaaS (Backend as a Service)
- **PostgreSQL**: 데이터베이스
- **Supabase Auth**: 인증 시스템
- **Supabase Storage**: 파일 저장소

### 개발 도구
- **Cursor AI**: AI 기반 코드 에디터
- **Git & GitHub**: 버전 관리
- **Vercel**: 배포 플랫폼

---

## 💡 학습 후 기대 효과

이 강의를 완료하면 다음과 같은 능력을 갖추게 됩니다:

1. **풀스택 개발 능력**: 프론트엔드와 백엔드를 모두 다룰 수 있습니다
2. **최신 기술 활용**: 2026년 최신 기술 스택을 실무에 적용할 수 있습니다
3. **AI 도구 활용**: Cursor AI를 활용하여 개발 생산성을 높일 수 있습니다
4. **실전 프로젝트 경험**: 완성된 프로젝트를 포트폴리오로 활용할 수 있습니다
5. **문제 해결 능력**: 스스로 문제를 해결하고 학습할 수 있는 능력을 기릅니다

---

## 📞 문의사항

강의에 대한 문의사항이 있으시면 언제든지 연락주세요!

- 이메일: support@example.com
- Discord: 강의 커뮤니티 참여'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 완료 메시지
-- ============================================
-- 모든 테이블과 정책이 성공적으로 생성되었습니다.
-- 이제 구매 기능을 사용할 수 있습니다.
-- 
-- 참고: 
-- - 프론트엔드에서는 강의 정보를 조회하지 않고 기본값을 사용합니다.
-- - 구매 시에만 Supabase에서 첫 번째 강의를 찾아서 사용합니다.
-- - 단일 강의만 운영하므로 courses 테이블에는 하나의 강의만 저장됩니다.
