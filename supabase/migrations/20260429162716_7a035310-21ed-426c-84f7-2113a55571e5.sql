ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS type_professional text DEFAULT 'professor';
UPDATE public.teachers SET type_professional = 'professor' WHERE type_professional IS NULL;