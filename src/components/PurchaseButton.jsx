"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as PortOne from "@portone/browser-sdk/v2";

export default function PurchaseButton({ 
  courseId, 
  price, 
  title 
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const supabase = createClient();

  // 포트원 설정 (환경 변수에서 가져오기)
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || '';
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || '';

  useEffect(() => {
    let cancelled = false;

    const checkUserAndPurchase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setUser(user);
        if (user && courseId) {
          await checkPurchaseStatus(user.id);
        }
      } catch (err) {
        if (cancelled || err?.name === 'AbortError') return;
        console.error('사용자 확인 오류:', err);
      } finally {
        if (!cancelled) setCheckingPurchase(false);
      }
    };

    checkUserAndPurchase();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (session?.user && courseId) {
        await checkPurchaseStatus(session.user.id);
      } else {
        setAlreadyPurchased(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, courseId]);

  const checkPurchaseStatus = async (userId) => {
    if (!courseId) return;
    
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle(); // maybeSingle은 데이터가 없어도 에러를 발생시키지 않음

      if (error) {
        console.error('구매 내역 확인 오류:', error);
        return;
      }

      setAlreadyPurchased(!!data);
    } catch (err) {
      console.error('구매 내역 확인 중 오류:', err);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      alert('구매하려면 먼저 로그인해주세요.');
      return;
    }

    if (alreadyPurchased) {
      alert('이미 구매한 강의입니다.');
      return;
    }

    if (!storeId || !channelKey) {
      setError('결제 시스템이 설정되지 않았습니다. 환경 변수를 확인하세요.');
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      // 고유 결제 ID 생성
      const uniquePaymentId = `payment_${Date.now()}_${user.id.substring(0, 8)}`;
      
      // 고객 정보 준비
      const customerName = user.user_metadata?.name || user.email?.split('@')[0] || '고객';
      const customerEmail = user.email || '';
      const customerPhone = user.user_metadata?.phone || '010-0000-0000'; // 전화번호가 없으면 기본값 사용
      
      // 포트원 v2 결제 요청
      // redirect 방식 사용: forceRedirect: true로 PC에서도 redirect 방식 강제
      // redirect 방식에서는 함수 호출 결과를 이용할 수 없고, 
      // 결제 완료 후 redirectUrl로 리다이렉트되며 쿼리 문자열로 결과가 전달됩니다.
      const redirectUrl = `${window.location.origin}/purchase/complete`;
      
      PortOne.requestPayment({
        storeId: storeId,
        channelKey: channelKey,
        paymentId: uniquePaymentId,
        orderName: title,
        totalAmount: price,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD', // 카드 결제
        customer: {
          fullName: customerName,
          email: customerEmail,
          phoneNumber: customerPhone, // 비어있지 않은 문자열 필수
        },
        customData: {
          courseId: courseId,
          userId: user.id,
          price: price,
          title: title,
        },
        noticeUrl: `${window.location.origin}/api/payment/webhook`,
        redirectUrl: redirectUrl, // redirect 방식 필수: http:// 또는 https://로 시작해야 함
        forceRedirect: true, // PC에서도 redirect 방식 강제
      })
        .then((result) => {
          // forceRedirect: true를 사용하면 redirect 방식이므로
          // 이 코드는 실행되지 않을 수 있습니다.
          // 하지만 일부 경우(모바일에서 redirectUrl 없이 호출 등)에는 실행될 수 있습니다.
          console.log('결제 결과 (iframe 방식):', result);
          
          if (result && result.code) {
            // 결제 실패
            setError(result.message || '결제가 실패했습니다.');
            setPurchasing(false);
          } else if (result && result.paymentId) {
            // 결제 성공 - iframe 방식일 경우 수동으로 리다이렉트
            window.location.href = `${redirectUrl}?paymentId=${result.paymentId}`;
          }
        })
        .catch((err) => {
          // 에러 발생 시
          console.error('구매 오류:', err);
          
          // 사용자가 결제를 취소한 경우
          if (err.code === 'USER_CANCEL' || err.message?.includes('취소') || err.code === 'CANCELED') {
            setError('결제가 취소되었습니다.');
          } else {
            setError(err.message || '결제 처리 중 오류가 발생했습니다.');
          }
          setPurchasing(false);
        });

      // requestPayment는 결제창을 열고, 결제 완료 후 redirectUrl로 리다이렉트됩니다.
      // 포트원이 자동으로 paymentId, txId 등의 쿼리 파라미터를 redirectUrl에 추가합니다.
      // 따라서 여기서는 결제창이 열리는 것만 처리하고, 실제 구매 내역 저장은
      // 결제 완료 페이지에서 포트원이 제공하는 쿼리 파라미터를 사용하여 처리합니다.
      
      // 결제창이 열리면 바로 상태 리셋 (약간의 지연을 두어 결제창이 열리는 것을 확인)
      // 결제창이 열렸다는 것은 사용자가 결제를 진행할 수 있다는 의미
      setTimeout(() => {
        setPurchasing(false);
      }, 500);
    } catch (err) {
      console.error('구매 오류:', err);
      
      // 사용자가 결제를 취소한 경우
      if (err.code === 'USER_CANCEL' || err.message?.includes('취소') || err.code === 'CANCELED') {
        setError('결제가 취소되었습니다.');
      } else {
        setError(err.message || '결제 처리 중 오류가 발생했습니다.');
      }
      setPurchasing(false);
    }
  };

  // 공통 버튼 스타일
  const buttonStyle = {
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '18px',
  };

  // 플로팅 버튼 컨테이너 스타일
  const floatingContainerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  // 구매 상태 확인 중
  if (checkingPurchase) {
    return (
      <div style={floatingContainerStyle} className="max-w-3xl mx-auto">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-lg font-bold text-gray-700 px-6">
            <span>수강권 구매하기</span>
            <span>₩{price ? price.toLocaleString() : '0'}</span>
          </div>
          <div className="px-6">
            <Button 
              disabled 
              className="w-full !bg-black !text-white hover:!bg-gray-900 text-lg font-bold rounded-xl" 
              size="lg"
              style={buttonStyle}
            >
              확인 중...
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 이미 구매한 경우
  if (alreadyPurchased) {
    return (
      <div style={floatingContainerStyle} className="max-w-3xl mx-auto">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-lg font-bold text-gray-700 px-6">
            <span>수강권 구매하기</span>
            <span>₩{price ? price.toLocaleString() : '0'}</span>
          </div>
          <div className="px-6">
            <Button 
              disabled 
              className="w-full bg-gray-400 text-white text-lg font-bold rounded-xl" 
              size="lg"
              style={{ ...buttonStyle, backgroundColor: '#9ca3af' }}
            >
              ✓ 구매 완료
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div style={floatingContainerStyle} className="max-w-3xl mx-auto">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-lg font-bold text-gray-700 px-6">
            <span>수강권 구매하기</span>
            <span>₩{price ? price.toLocaleString() : '0'}</span>
          </div>
          <div className="px-6">
            <Button 
              onClick={() => alert('구매하려면 먼저 로그인해주세요.')} 
              className="w-full !bg-black !text-white hover:!bg-gray-900 text-lg font-bold rounded-xl" 
              size="lg"
              style={buttonStyle}
            >
              로그인 후 결제하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 구매 버튼
  return (
    <div style={floatingContainerStyle} className="max-w-3xl mx-auto">
      <div className="space-y-2">
        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex justify-between items-center text-lg font-bold text-gray-700 px-6">
          <span>수강권 구매하기</span>
          <span>₩{price ? price.toLocaleString() : '0'}</span>
        </div>
        <div className="px-6">
          <Button
            onClick={handlePurchase}
            disabled={purchasing || !storeId || !channelKey}
            className="w-full !bg-black !text-white hover:!bg-gray-900 disabled:!bg-gray-400 text-lg font-bold rounded-xl"
            size="lg"
            style={buttonStyle}
          >
            {purchasing ? '결제 처리 중...' : '결제하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
