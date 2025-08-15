-- Fix enum issues causing 500 authentication errors
-- This addresses the "invalid input value for enum public.user_role" error

-- Drop any existing user_role enum type that might be causing conflicts
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop and recreate user_roles table to ensure clean schema
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Recreate user_roles table with proper CHECK constraint (not enum)
CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Recreate is_admin function to ensure it works with the new table
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

-- Grant necessary permissions
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;

-- Recreate user_profiles view to ensure it works with the new table
DROP VIEW IF EXISTS public.user_profiles CASCADE;

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

-- Grant permissions on the view
GRANT SELECT ON public.user_profiles TO anon, authenticated, service_role;

-- Insert a default admin user if none exists (optional - uncomment if needed)
-- INSERT INTO public.user_roles (user_id, role) 
-- SELECT id, 'admin' 
-- FROM auth.users 
-- WHERE email = 'your-admin-email@example.com'
-- ON CONFLICT (user_id) DO NOTHING;