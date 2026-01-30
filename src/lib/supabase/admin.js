import { createClient } from '@supabase/supabase-js';

/**
 * 서버 전용 Supabase Admin 클라이언트 (Service Role Key).
 * RLS를 우회하여 구매 내역 저장 등에 사용한다.
 * 절대 클라이언트에 노출하지 말 것.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY(또는 NEXT_PUBLIC_SUPABASE_URL)가 설정되지 않았습니다.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
