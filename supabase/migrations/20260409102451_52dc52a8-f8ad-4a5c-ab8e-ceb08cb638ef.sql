ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS rg text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS academic_year integer;