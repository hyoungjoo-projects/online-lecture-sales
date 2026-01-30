-- ============================================
-- purchases 테이블 스키마 수정 스크립트
-- ============================================
-- Supabase SQL Editor에서 실행하세요.

-- 1. payment_id 컬럼이 UUID 타입인지 확인하고 TEXT로 변경
DO $$
BEGIN
  -- payment_id 컬럼 타입 확인 및 수정
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'payment_id'
    AND data_type = 'uuid'
  ) THEN
    -- UUID 타입이면 TEXT로 변경
    ALTER TABLE public.purchases 
    ALTER COLUMN payment_id TYPE TEXT USING payment_id::TEXT;
    
    RAISE NOTICE 'payment_id 컬럼을 UUID에서 TEXT로 변경했습니다.';
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'payment_id'
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'payment_id 컬럼이 이미 TEXT 타입입니다.';
  ELSE
    -- 컬럼이 없으면 추가
    ALTER TABLE public.purchases 
    ADD COLUMN payment_id TEXT;
    
    RAISE NOTICE 'payment_id 컬럼을 TEXT 타입으로 추가했습니다.';
  END IF;
END $$;

-- 2. id 컬럼이 있는지 확인
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'id'
  ) THEN
    -- id 컬럼이 없으면 추가 (PRIMARY KEY는 나중에 설정)
    ALTER TABLE public.purchases 
    ADD COLUMN id UUID DEFAULT gen_random_uuid();
    
    -- 기존 PRIMARY KEY가 없으면 id를 PRIMARY KEY로 설정
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'purchases' 
      AND constraint_type = 'PRIMARY KEY'
    ) THEN
      ALTER TABLE public.purchases 
      ADD PRIMARY KEY (id);
      
      RAISE NOTICE 'id 컬럼을 추가하고 PRIMARY KEY로 설정했습니다.';
    ELSE
      RAISE NOTICE 'id 컬럼을 추가했습니다. (기존 PRIMARY KEY가 있어 PRIMARY KEY로 설정하지 않음)';
    END IF;
  ELSE
    RAISE NOTICE 'id 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 3. 현재 purchases 테이블 스키마 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'purchases'
ORDER BY ordinal_position;
