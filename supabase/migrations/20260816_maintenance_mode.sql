-- Adds a single source of truth for maintenance mode.
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY CHECK (key = 'maintenance'),
  maintenance_enabled boolean NOT NULL DEFAULT false,
  maintenance_reason varchar(300) NOT NULL DEFAULT '',
  maintenance_estimated_end_at timestamptz,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings(key)
VALUES('maintenance')
ON CONFLICT(key) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_settings FROM anon, authenticated;
GRANT ALL ON TABLE public.site_settings TO service_role;
