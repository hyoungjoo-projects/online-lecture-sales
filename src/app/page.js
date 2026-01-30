"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import CourseDetail from "@/components/CourseDetail";
import AdminDashboard from "@/components/AdminDashboard";
import MyPurchases from "@/components/MyPurchases";
import PurchaseButton from "@/components/PurchaseButton";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // URL에서 에러 파라미터 제거
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  // 결제 완료 후 "구매 내역 확인" 등으로 /?tab=management 또는 /?tab=my-purchases 이동 시 해당 탭 열기
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'management' || tab === 'products' || tab === 'my-purchases') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 강의 정보 상수 (단일 강의만 진행)
  const COURSE_TITLE = "AI 시대의 풀스택 개발자 되기: Next.js × Supabase × Cursor AI";
  const COURSE_DESCRIPTION = "💻 단순히 코드를 배우는 것을 넘어 🚀 Cursor AI와 함께 실전 프로젝트를 완성하며, 현업 개발자의 사고방식을 익히세요. 💡 아이디어 발상, ✍️ 기획, 🖥️ 서비스 배포까지, 당신의 상상을 실제 제품으로 만드는 완전한 여정을 시작하세요.";
  const ORIGINAL_PRICE = 150000;
  const DISCOUNTED_PRICE = 99000;
  const IMAGE_SRC = "/programming-code-abstract-screen-software-600nw-2526471169.webp";
  
  // courseId는 구매 API에서 첫 번째 강의를 찾아서 사용
  // 또는 null로 전달하여 구매 API에서 처리하도록 함
  const courseId = null;

  return (
    <main className="flex min-h-screen w-full max-w-3xl mx-auto flex-col py-4 px-4 sm:px-6 lg:py-8 lg:px-8">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            <strong>로그인 오류:</strong> {error}
            <br />
            <span className="text-sm mt-2 block">
              카카오 개발자 센터에서 이메일 동의 항목이 활성화되어 있는지 확인해주세요.
            </span>
          </AlertDescription>
        </Alert>
      )}
      <NavBar
        value={activeTab}
        onValueChange={setActiveTab}
        productsContent={
          <>
            <HeroSection
              title={COURSE_TITLE}
              description={COURSE_DESCRIPTION}
              originalPrice={ORIGINAL_PRICE}
              discountedPrice={DISCOUNTED_PRICE}
              imageSrc={IMAGE_SRC}
            />
            <CourseDetail 
              courseId={courseId}
              price={DISCOUNTED_PRICE}
              title={COURSE_TITLE}
            />
          </>
        }
        myPurchasesContent={<MyPurchases />}
        managementContent={<AdminDashboard />}
      />
      {/* 플로팅 구매 버튼: 상품 탭일 때만 표시 */}
      {activeTab === "products" && (
        <PurchaseButton
          courseId={courseId}
          price={DISCOUNTED_PRICE}
          title={COURSE_TITLE}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen w-full max-w-3xl mx-auto flex-col py-4 px-4 sm:px-6 lg:py-8 lg:px-8">
        <div className="text-center py-8">로딩 중...</div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
