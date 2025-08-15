-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Drop and recreate is_admin function to avoid recursion
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Drop existing user_profiles view if it exists
DROP VIEW IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles view (view of auth.users with role information)
CREATE VIEW public.user_profiles AS
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  COALESCE(ur.role, 'user') as role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id;

-- Create a simple is_admin function that doesn't use RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  admin_count integer;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Return false if no user
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check admin role directly without RLS
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles 
  WHERE user_id = target_user_id 
  AND role = 'admin';
  
  RETURN admin_count > 0;
END;
$$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies for user_roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can view their own roles') THEN
    CREATE POLICY "Users can view their own roles" ON public.user_roles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Note: Service role bypasses RLS entirely, so no service role policies needed
-- Only create policies for regular authenticated users

-- Update starter_kit_templates policies
DROP POLICY IF EXISTS "Admins can view all templates" ON public.starter_kit_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.starter_kit_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.starter_kit_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.starter_kit_templates;
DROP POLICY IF EXISTS "Service role can manage templates" ON public.starter_kit_templates;

-- Allow authenticated users to create templates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'starter_kit_templates' AND policyname = 'Authenticated users can create templates') THEN
    CREATE POLICY "Authenticated users can create templates" ON public.starter_kit_templates
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow authenticated users to update their own templates or admins to update any
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'starter_kit_templates' AND policyname = 'Users can update templates') THEN
    CREATE POLICY "Users can update templates" ON public.starter_kit_templates
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow authenticated users to delete templates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'starter_kit_templates' AND policyname = 'Users can delete templates') THEN
    CREATE POLICY "Users can delete templates" ON public.starter_kit_templates
      FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.starter_kit_templates TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated, service_role;

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  brand text NOT NULL,
  rating numeric,
  price numeric,
  dimensions text,
  weight text,
  material text,
  features text[],
  image_url text,
  asin text,
  affiliate_link text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger for products
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone can view products') THEN
    CREATE POLICY "Anyone can view products" ON public.products
      FOR SELECT USING (true);
  END IF;
END $$;

-- Service role bypasses RLS, no policy needed

GRANT ALL ON public.products TO service_role;
GRANT SELECT ON public.products TO anon, authenticated;

-- Create template_products table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.template_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES public.starter_kit_templates(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  is_required boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(template_id, product_id)
);

-- Enable RLS on template_products
ALTER TABLE public.template_products ENABLE ROW LEVEL SECURITY;

-- Create policies for template_products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'template_products' AND policyname = 'Anyone can view template products') THEN
    CREATE POLICY "Anyone can view template products" ON public.template_products
      FOR SELECT USING (true);
  END IF;
END $$;

-- Service role bypasses RLS, no policy needed

-- Allow authenticated users to manage template products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'template_products' AND policyname = 'Authenticated users can manage template products') THEN
    CREATE POLICY "Authenticated users can manage template products" ON public.template_products
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

GRANT ALL ON public.template_products TO service_role;
GRANT SELECT ON public.template_products TO anon, authenticated;

-- Fix starter_kit_templates products column constraint
-- Make products column nullable since we're using template_products table for relationships
ALTER TABLE public.starter_kit_templates ALTER COLUMN products DROP NOT NULL;
ALTER TABLE public.starter_kit_templates ALTER COLUMN products SET DEFAULT NULL;