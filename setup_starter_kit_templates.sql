-- Run this SQL in your Supabase SQL Editor to create starter kit templates
-- This will populate the database with predefined athletic training kit templates

-- Create starter kit templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.starter_kit_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_cost DECIMAL(10,2),
  estimated_time TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create template products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.template_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.starter_kit_templates(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.starter_kit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_products ENABLE ROW LEVEL SECURITY;

-- Create policies for starter_kit_templates
CREATE POLICY "Anyone can view active templates" ON public.starter_kit_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all templates" ON public.starter_kit_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for template_products
CREATE POLICY "Anyone can view template products" ON public.template_products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage template products" ON public.template_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert starter kit templates
INSERT INTO public.starter_kit_templates (name, description, category, difficulty_level, estimated_cost, estimated_time, is_active) VALUES
('Basic Tape Starter', 'Core tape & wrap essentials to get going.', 'Basic Training', 'beginner', 50.00, '15 minutes', true),
('Coverage + Support', 'Adds elastic + gauze for broader treatment.', 'Intermediate Training', 'intermediate', 85.00, '25 minutes', true),
('Comprehensive Kit', 'A balanced set for most training room needs.', 'Advanced Training', 'advanced', 150.00, '45 minutes', true),
('Cold Therapy Essentials', 'Ice packs and cold therapy supplies for injury management.', 'Injury Management', 'beginner', 75.00, '20 minutes', true),
('First Aid Emergency Kit', 'Complete first aid supplies for immediate injury response.', 'Emergency Response', 'intermediate', 120.00, '30 minutes', true),
('Professional Taping Kit', 'Advanced taping supplies for professional athletic trainers.', 'Professional Training', 'advanced', 200.00, '60 minutes', true),
('Pain Management Kit', 'Topical analgesics and pain relief supplies.', 'Pain Relief', 'intermediate', 180.00, '35 minutes', true),
('Rehabilitation Support Kit', 'Braces and support equipment for injury recovery.', 'Rehabilitation', 'advanced', 250.00, '50 minutes', true);

-- Get template IDs for product associations
DO $$
DECLARE
    basic_tape_id UUID;
    coverage_support_id UUID;
    comprehensive_id UUID;
    cold_therapy_id UUID;
    first_aid_id UUID;
    professional_taping_id UUID;
    pain_management_id UUID;
    rehabilitation_id UUID;
BEGIN
    -- Get template IDs
    SELECT id INTO basic_tape_id FROM public.starter_kit_templates WHERE name = 'Basic Tape Starter';
    SELECT id INTO coverage_support_id FROM public.starter_kit_templates WHERE name = 'Coverage + Support';
    SELECT id INTO comprehensive_id FROM public.starter_kit_templates WHERE name = 'Comprehensive Kit';
    SELECT id INTO cold_therapy_id FROM public.starter_kit_templates WHERE name = 'Cold Therapy Essentials';
    SELECT id INTO first_aid_id FROM public.starter_kit_templates WHERE name = 'First Aid Emergency Kit';
    SELECT id INTO professional_taping_id FROM public.starter_kit_templates WHERE name = 'Professional Taping Kit';
    SELECT id INTO pain_management_id FROM public.starter_kit_templates WHERE name = 'Pain Management Kit';
    SELECT id INTO rehabilitation_id FROM public.starter_kit_templates WHERE name = 'Rehabilitation Support Kit';

    -- Basic Tape Starter products
    INSERT INTO public.template_products (template_id, product_id, quantity, is_required, notes) VALUES
    (basic_tape_id, '550e8400-e29b-41d4-a716-446655440000', 1, true, 'Essential pre-wrap for skin protection'),
    (basic_tape_id, '550e8400-e29b-41d4-a716-446655440001', 1, true, 'Standard athletic tape for basic support');

    -- Coverage + Support products
    INSERT INTO public.template_products (template_id, product_id, quantity, is_required, notes) VALUES
    (coverage_support_id, '550e8400-e29b-41d4-a716-446655440000', 1, true, 'Pre-wrap foundation'),
    (coverage_support_id, '550e8400-e29b-41d4-a716-446655440001', 1, true, 'Athletic tape'),
    (coverage_support_id, '550e8400-e29b-41d4-a716-446655440002', 1, true, 'Self-adherent wrap'),
    (coverage_support_id, '550e8400-e29b-41d4-a716-446655440004', 1, true, 'Elastic bandage for compression'),
    (coverage_support_id, '550e8400-e29b-41d4-a716-446655440005', 1, true, 'Gauze pads for wound care');

    -- Comprehensive Kit products
    INSERT INTO public.template_products (template_id, product_id, quantity, is_required, notes) VALUES
    (comprehensive_id, '550e8400-e29b-41d4-a716-446655440000', 1, true, 'Pre-wrap'),
    (comprehensive_id, '550e8400-e29b-41d4-a716-446655440001', 1, true, 'Athletic tape'),
    (comprehensive_id, '550e8400-e29b-41d4-a716-446655440002', 1, true, 'Cohesive bandage'),
    (comprehensive_id, '550e8400-e29b-41d4-a716-446655440003', 1, true, 'Kinesiology tape'),
    (comprehensive_id, '550e8400-e29b-41d4-a716-446655440004', 1, true, 'Elastic bandage'),
    (comprehensive_id, '550e8400-e29b-41d4-a716-446655440005', 1, true, 'Gauze pads'),
    (comprehensive_id, '550e8400-e29b-41d4-a716-446655440006', 1, false, 'Foam padding for extra protection');

    -- Cold Therapy Essentials products
    INSERT INTO public.template_products (template_id, product_id, quantity, is_required, notes) VALUES
    (cold_therapy_id, '550e8400-e29b-41d4-a716-446655440009', 1, true, 'Instant ice packs for immediate use'),
    (cold_therapy_id, '550e8400-e29b-41d4-a716-446655440010', 1, true, 'Reusable gel packs'),
    (cold_therapy_id, '550e8400-e29b-41d4-a716-446655440004', 1, true, 'Elastic bandage for securing ice packs');

    -- First Aid Emergency Kit products
    INSERT INTO public.template_products (template_id, product_id, quantity, is_required, notes) VALUES
    (first_aid_id, '550e8400-e29b-41d4-a716-446655440012', 1, true, 'Complete first aid kit'),
    (first_aid_id, '550e8400-e29b-41d4-a716-446655440013', 1, true, 'Antiseptic wipes'),
    (first_aid_id, '550e8400-e29b-41d4-a716-446655440005', 2, true, 'Extra gauze pads'),
    (first_aid_id, '550e8400-e29b-41d4-a716-446655440011', 1, true, 'Medical scissors');

    -- Professional Taping Kit products
    INSERT INTO public.template_products (template_id, product_id, quantity, is_required, notes) VALUES
    (professional_taping_id, '550e8400-e29b-41d4-a716-446655440000', 2, true, 'Multiple pre-wrap rolls'),
    (professional_taping_id, '550e8400-e29b-41d4-a716-446655440001', 2, true, 'Multiple athletic tape rolls'),
    (professional_taping_id, '550e8400-e29b-41d4-a716-446655440007', 1, true, 'Zinc oxide tape for rigid support'),
    (professional_taping_id, '550e8400-e29b-41d4-a716-446655440014', 1, true, 'Tuf-Skin adherent'),
    (professional_taping_id, '550e8400-e29b-41d4-a716-446655440011', 1, true, 'Professional scissors');

    -- Pain Management Kit products
    INSERT INTO public.template_products (template_id, product_id, quantity, is_required, notes) VALUES
    (pain_management_id, '550e8400-e29b-41d4-a716-446655440017', 1, true, 'Topical analgesic gel'),
    (pain_management_id, '550e8400-e29b-41d4-a716-446655440009', 1, true, 'Instant ice packs'),
    (pain_management_id, '550e8400-e29b-41d4-a716-446655440010', 1, true, 'Reusable gel packs'),
    (pain_management_id, '550e8400-e29b-41d4-a716-446655440003', 1, true, 'Kinesiology tape for muscle support');

    -- Rehabilitation Support Kit products
    INSERT INTO public.template_products (template_id, product_id, quantity, is_required, notes) VALUES
    (rehabilitation_id, '550e8400-e29b-41d4-a716-446655440015', 1, true, 'Ankle braces for support'),
    (rehabilitation_id, '550e8400-e29b-41d4-a716-446655440016', 1, true, 'Elastic adhesive bandages'),
    (rehabilitation_id, '550e8400-e29b-41d4-a716-446655440003', 2, true, 'Kinesiology tape for rehabilitation'),
    (rehabilitation_id, '550e8400-e29b-41d4-a716-446655440017', 1, true, 'Pain relief gel'),
    (rehabilitation_id, '550e8400-e29b-41d4-a716-446655440010', 1, true, 'Reusable ice packs');

END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.starter_kit_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_products TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;