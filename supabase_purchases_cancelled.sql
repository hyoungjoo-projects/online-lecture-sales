-- ============================================
-- 구매 취소 기능: payment_status에 'cancelled' 추가 및
-- 관리자가 구매 내역을 취소(상태 변경)할 수 있도록 RLS 정책 추가
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- ============================================

-- 1. payment_status CHECK 제약에 'cancelled' 추가
--    (기존 제약 삭제 후 새로 생성. 제약 이름이 다르면 Supabase Table Editor에서 확인 후 수동으로 삭제)
ALTER TABLE public.purchases
DROP CONSTRAINT IF EXISTS purchases_payment_status_check;

ALTER TABLE public.purchases
ADD CONSTRAINT purchases_payment_status_check
CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'));

-- 2. 관리자는 구매 내역의 payment_status를 업데이트 가능 (취소 처리)
DROP POLICY IF EXISTS "Admins can update purchases" ON public.purchases;
CREATE POLICY "Admins can update purchases"
  ON public.purchases
  FOR UPDATE
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());
