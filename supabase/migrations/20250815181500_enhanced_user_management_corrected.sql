-- Note: user_profiles is likely a view, so we can't create indexes directly on it
-- Instead, we'll ensure the underlying tables have appropriate indexes
-- The auth.users table should already have indexes on email and last_sign_in_at
-- We'll add an index on user_roles.role if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Create a function to get detailed user information
CREATE OR REPLACE FUNCTION get_user_details(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    audit_logs JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        u.id,
        u.email,
        COALESCE(ur.role, 'user') as role,
        u.created_at,
        u.last_sign_in_at,
        u.email_confirmed_at,
        (u.last_sign_in_at IS NOT NULL AND u.last_sign_in_at > NOW() - INTERVAL '30 days') as is_active,
        (SELECT jsonb_agg(al.* ORDER BY al.timestamp DESC) 
         FROM audit_logs al 
         WHERE al.user_id = u.id 
         LIMIT 10) as audit_logs
    FROM auth.users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    WHERE u.id = user_uuid;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_details TO authenticated;