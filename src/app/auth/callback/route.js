import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // 카카오에서 오류가 발생한 경우
  if (error_description) {
    console.error('카카오 로그인 오류:', error_description)
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error_description)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('세션 교환 오류:', error)
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`)
    }

    // 사용자 정보가 있으면 profiles 테이블에 저장/업데이트
    if (user) {
      try {
        // 카카오에서 받은 사용자 정보 추출
        const email = user.email || user.user_metadata?.email
        const name = user.user_metadata?.name || 
                    user.user_metadata?.full_name || 
                    user.user_metadata?.nickname || 
                    email?.split('@')[0] || 
                    '사용자'
        const avatarUrl = user.user_metadata?.avatar_url || 
                         user.user_metadata?.picture || 
                         user.user_metadata?.profile_image || 
                         null

        // profiles 테이블에 upsert (있으면 업데이트, 없으면 생성)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: email,
            name: name,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.error('프로필 저장 오류:', profileError)
          // 프로필 저장 실패해도 로그인은 성공으로 처리
        }
      } catch (profileErr) {
        console.error('프로필 처리 중 오류:', profileErr)
        // 프로필 저장 실패해도 로그인은 성공으로 처리
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // 코드가 없는 경우 홈으로 리다이렉트
  return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('로그인 코드를 받지 못했습니다.')}`)
}
