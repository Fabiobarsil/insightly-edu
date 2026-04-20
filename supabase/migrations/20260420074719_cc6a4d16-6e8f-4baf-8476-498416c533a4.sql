ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS offers_ensino_fundamental boolean NOT NULL DEFAULT false;