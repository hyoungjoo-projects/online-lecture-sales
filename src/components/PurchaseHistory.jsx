"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      setUser(user);
      if (user) {
        loadPurchaseHistory(user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled && err?.name !== 'AbortError') setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        loadPurchaseHistory(session.user.id);
      } else {
        setPurchases([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const loadPurchaseHistory = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          price,
          payment_status,
          created_at,
          courses (
            id,
            title,
            description,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('구매 내역 로드 오류:', error);
        return;
      }

      setPurchases(data || []);
    } catch (err) {
      console.error('구매 내역 로드 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>구매 내역</CardTitle>
          <CardDescription>로그인 후 구매 내역을 확인할 수 있습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>구매 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <p>로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>구매 내역</CardTitle>
          <CardDescription>아직 구매한 강의가 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { label: '완료', variant: 'default' },
      pending: { label: '대기', variant: 'secondary' },
      failed: { label: '실패', variant: 'destructive' },
      refunded: { label: '환불', variant: 'outline' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>구매 내역</CardTitle>
          <CardDescription>총 {purchases.length}개의 강의를 구매하셨습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const course = purchase.courses;
              if (!course) return null;

              return (
                <Card key={purchase.id} className="border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        {course.description && (
                          <CardDescription className="mt-1">
                            {course.description.substring(0, 100)}
                            {course.description.length > 100 ? '...' : ''}
                          </CardDescription>
                        )}
                      </div>
                      {getStatusBadge(purchase.payment_status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          구매일: {formatDate(purchase.created_at)}
                        </p>
                        <p className="text-lg font-semibold mt-1">
                          ₩{purchase.price.toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        강의 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
