
-- Create analysis_history table to store exported analysis records
CREATE TABLE public.analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  input_time TIMESTAMP WITH TIME ZONE NOT NULL,
  output_time TIMESTAMP WITH TIME ZONE,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'image')),
  selected_subject TEXT,
  question_type_example TEXT,
  input_text TEXT,
  analysis_result JSONB,
  ocr_result JSONB,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since this is for exported data)
CREATE POLICY "Allow public read access to analysis history" 
  ON public.analysis_history 
  FOR SELECT 
  USING (true);

-- Create policy for public insert access (for syncing exported data)
CREATE POLICY "Allow public insert to analysis history" 
  ON public.analysis_history 
  FOR INSERT 
  WITH CHECK (true);
