-- Langgor Game relational schema (PostgreSQL 16+ / Supabase)
-- Game login is passwordless: a signed game cookie is issued only after a
-- unique code and second-step device approval are both verified.
-- Never store raw game cookies. Store only a keyed token hash.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username citext NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{4,20}$'),
  email citext NOT NULL UNIQUE,
  -- Used for the web Game Hub only. The game itself does not accept passwords.
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
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
  id text PRIMARY KEY CHECK (id IN ('cookie-basic','cookie-premkum','cookie-ultra')),
  name text NOT NULL UNIQUE CHECK (name IN ('Cookie Basic','Cookie Premkum','Cookie Ultra')),
  price bigint NOT NULL CHECK (price >= 1000),
  duration_days integer NOT NULL CHECK (duration_days > 0),
  device_limit integer NOT NULL CHECK (device_limit BETWEEN 1 AND 3),
  activation_priority smallint NOT NULL CHECK (activation_priority BETWEEN 1 AND 3),
  active boolean NOT NULL DEFAULT true,
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO cookie_plans (id,name,price,duration_days,device_limit,activation_priority,specs) VALUES
  ('cookie-basic','Cookie Basic',25000,7,1,1,'["Verifikasi unik","2-step verification"]'),
  ('cookie-premkum','Cookie Premkum',59000,30,2,2,'["Verifikasi prioritas","Riwayat sesi 30 hari"]'),
  ('cookie-ultra','Cookie Ultra',129000,90,3,3,'["Fast session recovery","Prioritas aktivasi tertinggi"]')
ON CONFLICT (id) DO UPDATE SET price=EXCLUDED.price,duration_days=EXCLUDED.duration_days,device_limit=EXCLUDED.device_limit,activation_priority=EXCLUDED.activation_priority,specs=EXCLUDED.specs,updated_at=now();

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id varchar(20) NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id text NOT NULL REFERENCES cookie_plans(id) ON DELETE RESTRICT,
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

CREATE TABLE trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_device_id text NOT NULL,
  display_name varchar(80) NOT NULL,
  device_fingerprint_hash text NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  UNIQUE(user_id,public_device_id)
);
CREATE INDEX trusted_devices_user_idx ON trusted_devices(user_id,revoked_at);

CREATE TABLE verification_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES trusted_devices(id) ON DELETE SET NULL,
  -- Hash the unique one-time code; never persist its plaintext value.
  unique_code_hash text NOT NULL,
  first_step_verified_at timestamptz,
  second_step_verified_at timestamptz,
  attempt_count smallint NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','first_step_verified','approved','rejected','expired','locked')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX verification_pending_idx ON verification_challenges(user_id,status,expires_at);

CREATE TABLE game_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id text NOT NULL REFERENCES cookie_plans(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  device_limit integer NOT NULL CHECK (device_limit BETWEEN 1 AND 3),
  status text NOT NULL CHECK (status IN ('active','expired','revoked','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > starts_at)
);
CREATE INDEX entitlements_active_idx ON game_entitlements(user_id,status,expires_at);

CREATE TABLE game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_id uuid NOT NULL REFERENCES game_entitlements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES trusted_devices(id) ON DELETE RESTRICT,
  verification_id uuid NOT NULL UNIQUE REFERENCES verification_challenges(id) ON DELETE RESTRICT,
  -- HMAC-SHA256 or stronger keyed hash of the issued game cookie.
  session_token_hash text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  CHECK (expires_at > issued_at)
);
CREATE INDEX game_sessions_user_idx ON game_sessions(user_id,revoked_at,expires_at);

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

CREATE TABLE security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  device_id uuid REFERENCES trusted_devices(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('code_failed','device_requested','device_approved','device_rejected','session_issued','session_revoked','fraud_flag')),
  risk_score smallint CHECK (risk_score BETWEEN 0 AND 100),
  ip_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX security_events_review_idx ON security_events(event_type,risk_score DESC,created_at DESC);

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

-- Production flow:
-- 1. Verify the payment provider signature and amount.
-- 2. Lock order/challenge rows with SELECT ... FOR UPDATE.
-- 3. Validate both challenge timestamps, expiry, user, and device ownership.
-- 4. Count non-revoked sessions against the entitlement device_limit.
-- 5. Issue a high-entropy signed cookie; persist only its keyed hash.
-- 6. Set HttpOnly, Secure, SameSite and narrow Path/Domain attributes.
