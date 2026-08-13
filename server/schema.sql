-- Langgor Store relational schema (PostgreSQL 16+)
-- Currency values are stored as integer rupiah. Sensitive deliveries must be
-- envelope-encrypted with a managed KMS key before they reach this database.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username citext NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{4,20}$'),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','seller','admin')),
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
  accent varchar(7) NOT NULL DEFAULT '#8b5cf6',
  seller_status text NOT NULL DEFAULT 'none' CHECK (seller_status IN ('none','pending','verified','restricted')),
  joined_label_date date NOT NULL DEFAULT current_date
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('cookie','account')),
  name citext NOT NULL,
  slug citext NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(kind,name)
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('cookie','account')),
  title varchar(80) NOT NULL,
  description varchar(400) NOT NULL,
  price bigint NOT NULL CHECK (price >= 1000),
  stock integer NOT NULL DEFAULT 1 CHECK (stock >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','active','rejected','sold','removed')),
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  public_media jsonb NOT NULL DEFAULT '[]'::jsonb,
  moderation_note text,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_discovery_idx ON products(kind,status,category_id,created_at DESC);
CREATE INDEX products_seller_idx ON products(seller_id,status);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id varchar(20) NOT NULL UNIQUE,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price bigint NOT NULL CHECK (unit_price >= 0),
  service_fee bigint NOT NULL DEFAULT 0 CHECK (service_fee >= 0),
  total bigint GENERATED ALWAYS AS ((unit_price * quantity) + service_fee) STORED,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled','refunded')),
  product_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_buyer_idx ON orders(buyer_id,created_at DESC);
CREATE INDEX orders_seller_idx ON orders(seller_id,status,created_at DESC);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider varchar(40) NOT NULL,
  provider_reference text UNIQUE,
  amount bigint NOT NULL CHECK (amount >= 0),
  status text NOT NULL CHECK (status IN ('pending','verified','failed','expired','refunded')),
  verified_at timestamptz,
  provider_payload_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON payments(order_id,created_at DESC);

CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  encrypted_payload bytea NOT NULL,
  encrypted_data_key bytea NOT NULL,
  kms_key_version text NOT NULL,
  available_at timestamptz,
  viewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body varchar(800),
  created_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('suspicious_listing','abuse','fraud','credential_exposure','other')),
  detail varchar(1200) NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  assigned_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action varchar(80) NOT NULL,
  target_type varchar(40) NOT NULL,
  target_id uuid,
  reason text,
  before_state jsonb,
  after_state jsonb,
  ip_hash text NOT NULL,
  user_agent_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_actions_audit_idx ON admin_actions(created_at DESC,admin_id);

-- Apply authorization in the API transaction as well as database policies.
-- Seller writes must include: WHERE seller_id = current_user_id.
-- Payment webhook handlers must verify provider signatures and then lock the
-- order row (SELECT ... FOR UPDATE) before changing payment/order status.
