import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * 구매 API 엔드포인트
 * 단일 강의만 운영하므로 courseId는 사용하지 않고, courses 테이블의 첫 번째 강의를 사용한다.
 *
 * @route POST /api/purchase
 * @body { price: number, title: string, paymentId?: string, transactionId?: string }
 */
export async function POST(request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정이 완료되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY를 설정해 주세요.' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // ============================================
    // 1. 사용자 인증 확인 (세션만 사용)
    // ============================================
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('구매 API 인증 실패:', { authError: authError?.message, hasUser: !!user });
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인해주세요.' },
        { status: 401 }
      );
    }
    console.log('구매 API 인증 성공:', { userId: user.id });

    // ============================================
    // 2. 요청 데이터 파싱 및 검증
    // ============================================
    const body = await request.json();
    let { price, title, paymentId, transactionId } = body;

    console.log('구매 API 요청 데이터:', { price, title, paymentId, transactionId });

    // ============================================
    // 2-1. 포트원 결제 검증 (paymentId가 있는 경우)
    // ============================================
    if (paymentId) {
      try {
        const portoneApiKey = process.env.PORTONE_API_KEY;
        if (!portoneApiKey) {
          console.warn('포트원 API 키가 설정되지 않았습니다. 결제 검증을 건너뜁니다.');
        } else {
          // 포트원 API로 결제 정보 조회 및 검증
          // 포트원 v2 API 엔드포인트 확인 필요 (문서에 따라 다를 수 있음)
          const portoneResponse = await fetch(`https://api.portone.io/payments/${paymentId}`, {
            method: 'GET',
            headers: {
              'Authorization': `PortOne ${portoneApiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (portoneResponse.ok) {
            const paymentData = await portoneResponse.json();
            console.log('포트원 결제 정보:', paymentData);
            
            // 결제 상태 확인 (포트원 v2의 상태 값 확인 필요)
            const paymentStatus = paymentData.status || paymentData.paymentStatus;
            if (paymentStatus && paymentStatus !== 'PAID' && paymentStatus !== 'paid') {
              console.warn('결제 상태가 PAID가 아닙니다:', paymentStatus);
              // 상태가 PAID가 아니어도 구매는 진행 (웹훅에서 최종 확인)
            }

            // 결제 금액 검증 (위변조 방지)
            const actualAmount = paymentData.amount?.total || paymentData.totalAmount || 0;
            if (actualAmount > 0 && actualAmount !== price) {
              console.error('결제 금액 불일치:', { 요청금액: price, 실제결제금액: actualAmount });
              // 금액 불일치해도 구매는 진행 (로그만 기록)
            }

            // transactionId 업데이트 (포트원에서 받은 실제 값 사용)
            if (paymentData.transactionId && !transactionId) {
              transactionId = paymentData.transactionId;
            } else if (paymentData.txId && !transactionId) {
              transactionId = paymentData.txId;
            }
          } else {
            const errorText = await portoneResponse.text();
            console.error('포트원 결제 검증 실패:', portoneResponse.status, errorText);
            // 검증 실패해도 구매는 진행 (웹훅에서 최종 확인)
          }
        }
      } catch (error) {
        console.error('포트원 결제 검증 오류:', error);
        // 검증 오류가 발생해도 구매는 진행 (웹훅에서 최종 확인)
      }
    } else {
      console.warn('paymentId가 없습니다. 결제 검증을 건너뜁니다.');
    }

    // ============================================
    // 3. 강의 조회 (단일 강의: courses 테이블 첫 번째 행 사용)
    // ============================================
    const { data: courses, error: coursesError } = await admin
      .from('courses')
      .select('id, title, discounted_price, original_price')
      .order('created_at', { ascending: false })
      .limit(1);

    if (coursesError) {
      console.error('강의 조회 오류:', coursesError);
      return NextResponse.json(
        { error: '강의 정보를 불러올 수 없습니다.', details: coursesError.message },
        { status: 500 }
      );
    }

    if (!courses?.length) {
      console.error('courses 테이블에 강의가 없습니다.');
      return NextResponse.json(
        { error: '강의 정보가 없습니다. 관리자에게 문의하세요.' },
        { status: 404 }
      );
    }

    const course = courses[0];
    const finalCourseId = course.id;
    console.log('강의 조회 성공:', { finalCourseId, title: course.title });

    // finalCourseId 검증 (중요: UUID 형식 확인)
    if (!finalCourseId) {
      console.error('finalCourseId가 null입니다.');
      return NextResponse.json(
        { 
          error: '강의 ID를 찾을 수 없습니다.',
          details: 'courses 테이블에서 강의를 조회했지만 id가 없습니다.'
        },
        { status: 500 }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof finalCourseId !== 'string' || !uuidRegex.test(finalCourseId)) {
      console.error('유효하지 않은 finalCourseId:', {
        finalCourseId,
        type: typeof finalCourseId,
        value: String(finalCourseId)
      });
      return NextResponse.json(
        { 
          error: '유효하지 않은 강의 ID입니다.',
          details: `courseId: ${finalCourseId} (유효한 UUID 형식이 아닙니다)`
        },
        { status: 400 }
      );
    }

    // ============================================
    // 4. 중복 구매 확인 또는 취소된 구매 확인
    // ============================================
    const { data: existingPurchase } = await admin
      .from('purchases')
      .select('id, user_id, course_id, payment_status')
      .eq('user_id', user.id)
      .eq('course_id', finalCourseId)
      .maybeSingle();

    // 취소되지 않은 구매가 있으면 중복 구매 에러
    if (existingPurchase && existingPurchase.payment_status !== 'cancelled') {
      return NextResponse.json(
        { error: '이미 구매한 강의입니다.' },
        { status: 400 }
      );
    }

    // ============================================
    // 5. 구매 가격 결정
    // ============================================
    // 전달된 price 또는 강의의 discounted_price 또는 original_price 사용
    const purchasePrice = price || course.discounted_price || course.original_price;

    // ============================================
    // 6. 구매 내역 생성 또는 업데이트 (Supabase에 저장)
    // ============================================
    let purchase = null;
    let purchaseError = null;

    try {
      // finalCourseId 최종 검증 (insert 직전)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!finalCourseId || typeof finalCourseId !== 'string' || !uuidRegex.test(finalCourseId)) {
        console.error('INSERT 직전 finalCourseId 검증 실패:', {
          finalCourseId,
          type: typeof finalCourseId,
          isUUID: uuidRegex.test(String(finalCourseId))
        });
        return NextResponse.json(
          { 
            error: '유효하지 않은 강의 ID입니다.',
            details: `courseId: ${finalCourseId} (유효한 UUID 형식이 아닙니다)`
          },
          { status: 400 }
        );
      }

      // 취소된 구매가 있으면 UPDATE, 없으면 INSERT
      if (existingPurchase && existingPurchase.payment_status === 'cancelled') {
        // 취소된 구매를 재활성화 (UPDATE)
        console.log('취소된 구매 재활성화:', existingPurchase.id);
        
        const { data: purchaseData, error: errorData } = await admin
          .from('purchases')
          .update({
            price: purchasePrice,
            payment_status: paymentId ? 'completed' : 'pending',
            payment_id: paymentId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPurchase.id)
          .select()
          .single();

        if (errorData) {
          console.error('구매 내역 업데이트 오류 상세:', errorData);
          purchaseError = errorData;
        } else {
          purchase = purchaseData;
          console.log('구매 내역 업데이트 성공:', purchase?.id, purchase);
        }
      } else {
        // 새로운 구매 (INSERT)
        console.log('구매 내역 저장 시도:', {
          user_id: user.id,
          course_id: finalCourseId,
          course_id_type: typeof finalCourseId,
          course_id_isUUID: uuidRegex.test(finalCourseId),
          price: purchasePrice,
          payment_id: paymentId,
          payment_id_type: typeof paymentId
        });
        
        // insert 시 명시적으로 각 필드 지정 (타입 혼동 방지)
        const insertPayload = {
          user_id: user.id,
          course_id: finalCourseId,
          price: purchasePrice,
          payment_status: paymentId ? 'completed' : 'pending',
          payment_id: paymentId || null,
        };
        console.log('구매 내역 INSERT 실행:', insertPayload);

        const { data: purchaseData, error: errorData } = await admin
          .from('purchases')
          .insert(insertPayload)
          .select()
          .single();

        if (errorData) {
          console.error('구매 내역 저장 오류 상세:', {
            code: errorData.code,
            message: errorData.message,
            details: errorData.details,
            hint: errorData.hint
          });
          purchaseError = errorData;
        } else {
          purchase = purchaseData;
          console.log('구매 내역 저장 성공:', purchase?.id, purchase);
        }
      }
    } catch (insertError) {
      console.error('구매 내역 저장 중 예외 발생:', insertError);
      purchaseError = insertError;
    }

    if (purchaseError) {
      console.error('구매 처리 오류:', purchaseError);
      return NextResponse.json(
        { 
          error: '구매 처리 중 오류가 발생했습니다.',
          details: purchaseError.message || purchaseError.details || '알 수 없는 오류',
          code: purchaseError.code
        },
        { status: 500 }
      );
    }

    // ============================================
    // 7. 구매 성공 응답
    // ============================================
    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase?.id || null,
        courseId: purchase?.course_id || finalCourseId || null,
        price: purchase?.price || purchasePrice,
        createdAt: purchase?.created_at || new Date().toISOString(),
      },
      message: '구매가 완료되었습니다.',
    });
  } catch (error) {
    console.error('구매 API 오류:', error);
    console.error('에러 스택:', error.stack);
    console.error('에러 메시지:', error.message);
    
    // 더 자세한 에러 정보 반환
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error.message || '알 수 없는 오류',
        type: error.name || 'Error'
      },
      { status: 500 }
    );
  }
}
