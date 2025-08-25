-- Create audit_logs table for comprehensive logging and audit trails
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all important system actions';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (nullable for system actions)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., CREATE, UPDATE, DELETE, LOGIN, etc.)';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected (e.g., USER, PRODUCT, TEMPLATE, etc.)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the specific entity affected';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the client';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string of the client';
COMMENT ON COLUMN audit_logs.timestamp IS 'When the action occurred';

-- Enable RLS (Row Level Security) for audit logs
-- Only admins should be able to read audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit_logs - only admins can read
CREATE POLICY "Admins can read audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create a function to get client IP (helper for audit logging)
CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This is a placeholder function. In a real implementation, you would
    -- extract the IP from the request headers or use a service.
    -- For now, we'll return a placeholder value.
    RETURN '0.0.0.0';
EXCEPTION
    WHEN others THEN
        RETURN '0.0.0.0';
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;