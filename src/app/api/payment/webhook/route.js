import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * 포트원 결제 웹훅 API
 *
 * 포트원에서 결제 상태 변경 시 호출된다. 세션 없이 호출되므로 Admin 클라이언트로
 * purchases 테이블에 INSERT/UPDATE하여 결제 완료 시 DB가 반드시 갱신되도록 한다.
 *
 * @route POST /api/payment/webhook
 */
export async function POST(request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('웹훅: SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { event, data } = body;

    console.log('포트원 웹훅 이벤트:', event, data);

    if (event === 'PAYMENT_STATUS_CHANGED' || event === 'payment.status.changed') {
      const paymentId = data.paymentId ?? data.payment_id;
      const status = data.status;

      if ((status === 'PAID' || status === 'paid') && paymentId) {
        const admin = createAdminClient();

        // paymentId로 기존 구매 내역 확인
        const { data: existingPurchase, error: checkError } = await admin
          .from('purchases')
          .select('id')
          .eq('payment_id', paymentId)
          .maybeSingle();

        if (checkError) {
          console.error('웹훅 구매 내역 확인 오류:', checkError);
        }

        if (existingPurchase) {
          const updatePayload = {
            payment_status: 'completed',
            payment_id: paymentId,
          };

          const { error } = await admin
            .from('purchases')
            .update(updatePayload)
            .eq('payment_id', paymentId);

          if (error) {
            console.error('웹훅 구매 내역 업데이트 오류:', error);
            return NextResponse.json(
              { error: '구매 내역 업데이트 실패', details: error.message },
              { status: 500 }
            );
          }
          console.log('웹훅 구매 내역 업데이트 성공:', paymentId);
        } else {
          const customData = data.customData || {};
          const userId = customData.userId;

          if (!userId) {
            console.warn('웹훅: customData.userId 없음. 결제 완료 페이지에서 /api/purchase 호출로 저장될 수 있음.');
            return NextResponse.json({ success: true });
          }

          const { data: courses, error: courseError } = await admin
            .from('courses')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1);

          if (courseError || !courses?.length) {
            console.error('웹훅 강의 조회 오류:', courseError);
            return NextResponse.json(
              { error: '강의 정보 조회 실패' },
              { status: 500 }
            );
          }

          const courseId = courses[0].id;
          const price = customData.price ?? 99000;

          const insertPayload = {
            user_id: userId,
            course_id: courseId,
            price: Number(price),
            payment_status: 'completed',
            payment_id: paymentId,
          };

          const { error: insertError } = await admin
            .from('purchases')
            .insert(insertPayload);

          if (insertError) {
            // 중복 (user_id, course_id)는 이미 결제 완료 페이지에서 저장된 경우
            if (insertError.code === '23505') {
              const { error: updateByUserCourse } = await admin
                .from('purchases')
                .update({
                  payment_status: 'completed',
                  payment_id: paymentId,
                })
                .eq('user_id', userId)
                .eq('course_id', courseId);

              if (!updateByUserCourse) {
                console.log('웹훅: 기존 행 업데이트 성공 (중복 후 보정)', paymentId);
              }
            } else {
              console.error('웹훅 구매 내역 생성 오류:', insertError);
              return NextResponse.json(
                { error: '구매 내역 생성 실패', details: insertError.message },
                { status: 500 }
              );
            }
          } else {
            console.log('웹훅 구매 내역 생성 성공:', paymentId);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return NextResponse.json(
      { error: '웹훅 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
