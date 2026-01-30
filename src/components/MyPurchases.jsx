"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function MyPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const supabase = createClient();

        // 현재 사용자 확인
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError('로그인이 필요합니다.');
          setLoading(false);
          return;
        }

        // 자신의 구매 내역만 조회 (RLS로 보호됨)
        const { data, error: purchaseError } = await supabase
          .from('purchases')
          .select(`
            id,
            price,
            payment_status,
            created_at,
            updated_at,
            courses (
              title,
              description
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (purchaseError) {
          console.error('구매 내역 조회 오류:', purchaseError);
          setError('구매 내역을 불러올 수 없습니다.');
        } else {
          setPurchases(data || []);
        }
      } catch (err) {
        console.error('구매 내역 로드 오류:', err);
        setError('구매 내역을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">구매 내역이 없습니다.</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { text: '결제 완료', color: 'bg-green-100 text-green-800' },
      pending: { text: '결제 대기', color: 'bg-yellow-100 text-yellow-800' },
      failed: { text: '결제 실패', color: 'bg-red-100 text-red-800' },
      refunded: { text: '환불 완료', color: 'bg-gray-100 text-gray-800' },
      cancelled: { text: '취소됨', color: 'bg-gray-100 text-gray-800' },
    };
    const { text, color } = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${color}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">구매 내역</h2>
      <div className="space-y-4">
        {purchases.map((purchase) => (
          <Card key={purchase.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {purchase.courses?.title || 'AI 시대의 풀스택 개발자 되기'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    구매일: {new Date(purchase.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardDescription>
                </div>
                <div className="ml-4">
                  {getStatusBadge(purchase.payment_status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">결제 금액:</span>
                  <span className="font-semibold">₩{purchase.price?.toLocaleString()}</span>
                </div>
                {purchase.updated_at !== purchase.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">최종 수정:</span>
                    <span className="text-xs">
                      {new Date(purchase.updated_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
