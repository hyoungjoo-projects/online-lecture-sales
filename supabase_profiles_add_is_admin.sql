-- profiles 테이블에 is_admin 컬럼 추가
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- 기존 profiles 테이블이 있을 때만 실행합니다.

-- 1. is_admin 컬럼 추가 (없을 때만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;
    RAISE NOTICE 'profiles.is_admin 컬럼을 추가했습니다.';
  ELSE
    RAISE NOTICE 'profiles.is_admin 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 2. 관리자 지정 예시 (필요 시 수동 실행)
-- UPDATE public.profiles SET is_admin = true WHERE email = 'admin@example.com';
