-- Add affiliate_link and price columns to products table
-- Run this SQL in your Supabase SQL Editor to add the missing columns

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS affiliate_link TEXT,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Update the column comments for documentation
COMMENT ON COLUMN public.products.affiliate_link IS 'Amazon affiliate link for the product';
COMMENT ON COLUMN public.products.price IS 'Product price in USD';