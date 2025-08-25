-- Update user_roles table to ensure editor role is supported
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Add constraint to support user, editor, and admin roles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('user', 'editor', 'admin'));

-- Update the is_admin function to handle the new role structure
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

-- Create a function to check if current user is editor or admin
CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user has editor or admin role in user_roles table
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('editor', 'admin')
  );
END;
$$;

-- Update policies to allow editors to view templates
DROP POLICY IF EXISTS "Editors and admins can view all templates" ON public.starter_kit_templates;
CREATE POLICY "Editors and admins can view all templates" ON public.starter_kit_templates
  FOR SELECT USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can insert templates" ON public.starter_kit_templates;
CREATE POLICY "Editors and admins can insert templates" ON public.starter_kit_templates
  FOR INSERT WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can update templates" ON public.starter_kit_templates;
CREATE POLICY "Editors and admins can update templates" ON public.starter_kit_templates
  FOR UPDATE USING (public.is_editor_or_admin());

DROP POLICY IF EXISTS "Editors and admins can delete templates" ON public.starter_kit_templates;
CREATE POLICY "Editors and admins can delete templates" ON public.starter_kit_templates
  FOR DELETE USING (public.is_editor_or_admin());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_roles TO authenticated;