-- Langgor Store — Supabase schema
-- Run this file once in Supabase SQL Editor, then create the first admin with:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-admin@email.com';

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{4,20}$'),
  email citext NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','moderator','admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  nickname varchar(32) NOT NULL,
  bio varchar(160) NOT NULL DEFAULT '',
  avatar_url text,
  avatar_path text,
  banner_url text,
  banner_path text,
  accent varchar(7) NOT NULL DEFAULT '#8b5cf6',
  accent_secondary varchar(7) NOT NULL DEFAULT '#22d3ee',
  profile_effect text NOT NULL DEFAULT 'none' CHECK (profile_effect IN ('none','aurora','stardust','comet','ripple','pixels')),
  profile_animation text NOT NULL DEFAULT 'fade' CHECK (profile_animation IN ('fade','rise','zoom','slide','flip')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{3,64}$'),
  kind text NOT NULL DEFAULT 'cookie' CHECK (kind = 'cookie'),
  name varchar(80) NOT NULL UNIQUE,
  category varchar(40) NOT NULL,
  description varchar(400) NOT NULL,
  price bigint NOT NULL CHECK (price >= 1000),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','limited','sold')),
  specs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(specs) = 'array'),
  icon varchar(2) NOT NULL DEFAULT 'C',
  accent text NOT NULL DEFAULT 'violet' CHECK (accent IN ('violet','pink','cyan','amber')),
  sold integer NOT NULL DEFAULT 0 CHECK (sold >= 0),
  rating numeric(2,1) NOT NULL DEFAULT 5.0 CHECK (rating BETWEEN 0 AND 5),
  publisher_name varchar(80) NOT NULL,
  publisher_username varchar(40) NOT NULL,
  publisher_verified boolean NOT NULL DEFAULT false,
  image_url text,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_catalog_idx ON public.products(status,created_at DESC);

-- Safe upgrades for projects that ran an earlier schema revision.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_path text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accent_secondary varchar(7) NOT NULL DEFAULT '#22d3ee';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_effect text NOT NULL DEFAULT 'none' CHECK (profile_effect IN ('none','aurora','stardust','comet','ripple','pixels'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_animation text NOT NULL DEFAULT 'fade' CHECK (profile_animation IN ('fade','rise','zoom','slide','flip'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_path text;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id varchar(20) NOT NULL UNIQUE,
  buyer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  payment_method text NOT NULL CHECK (payment_method IN ('balance','bank','ewallet')),
  unit_price bigint NOT NULL CHECK (unit_price >= 0),
  service_fee bigint NOT NULL DEFAULT 0 CHECK (service_fee >= 0),
  total bigint GENERATED ALWAYS AS (unit_price + service_fee) STORED,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled','refunded')),
  product_snapshot jsonb NOT NULL,
  idempotency_key uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_buyer_idx ON public.orders(buyer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status,created_at DESC);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  provider varchar(40) NOT NULL,
  provider_reference text UNIQUE,
  amount bigint NOT NULL CHECK (amount >= 0),
  status text NOT NULL CHECK (status IN ('pending','verified','failed','expired','refunded')),
  provider_payload_hash text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_order_idx ON public.payments(order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.cookie_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  encrypted_payload bytea NOT NULL,
  encrypted_data_key bytea NOT NULL,
  kms_key_version text NOT NULL,
  payload_fingerprint text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','delivered','invalid','removed')),
  validated_at timestamptz,
  validation_expires_at timestamptz,
  reserved_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_stock_idx ON public.cookie_inventory(product_id,status,validated_at DESC);

CREATE TABLE IF NOT EXISTS public.cookie_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  inventory_id uuid NOT NULL UNIQUE REFERENCES public.cookie_inventory(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS deliveries_buyer_idx ON public.cookie_deliveries(buyer_id,delivered_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('success','warning','info','security')),
  title varchar(100) NOT NULL,
  body varchar(300) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id,read_at,created_at DESC);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY CHECK (key = 'maintenance'),
  maintenance_enabled boolean NOT NULL DEFAULT false,
  maintenance_reason varchar(300) NOT NULL DEFAULT '',
  maintenance_estimated_end_at timestamptz,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.site_settings(key) VALUES('maintenance') ON CONFLICT(key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action varchar(80) NOT NULL,
  target_type varchar(40) NOT NULL,
  target_id text,
  before_state jsonb,
  after_state jsonb,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_actions_idx ON public.admin_actions(created_at DESC,admin_id);

-- New Supabase Auth users automatically receive public user/profile rows.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  requested_username text;
  final_username text;
  requested_nickname text;
BEGIN
  requested_username := lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)), '[^a-z0-9_]', '', 'g'));
  IF length(requested_username) < 4 THEN requested_username := 'user_' || substr(replace(NEW.id::text,'-',''),1,8); END IF;
  final_username := left(requested_username,20);
  IF EXISTS (SELECT 1 FROM public.users WHERE username = final_username) THEN final_username := left(requested_username,11) || '_' || substr(replace(NEW.id::text,'-',''),1,8); END IF;
  requested_nickname := left(COALESCE(NEW.raw_user_meta_data->>'nickname', final_username),32);
  INSERT INTO public.users(id,username,email) VALUES(NEW.id,final_username,NEW.email);
  INSERT INTO public.profiles(user_id,nickname) VALUES(NEW.id,requested_nickname);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Called only by the service-role backend. Price and stock are read inside a locked transaction.
CREATE OR REPLACE FUNCTION public.create_order_admin(p_buyer_id uuid,p_product_id text,p_payment_method text)
RETURNS TABLE(display_id text,status text,total bigint)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  selected_product public.products%ROWTYPE;
  buyer public.users%ROWTYPE;
  generated_display_id text;
  generated_status text;
BEGIN
  IF p_payment_method NOT IN ('balance','bank','ewallet') THEN RAISE EXCEPTION 'Metode pembayaran tidak valid'; END IF;
  SELECT * INTO selected_product FROM public.products WHERE id=p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produk tidak ditemukan'; END IF;
  IF selected_product.status='sold' OR selected_product.stock<1 THEN RAISE EXCEPTION 'Stok produk sedang habis'; END IF;
  SELECT * INTO buyer FROM public.users WHERE id=p_buyer_id AND status='active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pengguna tidak aktif'; END IF;
  IF p_payment_method='balance' AND buyer.balance<selected_product.price THEN RAISE EXCEPTION 'Saldo tidak cukup'; END IF;
  IF p_payment_method='balance' THEN UPDATE public.users SET balance=balance-selected_product.price,updated_at=now() WHERE id=p_buyer_id; END IF;
  generated_display_id := 'LGR-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10));
  generated_status := CASE WHEN p_payment_method='balance' THEN 'processing' ELSE 'pending' END;
  INSERT INTO public.orders(display_id,buyer_id,product_id,payment_method,unit_price,status,product_snapshot)
  VALUES(generated_display_id,p_buyer_id,p_product_id,p_payment_method,selected_product.price,generated_status,jsonb_build_object('id',selected_product.id,'name',selected_product.name,'icon',selected_product.icon,'category',selected_product.category));
  UPDATE public.products SET stock=stock-1,status=CASE WHEN stock-1=0 THEN 'sold' ELSE status END,updated_at=now() WHERE id=p_product_id;
  INSERT INTO public.notifications(user_id,type,title,body,metadata) VALUES(p_buyer_id,'info','Order dibuat','Pembayaran dan validasi order sedang diproses.',jsonb_build_object('display_id',generated_display_id));
  RETURN QUERY SELECT generated_display_id,generated_status,selected_product.price;
END;
$$;
REVOKE ALL ON FUNCTION public.create_order_admin(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_admin(uuid,text,text) TO service_role;

-- Row Level Security: browser clients cannot bypass ownership rules.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_settings FROM anon, authenticated;
GRANT ALL ON TABLE public.site_settings TO service_role;

DROP POLICY IF EXISTS users_read_self ON public.users;
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS products_public_read ON public.products;
DROP POLICY IF EXISTS orders_read_self ON public.orders;
DROP POLICY IF EXISTS payments_read_own_order ON public.payments;
DROP POLICY IF EXISTS deliveries_read_self ON public.cookie_deliveries;
DROP POLICY IF EXISTS notifications_read_self ON public.notifications;
DROP POLICY IF EXISTS notifications_update_self ON public.notifications;
CREATE POLICY users_read_self ON public.users FOR SELECT TO authenticated USING (id=auth.uid());
CREATE POLICY profiles_public_read ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY products_public_read ON public.products FOR SELECT USING (true);
CREATE POLICY orders_read_self ON public.orders FOR SELECT TO authenticated USING (buyer_id=auth.uid());
CREATE POLICY payments_read_own_order ON public.payments FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.orders WHERE orders.id=payments.order_id AND orders.buyer_id=auth.uid()));
CREATE POLICY deliveries_read_self ON public.cookie_deliveries FOR SELECT TO authenticated USING (buyer_id=auth.uid());
CREATE POLICY notifications_read_self ON public.notifications FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY notifications_update_self ON public.notifications FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

-- Public profile media; writes are performed only by the server service-role.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('langgor-media','langgor-media',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=EXCLUDED.public,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS profile_media_public_read ON storage.objects;
CREATE POLICY profile_media_public_read ON storage.objects FOR SELECT USING (bucket_id='langgor-media');

-- Initial catalog lives in Supabase, not in application source/runtime memory.
INSERT INTO public.products(id,name,category,description,price,stock,status,specs,icon,accent,publisher_name,publisher_username,publisher_verified)
VALUES
 ('cookie-basic','Cookie Basic','Normal Cookie','Cookie login dari stok standar dengan pemeriksaan real-time sebelum dikirim otomatis.',6000,13,'ready','["1 Cookie login","Pemeriksaan real-time","Pengiriman otomatis"]','B','cyan','Langgor Store','langgor',true),
 ('cookie-premkum','Cookie Premkum','Highest Cookie','Cookie login dari kelompok stok dengan kriteria lebih tinggi dan prioritas pengiriman.',12000,8,'ready','["1 Cookie login","Prioritas stok","Pengiriman otomatis"]','P','violet','Langgor Store','langgor',true),
 ('cookie-ultra','Cookie Ultra','Top Stock','Pilihan Cookie login dari stok teratas dengan prioritas validasi dan delivery tertinggi.',25000,4,'limited','["1 Cookie login","Validasi prioritas","Pengiriman otomatis"]','U','pink','Langgor Store','langgor',true)
ON CONFLICT(id) DO NOTHING;
