ALTER TABLE public.secretary_requests 
ADD COLUMN origin TEXT NOT NULL DEFAULT 'secretaria',
ADD COLUMN resolved_notified BOOLEAN NOT NULL DEFAULT false;