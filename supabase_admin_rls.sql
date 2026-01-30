-- ============================================
-- 관리자용 RLS 정책: profiles.is_admin = true 인 사용자가
-- 전체 구매 내역·전체 프로필을 조회할 수 있도록 합니다.
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
--
-- 주의: profiles 정책에서 profiles를 직접 조회하면 무한 재귀가 발생하므로,
-- SECURITY DEFINER 함수로 is_admin 여부만 검사합니다.
-- ============================================

-- 0. 관리자 여부 검사 함수 (RLS 없이 조회 → 재귀 방지)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

-- 1. 관리자는 모든 구매 내역 조회 가능
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases"
  ON public.purchases
  FOR SELECT
  USING (public.is_admin_user());

-- 2. 관리자는 모든 프로필 조회 가능 (총 사용자 수 등)
--    (profiles를 직접 SELECT 하지 않고 함수 사용 → 무한 재귀 방지)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin_user());
