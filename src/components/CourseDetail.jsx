"use client";

import MarkdownContent from "./MarkdownContent";

const courseContent = `
## 📚 강의 소개

이 강의는 **Next.js**, **Supabase**, **Cursor AI**를 활용하여 실전 풀스택 애플리케이션을 구축하는 방법을 단계별로 학습합니다.

### 왜 이 강의인가요?

- **실무 중심 학습**: 이론보다는 실제 프로젝트를 완성하며 배웁니다
- **AI 도구 활용**: Cursor AI를 활용하여 개발 생산성을 극대화합니다
- **최신 기술 스택**: 2026년 최신 기술 트렌드를 반영한 커리큘럼입니다
- **완전한 풀스택**: 프론트엔드부터 백엔드, 배포까지 모든 과정을 다룹니다

---

## 📋 커리큘럼

### 1단계: 환경 설정 및 기초 (2주)

- Next.js 16 프로젝트 설정
- Supabase 계정 생성 및 프로젝트 설정
- Cursor AI 기본 사용법
- 개발 환경 구축

### 2단계: 데이터베이스 설계 (1주)

- Supabase 데이터베이스 스키마 설계
- 테이블 생성 및 관계 설정
- Row Level Security (RLS) 설정
- 데이터 시딩 및 마이그레이션

### 3단계: 인증 시스템 구현 (1주)

- Supabase Auth 설정
- 회원가입 및 로그인 기능
- 소셜 로그인 (Google, 카카오톡)
- 세션 관리 및 보안

### 4단계: 프론트엔드 개발 (3주)

- Next.js App Router 활용
- Client Components
- React Server Actions
- 폼 처리 및 유효성 검사
- 실시간 데이터 업데이트

### 5단계: 백엔드 API 개발 (2주)

- Supabase Edge Functions
- RESTful API 설계
- 파일 업로드 처리
- 이메일 발송 기능

### 6단계: 배포 및 운영 (1주)

- Vercel 배포
- 도메인 연결 및 SSL 설정
- 모니터링 및 로깅
- 성능 최적화

---

## 🎯 강의 방식

### 실습 중심 학습

각 단계마다 실제 프로젝트를 함께 만들어가며 학습합니다. 단순히 따라하는 것이 아니라, **왜 이렇게 하는지** 이해할 수 있도록 설명합니다.

### Cursor AI 활용

- 코드 자동 생성 및 리팩토링
- 버그 수정 및 최적화
- 문서 작성 및 주석 생성
- 테스트 코드 작성

### 프로젝트 기반 학습

강의를 마치면 **완전히 동작하는 풀스택 애플리케이션**을 완성하게 됩니다. 이 프로젝트는 포트폴리오로도 활용할 수 있습니다.

### 커뮤니티 지원

- Discord 채널을 통한 질문 및 답변
- 정기적인 라이브 세션
- 프로젝트 코드 리뷰
- 취업 및 포트폴리오 상담

---

## 🛠️ 사용 기술 스택

### 프론트엔드
- **Next.js 16**: React 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **shadcn/ui**: UI 컴포넌트

### 백엔드
- **Supabase**: BaaS (Backend as a Service)
- **PostgreSQL**: 데이터베이스
- **Supabase Auth**: 인증 시스템
- **Supabase Storage**: 파일 저장소

### 개발 도구
- **Cursor AI**: AI 기반 코드 에디터
- **Git & GitHub**: 버전 관리
- **Vercel**: 배포 플랫폼

---

## 💡 학습 후 기대 효과

이 강의를 완료하면 다음과 같은 능력을 갖추게 됩니다:

1. **풀스택 개발 능력**: 프론트엔드와 백엔드를 모두 다룰 수 있습니다
2. **최신 기술 활용**: 2026년 최신 기술 스택을 실무에 적용할 수 있습니다
3. **AI 도구 활용**: Cursor AI를 활용하여 개발 생산성을 높일 수 있습니다
4. **실전 프로젝트 경험**: 완성된 프로젝트를 포트폴리오로 활용할 수 있습니다
5. **문제 해결 능력**: 스스로 문제를 해결하고 학습할 수 있는 능력을 기릅니다

---

## 📞 문의사항

강의에 대한 문의사항이 있으시면 언제든지 연락주세요!

- 이메일: support@example.com
- Discord: 강의 커뮤니티 참여
`;

export default function CourseDetail({ courseId, price, title }) {
  return (
    <section className="w-full py-8 px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        <MarkdownContent content={courseContent} />
        
        {/* 플로팅 버튼을 위한 공간 확보 (하단 여백) */}
        <div className="h-24" />
      </div>
    </section>
  );
}
