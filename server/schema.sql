-- Langgor Store relational schema (PostgreSQL 16+ / Supabase)
-- Login Cookies are sensitive credentials. Never store them in plaintext.
-- Encrypt inventory with a managed KMS key and expose delivery only to the buyer.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username citext NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{4,20}$'),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','moderator','admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname varchar(32) NOT NULL,
  bio varchar(160) NOT NULL DEFAULT '',
  avatar_url text,
  banner_url text,
  accent varchar(7) NOT NULL DEFAULT '#8b5cf6'
);

CREATE TABLE cookie_plans (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{3,64}$'),
  name varchar(80) NOT NULL UNIQUE,
  category varchar(40) NOT NULL,
  description varchar(400) NOT NULL,
  price bigint NOT NULL CHECK (price >= 1000),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','limited','sold')),
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  icon varchar(2) NOT NULL DEFAULT 'C',
  accent text NOT NULL DEFAULT 'violet' CHECK (accent IN ('violet','pink','cyan','amber')),
  sold integer NOT NULL DEFAULT 0 CHECK (sold >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO cookie_plans (id,name,category,description,price,stock,status,specs,icon,accent) VALUES
  ('cookie-basic','Cookie Basic','Normal Cookie','Cookie login dari stok standar dengan pemeriksaan real-time sebelum dikirim otomatis.',6000,13,'ready','["1 Cookie login","Pemeriksaan real-time","Pengiriman otomatis"]','B','cyan'),
  ('cookie-premkum','Cookie Premkum','Highest Cookie','Cookie login dari kelompok stok dengan kriteria lebih tinggi dan prioritas pengiriman.',12000,8,'ready','["1 Cookie login","Prioritas stok","Pengiriman otomatis"]','P','violet'),
  ('cookie-ultra','Cookie Ultra','Top Stock','Pilihan Cookie login dari stok teratas dengan prioritas validasi dan delivery tertinggi.',25000,4,'limited','["1 Cookie login","Validasi prioritas","Pengiriman otomatis"]','U','pink')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE cookie_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL REFERENCES cookie_plans(id) ON DELETE RESTRICT,
  encrypted_payload bytea NOT NULL,
  encrypted_data_key bytea NOT NULL,
  kms_key_version text NOT NULL,
  payload_fingerprint text NOT NULL UNIQUE,
  criteria_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','delivered','invalid','removed')),
  validated_at timestamptz,
  validation_expires_at timestamptz,
  reserved_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cookie_inventory_stock_idx ON cookie_inventory(plan_id,status,validated_at DESC);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id varchar(20) NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id text NOT NULL REFERENCES cookie_plans(id) ON DELETE RESTRICT,
  inventory_id uuid UNIQUE REFERENCES cookie_inventory(id) ON DELETE RESTRICT,
  amount bigint NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled','refunded')),
  plan_snapshot jsonb NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON orders(user_id,created_at DESC);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider varchar(40) NOT NULL,
  provider_reference text UNIQUE,
  amount bigint NOT NULL CHECK (amount >= 0),
  status text NOT NULL CHECK (status IN ('pending','verified','failed','expired','refunded')),
  provider_payload_hash text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON payments(order_id,created_at DESC);

CREATE TABLE cookie_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  inventory_id uuid NOT NULL UNIQUE REFERENCES cookie_inventory(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  revoked_at timestamptz
);
CREATE INDEX cookie_deliveries_buyer_idx ON cookie_deliveries(buyer_id,delivered_at DESC);

CREATE TABLE validation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid REFERENCES cookie_inventory(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  result text NOT NULL CHECK (result IN ('valid','invalid','timeout','error')),
  latency_ms integer CHECK (latency_ms >= 0),
  response_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX validation_events_recent_idx ON validation_events(created_at DESC,result);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(40) NOT NULL,
  title varchar(100) NOT NULL,
  body varchar(300) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications(user_id,read_at,created_at DESC);

CREATE TABLE admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action varchar(80) NOT NULL,
  target_type varchar(40) NOT NULL,
  target_id text,
  reason text,
  before_state jsonb,
  after_state jsonb,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_actions_audit_idx ON admin_actions(created_at DESC,admin_id);

-- Production delivery flow:
-- 1. Verify payment provider signature, amount, and idempotency key.
-- 2. Lock the selected inventory row with SELECT ... FOR UPDATE SKIP LOCKED.
-- 3. Validate the Cookie immediately before assigning it to an order.
-- 4. Keep the payload encrypted and authorize every delivery read by buyer_id.
-- 5. Never return Cookie payloads from list, notification, log, or admin endpoints.
