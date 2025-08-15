# Database Migration Instructions

To complete the admin panel setup, you need to apply the following SQL migrations to your Supabase database:

## How to Apply Migrations

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `kplhjddghkjjewznxcou`
3. Navigate to the SQL Editor
4. **IMPORTANT**: The database migration will fix the infinite recursion error and admin function timeout issues
5. Run the following migration files in order:

Alternatively, if you have Supabase CLI installed:
```bash
supabase db reset
```
Or apply individual migrations:
```bash
supabase migration up
```
After applying migrations, restart your development server:
```bash
npm run dev
```

## Required Database Migrations

You need to apply the following SQL migrations to your Supabase database in **this exact order**:

### 1. Remove difficulty_level column (20250815180117)
```sql
-- File: supabase/migrations/20250815180117_remove_difficulty_level_from_starter_kit_templates.sql
ALTER TABLE public.starter_kit_templates DROP COLUMN IF EXISTS difficulty_level;
```

### 2. Remove estimated_time column (20250815180200)
```sql
-- File: supabase/migrations/20250815180200_remove_estimated_time_from_starter_kit_templates.sql
ALTER TABLE public.starter_kit_templates DROP COLUMN IF EXISTS estimated_time;
```

### 3. Create admin functions and tables (20250815180300)
```sql
-- File: supabase/migrations/20250815180300_create_admin_functions.sql
-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create is_admin function
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
  
  -- Check admin role
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles 
  WHERE user_id = target_user_id 
  AND role = 'admin';
  
  RETURN admin_count > 0;
END;
$$;

-- Create policies for user_roles
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
  estimated_cost numeric,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on starter_kit_templates
ALTER TABLE public.starter_kit_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for starter_kit_templates
CREATE POLICY "Anyone can view templates" ON public.starter_kit_templates
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert templates" ON public.starter_kit_templates
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update templates" ON public.starter_kit_templates
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete templates" ON public.starter_kit_templates
  FOR DELETE USING (public.is_admin());

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_roles TO anon, authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.starter_kit_templates TO anon, authenticated;
GRANT ALL ON public.starter_kit_templates TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated, service_role;
```

### 4. Fix database schema issues (20250815180400) - **IMPORTANT: Apply this migration**
```sql
-- File: supabase/migrations/20250815180400_fix_database_schema.sql
-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Drop and recreate is_admin function to avoid recursion
DROP FUNCTION IF EXISTS public.is_admin();

-- Create user_profiles table (view of auth.users for easier management)
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users;

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

-- Create non-recursive policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (bypasses RLS)
CREATE POLICY "Service role full access" ON public.user_roles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a function to check if current JWT is service role
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'service_role';
END;
$$;

-- Update starter_kit_templates policies to use service role check
DROP POLICY IF EXISTS "Admins can view all templates" ON public.starter_kit_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.starter_kit_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.starter_kit_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.starter_kit_templates;

CREATE POLICY "Service role can manage templates" ON public.starter_kit_templates
  FOR ALL USING (public.is_service_role());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.starter_kit_templates TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO anon, authenticated, service_role;

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

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage products" ON public.products
  FOR ALL USING (public.is_service_role());

GRANT ALL ON public.products TO service_role;
GRANT SELECT ON public.products TO anon, authenticated;
```

## After Running Migrations

1. Refresh your browser
2. The admin panel should now work correctly:
   - User creation and invitations will work
   - Starter kit templates will no longer show estimated_time
   - All admin functions will be properly secured

## Troubleshooting

If you encounter any issues:
1. Make sure you're running the SQL as the database owner
2. Check that all tables exist before running the migrations
3. Verify that RLS (Row Level Security) policies are properly applied