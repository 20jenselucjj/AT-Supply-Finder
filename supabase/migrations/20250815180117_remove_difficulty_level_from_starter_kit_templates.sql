-- Remove difficulty_level column from starter_kit_templates table
ALTER TABLE IF EXISTS public.starter_kit_templates 
DROP COLUMN IF EXISTS difficulty_level;