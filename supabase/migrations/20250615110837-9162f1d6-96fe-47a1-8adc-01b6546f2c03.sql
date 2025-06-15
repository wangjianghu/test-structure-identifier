
-- Phase 1: Critical Database Security Fixes

-- First, drop the existing overly permissive policies
DROP POLICY IF EXISTS "Allow public read access to analysis history" ON public.analysis_history;
DROP POLICY IF EXISTS "Allow public insert to analysis history" ON public.analysis_history;
DROP POLICY IF EXISTS "Allow public read access" ON public.question_type_examples;
DROP POLICY IF EXISTS "Allow public insert access" ON public.question_type_examples;
DROP POLICY IF EXISTS "Allow public update access" ON public.question_type_examples;

-- Add user_id columns to associate data with users
ALTER TABLE public.analysis_history ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.question_type_examples ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_analysis_history_user_id ON public.analysis_history(user_id);
CREATE INDEX idx_question_type_examples_user_id ON public.question_type_examples(user_id);

-- Create secure RLS policies for analysis_history
CREATE POLICY "Users can view their own analysis history" 
  ON public.analysis_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis history" 
  ON public.analysis_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis history" 
  ON public.analysis_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis history" 
  ON public.analysis_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create secure RLS policies for question_type_examples
CREATE POLICY "Users can view their own question examples" 
  ON public.question_type_examples 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question examples" 
  ON public.question_type_examples 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question examples" 
  ON public.question_type_examples 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own question examples" 
  ON public.question_type_examples 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
