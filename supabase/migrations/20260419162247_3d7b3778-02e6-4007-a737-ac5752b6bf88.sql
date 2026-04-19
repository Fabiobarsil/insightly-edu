
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS offers_ensino_medio boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS offers_eja boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offers_curso_tecnico boolean NOT NULL DEFAULT false;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS modality text;
