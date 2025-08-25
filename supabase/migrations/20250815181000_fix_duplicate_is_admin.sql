-- Drop any existing is_admin functions with parameters to resolve duplicate function issue
DROP FUNCTION IF EXISTS public.is_admin(user_id_param uuid);

-- Ensure we have the correct is_admin function without parameters
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

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;