"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function AuthButton() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // 최신 Supabase는 PUBLISHABLE_KEY를 사용하지만, 기존 ANON_KEY도 호환성을 위해 지원
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    // 환경 변수 확인
    if (!supabaseUrl || !supabaseKey) {
      setHasConfig(false);
      setLoading(false);
      return;
    }

    // 현재 사용자 확인 (언마운트 시 AbortError 무시)
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (cancelled) return;
      if (error && error.message.includes('placeholder')) {
        setHasConfig(false);
      } else {
        setUser(user);
      }
      setLoading(false);
    }).catch((err) => {
      if (cancelled || err?.name === 'AbortError') return;
      setHasConfig(false);
      setLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, supabaseUrl, supabaseKey]);

  const handleKakaoLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("카카오 로그인 오류:", error);
        setLoginError(error.message);
        setIsLoggingIn(false);
        // 에러가 발생해도 사용자가 재시도할 수 있도록 상태를 유지
      }
      // 성공 시 리다이렉트되므로 여기서는 아무것도 하지 않음
    } catch (error) {
      console.error("로그인 처리 오류:", error);
      setLoginError("로그인 처리 중 오류가 발생했습니다.");
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("로그아웃 오류:", error);
        alert("로그아웃에 실패했습니다: " + error.message);
        return;
      }
      // 앱 세션은 삭제됨. 바로 로그인 시 카카오 쪽 세션이 남아 있으면
      // 카카오가 로그인 화면 없이 바로 리다이렉트해 '즉시 로그인'처럼 보일 수 있음.
      // 카카오 계정까지 로그아웃하려면 아래 주석을 해제하고, 카카오 개발자 콘솔에
      // 로그아웃 후 리다이렉트 URI를 등록해야 할 수 있음.
      // window.location.href = `https://accounts.kakao.com/logout?logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    } catch (error) {
      console.error("로그아웃 처리 오류:", error);
      alert("로그아웃 처리 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <Button disabled className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
        로딩 중...
      </Button>
    );
  }

  if (!hasConfig) {
    return (
      <div className="text-xs text-muted-foreground px-2">
        Supabase 설정 필요
      </div>
    );
  }

  if (user) {
    const displayName = user.email || user.user_metadata?.name || user.user_metadata?.full_name || "사용자";
    // 이메일인 경우 앞부분만 표시 (예: "mclleehj@gmail.com" -> "mclleehj")
    const shortName = displayName.includes('@') 
      ? displayName.split('@')[0] 
      : displayName;
    
    // 아바타 이미지 URL (카카오 로그인 시 프로필 이미지)
    const avatarUrl = user.user_metadata?.avatar_url || 
                      user.user_metadata?.picture || 
                      user.user_metadata?.profile_image;
    
    // 이니셜 생성 (이름의 첫 글자 또는 이메일의 첫 글자)
    const getInitials = (name) => {
      if (!name) return "U";
      if (name.includes('@')) {
        return name.split('@')[0].charAt(0).toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    };
    const initials = getInitials(displayName);
    
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Avatar size="default" className="flex-shrink-0">
          {avatarUrl && (
            <AvatarImage src={avatarUrl} alt={displayName} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm sm:text-base text-muted-foreground truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">
          <span className="hidden sm:inline">{displayName}</span>
          <span className="sm:hidden">{shortName}</span>
        </span>
        <Button onClick={handleLogout} variant="outline" className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
          로그아웃
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {loginError && (
        <div className="text-xs text-destructive max-w-[150px] sm:max-w-[200px] text-right truncate">
          {loginError}
        </div>
      )}
      <Button 
        onClick={handleKakaoLogin} 
        disabled={isLoggingIn}
        className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
      >
        {isLoggingIn ? "로그인 중..." : "카카오로 로그인"}
      </Button>
    </div>
  );
}
