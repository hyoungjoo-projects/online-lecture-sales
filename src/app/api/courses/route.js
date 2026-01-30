import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('id');

    if (courseId) {
      // 특정 강의 조회
      const { data: course, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      // 테이블이 없거나 에러가 발생한 경우 null 반환
      if (error) {
        // PGRST205: 테이블이 존재하지 않음
        if (error.code === 'PGRST205') {
          console.warn('courses 테이블이 존재하지 않습니다.');
          return NextResponse.json({ course: null });
        }
        return NextResponse.json(
          { error: '강의를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      if (!course) {
        return NextResponse.json(
          { error: '강의를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ course });
    } else {
      // 모든 강의 조회
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      // 테이블이 없거나 에러가 발생한 경우 빈 배열 반환 (기본값 사용)
      if (error) {
        // PGRST205: 테이블이 존재하지 않음
        if (error.code === 'PGRST205') {
          console.warn('courses 테이블이 존재하지 않습니다. 기본값을 사용합니다.');
          return NextResponse.json({ courses: [] });
        }
        console.error('강의 목록 조회 오류:', error);
        // 다른 에러도 빈 배열 반환하여 앱이 크래시되지 않도록 함
        return NextResponse.json({ courses: [] });
      }

      return NextResponse.json({ courses: courses || [] });
    }
  } catch (error) {
    console.error('강의 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
