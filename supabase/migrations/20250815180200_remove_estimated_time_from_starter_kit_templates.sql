-- Remove estimated_time column from starter_kit_templates table
ALTER TABLE IF EXISTS public.starter_kit_templates 
DROP COLUMN IF EXISTS estimated_time;