-- Run this migration on projects that already use an older Langgor schema.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_path text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_path text;
