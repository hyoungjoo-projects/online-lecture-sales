"use client";

import { useState, useEffect } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import AuthButton from "@/components/AuthButton";
import { createClient } from "@/lib/supabase/client";

/**
 * 관리자 여부 판별 (fallback): profiles.is_admin이 없을 때만 사용.
 * 환경 변수 NEXT_PUBLIC_ADMIN_EMAILS(쉼표 구분) 또는 user_metadata.role === 'admin'
 */
function isAdminFallback(user) {
  if (!user) return false;
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  const adminEmails = adminEmailsEnv
    ? adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  const email = (user.email || "").toLowerCase();
  if (adminEmails.includes(email)) return true;
  if (user.user_metadata?.role === "admin") return true;
  return false;
}

export default function NavBar({ productsContent, managementContent, myPurchasesContent, value, onValueChange }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // DB의 profile.is_admin이 true(또는 truthy)이거나, profile 없/실패 시 env·metadata fallback 사용
  const isAdmin =
    (profile != null && Boolean(profile.is_admin)) || (user != null && isAdminFallback(user));

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const setUserAndLoadProfile = async (u) => {
      setUser(u ?? null);
      if (!u) {
        setProfile(null);
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const { data: p, error: profileError } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", u.id)
          .maybeSingle();
        if (!cancelled) {
          setProfile(profileError ? null : p ?? null);
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!cancelled) setUserAndLoadProfile(u ?? null);
    }).catch((err) => {
      if (!cancelled && err?.name !== "AbortError") setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setUserAndLoadProfile(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // 관리 탭이 아닌 사용자가 ?tab=management 로 왔을 때 상품 탭으로 전환 (빈 화면 방지)
  useEffect(() => {
    if (!loading && value === "management" && !isAdmin && onValueChange) {
      onValueChange("products");
    }
    // 로그인하지 않은 사용자가 ?tab=my-purchases 로 왔을 때 상품 탭으로 전환
    if (!loading && value === "my-purchases" && !user && onValueChange) {
      onValueChange("products");
    }
  }, [loading, value, isAdmin, user, onValueChange]);

  return (
    <Tabs
      value={value ?? "products"}
      onValueChange={onValueChange}
      className="w-full"
    >
      <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm flex items-center justify-between px-2 sm:px-4 lg:px-6 h-16 sm:h-18 min-h-[64px] gap-2">
        <div className="flex-shrink-0">
          <TabsList className="inline-flex h-9 sm:h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger
              value="products"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 text-sm sm:text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              상품
            </TabsTrigger>
            {!loading && user && (
              <TabsTrigger
                value="my-purchases"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-sm sm:text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                구매 내역
              </TabsTrigger>
            )}
            {!loading && isAdmin && (
              <TabsTrigger
                value="management"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-sm sm:text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                관리
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        <div className="flex items-center flex-shrink-0 ml-auto">
          <AuthButton />
        </div>
      </nav>
      <TabsContent value="products" className="mt-2">
        {productsContent}
      </TabsContent>
      {user && (
        <TabsContent value="my-purchases" className="mt-2">
          {myPurchasesContent}
        </TabsContent>
      )}
      {isAdmin && (
        <TabsContent value="management" className="mt-2">
          {managementContent}
        </TabsContent>
      )}
    </Tabs>
  );
}
