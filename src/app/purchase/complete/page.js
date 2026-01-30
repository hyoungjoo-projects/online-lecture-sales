"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

function PurchaseCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paymentId = searchParams.get('paymentId') || searchParams.get('payment_id');

  useEffect(() => {
    // 결제 완료 후 구매 내역 저장 시도
    const completePurchase = async () => {
      try {
        // 모든 쿼리 파라미터 로그 출력 (디버깅)
        const allParams = {};
        searchParams.forEach((value, key) => {
          allParams[key] = value;
        });
        console.log('결제 완료 페이지 쿼리 파라미터:', allParams);
        
        // 포트원 v2 redirect 방식에서 쿼리 문자열로 전달되는 파라미터
        // 문서: https://developers.portone.io/opi/ko/integration/start/v2/checkout?v=v2
        // 주요 필드: paymentId(payment_id), code, message, pgCode, pgMessage, txId
        const paymentId = searchParams.get('paymentId') || searchParams.get('payment_id') || allParams.paymentId || allParams.payment_id;
        const code = searchParams.get('code') || allParams.code;
        const message = searchParams.get('message') || allParams.message;
        const txId = searchParams.get('txId')
          || searchParams.get('tx_id')
          || searchParams.get('transactionId')
          || allParams.txId
          || allParams.tx_id
          || allParams.transactionId;
        
        console.log('추출된 결제 정보:', { paymentId, code, message, txId });
        
        // code가 있으면 결제 실패
        if (code) {
          setError(message || '결제가 실패했습니다.');
          setLoading(false);
          return;
        }
        
        // 기본 강의 정보 (단일 강의 운영)
        const defaultPrice = 99000;
        const defaultTitle = 'AI 시대의 풀스택 개발자 되기: Next.js × Supabase × Cursor AI';
        
        // paymentId가 필수 (redirect 방식에서 쿼리 문자열로 전달됨)
        if (paymentId) {
          // 구매 내역 저장 (이미 저장되었을 수도 있음)
          try {
            const response = await fetch('/api/purchase', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                courseId: null,
                price: defaultPrice,
                title: defaultTitle,
                paymentId: paymentId,
              }),
            });

            // 응답 텍스트 먼저 확인
            const responseText = await response.text();
            console.log('서버 응답 원본:', responseText);
            console.log('응답 상태:', response.status, response.statusText);

            let data;
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('JSON 파싱 오류:', parseError);
              console.error('응답 텍스트:', responseText);
              setError('서버 응답을 파싱할 수 없습니다.');
              setLoading(false);
              return;
            }
            
            if (!response.ok) {
              // 이미 구매한 경우는 에러로 처리하지 않음
              if (!data.error?.includes('이미 구매')) {
                console.error('구매 내역 저장 오류:', {
                  status: response.status,
                  statusText: response.statusText,
                  error: data.error,
                  details: data.details,
                  code: data.code,
                  type: data.type,
                  fullData: data
                });
                const errorMessage = data.error || '구매 처리 중 오류가 발생했습니다.';
                const errorDetails = data.details ? ` (${data.details})` : '';
                if (response.status === 401) {
                  setError(
                    '로그인 세션이 만료되었거나 리다이렉트 중에 로그인 정보가 전달되지 않았을 수 있습니다. 다시 로그인한 뒤 "구매 내역 확인"에서 결제 내역을 확인해 주세요.'
                  );
                } else {
                  setError(errorMessage + errorDetails);
                }
              } else {
                console.log('이미 구매한 강의입니다.');
              }
            } else {
              console.log('구매 내역 저장 성공:', data);
            }
          } catch (fetchError) {
            console.error('구매 내역 저장 요청 오류:', fetchError);
            setError('구매 내역 저장 요청 중 오류가 발생했습니다: ' + fetchError.message);
          }
        } else {
          // paymentId가 없으면 경고만 표시하고 성공 화면은 표시
          console.warn('결제 ID를 찾을 수 없습니다. 쿼리 파라미터:', allParams);
          // paymentId가 없어도 성공 화면은 표시 (웹훅에서 처리될 수 있음)
        }
      } catch (err) {
        console.error('구매 완료 처리 오류:', err);
        setError('구매 완료 처리 중 오류가 발생했습니다: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    completePurchase();
  }, [searchParams]);

  if (loading) {
    return (
      <main className="flex min-h-screen w-full max-w-3xl mx-auto flex-col items-center justify-center py-8 px-4">
        <div className="text-center">
          <p className="text-lg">결제 정보를 확인하는 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full max-w-3xl mx-auto flex-col items-center justify-center py-8 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">결제가 완료되었습니다!</CardTitle>
          <CardDescription className="mt-2">
            수강권 구매가 성공적으로 완료되었습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          {paymentId && (
            <div className="text-sm text-muted-foreground text-center">
              결제 번호: {paymentId}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/?tab=my-purchases">구매 내역 확인</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function PurchaseCompletePage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen w-full max-w-3xl mx-auto flex-col items-center justify-center py-8 px-4">
        <div className="text-center">
          <p className="text-lg">로딩 중...</p>
        </div>
      </main>
    }>
      <PurchaseCompleteContent />
    </Suspense>
  );
}
