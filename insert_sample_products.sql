-- Insert sample products for testing the catalog
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- First, ensure the products table exists with all necessary columns
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  image_url TEXT,
  asin TEXT,
  dimensions TEXT,
  weight TEXT,
  material TEXT,
  features TEXT[],
  price DECIMAL(10,2),
  affiliate_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

-- Create policy for authenticated users to manage products
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Clear existing sample data if any
DELETE FROM public.products WHERE id::text LIKE '550e8400-e29b-41d4-a716-44665544%';

-- Insert sample products
INSERT INTO public.products (id, name, brand, category, rating, image_url, asin, dimensions, weight, material, features, price, affiliate_link) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Pre-Wrap Foam Underwrap', 'Mueller', 'Athletic Tape', 4.5, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400', 'B001234567', '2.75" x 30 yards', '0.2 lbs', 'Foam', ARRAY['Protects skin', 'Easy tear', 'Lightweight'], 12.99, 'https://amazon.com/dp/B001234567'),
('550e8400-e29b-41d4-a716-446655440001', 'Athletic Tape White', 'Johnson & Johnson', 'Athletic Tape', 4.7, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', 'B001234568', '1.5" x 15 yards', '0.3 lbs', 'Cotton', ARRAY['Strong adhesion', 'Breathable', 'Professional grade'], 8.99, 'https://amazon.com/dp/B001234568'),
('550e8400-e29b-41d4-a716-446655440002', 'Self-Adherent Wrap', 'Coban', 'Elastic Bandages', 4.6, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400', 'B001234569', '3" x 5 yards', '0.15 lbs', 'Non-woven fabric', ARRAY['Self-adhering', 'Flexible', 'Water resistant'], 15.99, 'https://amazon.com/dp/B001234569'),
('550e8400-e29b-41d4-a716-446655440003', 'Kinesiology Tape', 'KT Tape', 'Kinesiology Tape', 4.8, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', 'B001234570', '2" x 16.4 feet', '0.1 lbs', 'Cotton blend', ARRAY['Muscle support', 'Pain relief', 'Waterproof'], 19.99, 'https://amazon.com/dp/B001234570'),
('550e8400-e29b-41d4-a716-446655440004', 'Elastic Bandage', 'ACE', 'Elastic Bandages', 4.4, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', 'B001234571', '4" x 5 yards', '0.25 lbs', 'Elastic cotton', ARRAY['Compression support', 'Reusable', 'Adjustable'], 11.99, 'https://amazon.com/dp/B001234571'),
('550e8400-e29b-41d4-a716-446655440005', 'Gauze Pads Sterile', 'Curad', 'First Aid', 4.3, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', 'B001234572', '4" x 4" (25 count)', '0.5 lbs', 'Cotton gauze', ARRAY['Sterile', 'Absorbent', 'Non-stick'], 9.99, 'https://amazon.com/dp/B001234572'),
('550e8400-e29b-41d4-a716-446655440006', 'Foam Padding', 'Cramer', 'Protective Padding', 4.2, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400', 'B001234573', '1/4" x 6" x 12"', '0.1 lbs', 'Closed-cell foam', ARRAY['Shock absorption', 'Lightweight', 'Easy to cut'], 7.99, 'https://amazon.com/dp/B001234573'),
('550e8400-e29b-41d4-a716-446655440007', 'Zinc Oxide Tape', 'Leukoplast', 'Athletic Tape', 4.6, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400', 'B001234574', '1" x 10 yards', '0.2 lbs', 'Zinc oxide', ARRAY['Rigid support', 'Strong adhesion', 'Medical grade'], 13.99, 'https://amazon.com/dp/B001234574'),
('550e8400-e29b-41d4-a716-446655440008', 'Ankle Brace', 'McDavid', 'Braces & Supports', 4.7, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', 'B001234575', 'One Size Fits Most', '0.8 lbs', 'Neoprene', ARRAY['Ankle support', 'Adjustable straps', 'Breathable'], 24.99, 'https://amazon.com/dp/B001234575'),
('550e8400-e29b-41d4-a716-446655440009', 'Instant Ice Packs', 'Dynarex', 'Cold Therapy', 4.1, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400', 'B001234576', '6" x 9" (24 pack)', '2.0 lbs', 'Chemical cold pack', ARRAY['Instant activation', 'Single use', 'No refrigeration needed'], 29.99, 'https://amazon.com/dp/B001234576'),
('550e8400-e29b-41d4-a716-446655440010', 'Reusable Gel Pack', 'TheraPearl', 'Cold Therapy', 4.5, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', 'B001234577', '11" x 4"', '1.2 lbs', 'Gel-filled', ARRAY['Hot/cold therapy', 'Flexible when frozen', 'Reusable'], 16.99, 'https://amazon.com/dp/B001234577'),
('550e8400-e29b-41d4-a716-446655440011', 'Medical Scissors', 'Prestige Medical', 'Tools & Accessories', 4.4, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', 'B001234578', '7.5" length', '0.3 lbs', 'Stainless steel', ARRAY['Sharp blades', 'Comfortable grip', 'Autoclavable'], 14.99, 'https://amazon.com/dp/B001234578'),
('550e8400-e29b-41d4-a716-446655440012', 'First Aid Kit Complete', 'Johnson & Johnson', 'First Aid', 4.6, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400', 'B001234579', '10" x 8" x 3"', '2.5 lbs', 'Plastic case', ARRAY['140+ pieces', 'Portable', 'Emergency ready'], 39.99, 'https://amazon.com/dp/B001234579'),
('550e8400-e29b-41d4-a716-446655440013', 'Elastic Adhesive Bandage', '3M', 'Elastic Bandages', 4.3, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400', 'B001234580', '2" x 5 yards', '0.2 lbs', 'Elastic fabric', ARRAY['Self-adhesive', 'Breathable', 'Flexible'], 13.99, 'https://amazon.com/dp/B001234580'),
('550e8400-e29b-41d4-a716-446655440014', 'Knee Brace Support', 'Bauerfeind', 'Braces & Supports', 4.8, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', 'B001234581', 'Medium', '1.2 lbs', 'Neoprene blend', ARRAY['Knee stabilization', 'Compression', 'Moisture-wicking'], 34.99, 'https://amazon.com/dp/B001234581'),
('550e8400-e29b-41d4-a716-446655440015', 'Hot/Cold Therapy Pack', 'Chattanooga', 'Cold Therapy', 4.4, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', 'B001234582', '6" x 10"', '1.5 lbs', 'Gel compound', ARRAY['Dual therapy', 'Flexible', 'Long-lasting'], 22.99, 'https://amazon.com/dp/B001234582');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.products TO anon;

-- Refresh the table statistics
ANALYZE public.products;

-- Verify the insert
SELECT COUNT(*) as total_products, 
       COUNT(DISTINCT category) as total_categories 
FROM public.products;