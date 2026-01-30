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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

function formatCurrency(amount) {
  return `₩${Number(amount).toLocaleString()}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 최근 6개월 (가장 오래된 달 → 가장 최근 달 순, 맨 오른쪽이 최신) */
function getLastSixMonths() {
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
    result.push({ monthKey, label });
  }
  return result;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSales, setTotalSales] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [monthlySales, setMonthlySales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        setLoading(true);
        setError(null);

        const [purchasesRes, profilesRes, recentRes] = await Promise.all([
          supabase
            .from("purchases")
            .select("price, created_at")
            .eq("payment_status", "completed"),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("purchases")
            .select("id, user_id, price, payment_status, created_at")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (cancelled) return;

        if (purchasesRes.error) throw purchasesRes.error;
        if (profilesRes.error) throw profilesRes.error;
        if (recentRes.error) throw recentRes.error;

        const completed = purchasesRes.data || [];
        const sales = completed.reduce((sum, row) => sum + (row.price || 0), 0);
        setTotalSales(sales);

        const byMonth = {};
        completed.forEach((row) => {
          const d = row.created_at ? new Date(row.created_at) : null;
          if (!d) return;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          byMonth[key] = (byMonth[key] || 0) + (row.price || 0);
        });
        const monthly = Object.entries(byMonth)
          .map(([monthKey, amount]) => ({
            monthKey,
            label: new Date(monthKey + "-01").toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
            }),
            amount,
          }))
          .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
          .slice(0, 6);
        setMonthlySales(monthly);

        setTotalUsers(profilesRes.count ?? 0);

        const recent = recentRes.data || [];
        if (recent.length === 0) {
          setRecentPurchases([]);
          setLoading(false);
          return;
        }

        const userIds = [...new Set(recent.map((p) => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, name")
          .in("id", userIds);

        if (cancelled) return;

        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});

        setRecentPurchases(
          recent.map((p) => ({
            ...p,
            user: profileMap[p.user_id] || { email: "-", name: "-" },
          }))
        );
      } catch (err) {
        if (!cancelled) {
          console.error("관리자 대시보드 로드 오류:", err);
          setError(err.message || "데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();
    return () => { cancelled = true; };
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">관리자 대시보드</h2>
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">관리자 대시보드</h2>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const statusMap = {
    completed: { label: "완료", variant: "default" },
    pending: { label: "대기", variant: "secondary" },
    failed: { label: "실패", variant: "destructive" },
    refunded: { label: "환불", variant: "outline" },
    cancelled: { label: "취소", variant: "outline" },
  };

  const canCancel = (status) =>
    status === "completed" || status === "pending";

  const handleCancelPurchase = async (purchaseId) => {
    setCancellingId(purchaseId);
    try {
      const { error } = await supabase
        .from("purchases")
        .update({
          payment_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchaseId);

      if (error) throw error;
      setRecentPurchases((prev) =>
        prev.map((p) =>
          p.id === purchaseId ? { ...p, payment_status: "cancelled" } : p
        )
      );
      setTotalSales((prev) => {
        const p = recentPurchases.find((x) => x.id === purchaseId);
        return p && p.payment_status === "completed" ? prev - (p.price || 0) : prev;
      });
      setMonthlySales((prev) => {
        const p = recentPurchases.find((x) => x.id === purchaseId);
        if (!p || p.payment_status !== "completed" || !p.created_at) return prev;
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return prev.map((m) =>
          m.monthKey === key
            ? { ...m, amount: Math.max(0, (m.amount || 0) - (p.price || 0)) }
            : m
        );
      });
    } catch (err) {
      console.error("구매 취소 오류:", err);
      alert("취소 처리에 실패했습니다: " + (err.message || err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">관리자 대시보드</h2>
      <p className="text-muted-foreground">
        온라인 강의 플랫폼 총 매출·사용자·최근 구매 내역입니다.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">총 매출액</CardTitle>
            <CardDescription>결제 완료 기준</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">총 사용자</CardTitle>
            <CardDescription>가입 프로필 수</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsers.toLocaleString()}명</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 6개월 매출 현황</CardTitle>
          <CardDescription>결제 완료 기준, 최근 6개월 월별 합계</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full min-h-[320px] overflow-visible">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={getLastSixMonths().map(({ monthKey, label }) => ({
                  monthKey,
                  name: label,
                  매출: monthlySales.find((m) => m.monthKey === monthKey)?.amount ?? 0,
                }))}
                margin={{ top: 36, right: 12, left: 12, bottom: 12 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => (v >= 10000 ? `${v / 10000}만` : v.toLocaleString())}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "매출"]}
                  labelFormatter={(label) => label}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Bar
                  dataKey="매출"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  fill="hsl(var(--primary))"
                >
                  <LabelList
                    dataKey="매출"
                    position="top"
                    formatter={(v) => (v === 0 ? "" : formatCurrency(v))}
                    className="fill-foreground"
                    style={{ fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 구매 내역</CardTitle>
          <CardDescription>최근 10건</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPurchases.length === 0 ? (
            <p className="text-muted-foreground">구매 내역이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {recentPurchases.map((p) => {
                const statusInfo = statusMap[p.payment_status] || {
                  label: p.payment_status,
                  variant: "secondary",
                };
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {p.user?.name || p.user?.email || "-"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {p.user?.email || "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <span className="font-medium">
                        {formatCurrency(p.price)}
                      </span>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(p.created_at)}
                      </span>
                      {canCancel(p.payment_status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancellingId === p.id}
                          onClick={() => handleCancelPurchase(p.id)}
                          className="shrink-0"
                        >
                          {cancellingId === p.id ? "처리 중..." : "취소"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
