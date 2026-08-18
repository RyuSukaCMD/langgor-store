-- Adds two-color profile gradients, animated effects, and entrance animations.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accent_secondary varchar(7) NOT NULL DEFAULT '#22d3ee';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_effect text NOT NULL DEFAULT 'none'
  CHECK (profile_effect IN ('none','aurora','stardust','comet','ripple','pixels'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_animation text NOT NULL DEFAULT 'fade'
  CHECK (profile_animation IN ('fade','rise','zoom','slide','flip'));
