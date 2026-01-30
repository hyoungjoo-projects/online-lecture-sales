"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function HeroSection({ 
  imageSrc = "/programming-code-abstract-screen-software-600nw-2526471169.webp",
  title = "Nextjs + Supabase + Cursor AI 풀스택 개발 강의",
  description = "프로그래밍을 배우고 싶으신가요? 최고의 강의를 만나보세요.",
  originalPrice = 150000,
  discountedPrice = 99000
}) {
  const discountRate = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  return (
    <section className="relative w-full h-[350px] sm:h-[400px] md:h-[450px] rounded-lg overflow-hidden mb-8">
      {/* 배경 이미지 */}
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-black/50" />
      </div>
      
      {/* 콘텐츠 */}
      <div className="relative z-10 h-full flex flex-col justify-start items-center px-4 sm:px-6 md:px-8 text-white text-center pt-6 sm:pt-8 md:pt-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6 md:mb-8 max-w-full px-2">
          {title}
        </h1>
        <p className="text-lg md:text-xl mb-6 sm:mb-7 md:mb-8 max-w-2xl">
          {description}
        </p>
        <div className="flex flex-col items-center mb-2 sm:mb-3 md:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 flex-wrap justify-center">
            <span className="text-lg sm:text-xl md:text-2xl text-white/70 line-through">
              ₩{originalPrice.toLocaleString()}
            </span>
            <Badge variant="destructive" className="text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1 rounded-md">
              {discountRate}% 할인
            </Badge>
          </div>
          <div className="text-3xl md:text-4xl font-bold">
            ₩{discountedPrice.toLocaleString()}
          </div>
        </div>
      </div>
    </section>
  );
}
