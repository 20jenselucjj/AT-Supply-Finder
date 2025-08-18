-- Create user_kits table for saving custom kits
CREATE TABLE IF NOT EXISTS user_kits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    kit_data JSONB NOT NULL, -- Store the complete kit configuration
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_favorites table for favoriting products
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id) -- Prevent duplicate favorites
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_kits_user_id ON user_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kits_created_at ON user_kits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_kits
CREATE POLICY "Users can view their own kits" ON user_kits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public kits" ON user_kits
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own kits" ON user_kits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kits" ON user_kits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own kits" ON user_kits
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions for easier kit and favorites management
CREATE OR REPLACE FUNCTION get_user_kits(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    kit_data JSONB,
    is_public BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT uk.id, uk.name, uk.description, uk.kit_data, uk.is_public, uk.created_at, uk.updated_at
    FROM user_kits uk
    WHERE uk.user_id = user_uuid
    ORDER BY uk.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_user_favorites(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    product_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT uf.product_id, uf.created_at
    FROM user_favorites uf
    WHERE uf.user_id = user_uuid
    ORDER BY uf.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION toggle_favorite(product_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID := auth.uid();
    is_favorited BOOLEAN;
BEGIN
    -- Check if already favorited
    SELECT EXISTS(
        SELECT 1 FROM user_favorites 
        WHERE user_id = user_uuid AND product_id = product_uuid
    ) INTO is_favorited;
    
    IF is_favorited THEN
        -- Remove from favorites
        DELETE FROM user_favorites 
        WHERE user_id = user_uuid AND product_id = product_uuid;
        RETURN false;
    ELSE
        -- Add to favorites
        INSERT INTO user_favorites (user_id, product_id) 
        VALUES (user_uuid, product_uuid);
        RETURN true;
    END IF;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_kits TO authenticated;
GRANT ALL ON user_favorites TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_kits TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_favorites TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_favorite TO authenticated;