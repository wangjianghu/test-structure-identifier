
-- 创建题型结构示例表
CREATE TABLE public.question_type_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  question_type TEXT NOT NULL,
  structure_example TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_question_type_examples_subject ON public.question_type_examples(subject);
CREATE INDEX idx_question_type_examples_created_at ON public.question_type_examples(created_at);

-- 启用行级安全(RLS)
ALTER TABLE public.question_type_examples ENABLE ROW LEVEL SECURITY;

-- 创建策略允许任何人查看和插入数据（因为这是收集示例数据）
CREATE POLICY "Allow public read access" 
  ON public.question_type_examples 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access" 
  ON public.question_type_examples 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access" 
  ON public.question_type_examples 
  FOR UPDATE 
  USING (true);
