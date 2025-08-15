-- Create is_admin function to check if current user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user has admin role in user_roles table
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'editor', 'admin')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.is_admin());

-- Create starter_kit_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.starter_kit_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  estimated_cost numeric DEFAULT 0,
  products jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on starter_kit_templates table
ALTER TABLE public.starter_kit_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for starter_kit_templates table
CREATE POLICY "Anyone can view active templates" ON public.starter_kit_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all templates" ON public.starter_kit_templates
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert templates" ON public.starter_kit_templates
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update templates" ON public.starter_kit_templates
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete templates" ON public.starter_kit_templates
  FOR DELETE USING (public.is_admin());