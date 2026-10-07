-- ─── SGHawkers PostgreSQL Schema ────────────────────────────────────────────
-- Run: psql -U postgres -d sghawkers -f schema.sql

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────
CREATE TYPE order_status    AS ENUM ('new','preparing','ready','collected','delivered','cancelled');
CREATE TYPE order_type      AS ENUM ('pickup','delivery','walkin');
CREATE TYPE payment_method  AS ENUM ('cash','paynow','card');
CREATE TYPE stock_level     AS ENUM ('ok','low','soldout');
CREATE TYPE disposal_method AS ENUM ('food_bank','compost','bin','returned_supplier');
CREATE TYPE promo_type      AS ENUM ('percent','fixed','free_item');

-- ─── HAWKER CENTRES ──────────────────────────────────────────────────────────
CREATE TABLE centres (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         VARCHAR(50) UNIQUE NOT NULL,
  name         VARCHAR(200) NOT NULL,
  area         VARCHAR(100),
  address      TEXT,
  distance_km  NUMERIC(5,2),
  total_stalls INTEGER DEFAULT 0,
  rating       NUMERIC(3,2) DEFAULT 0,
  image_emoji  VARCHAR(10),
  eco          BOOLEAN DEFAULT FALSE,
  wait_time    VARCHAR(20) DEFAULT 'moderate',
  dietary_tags TEXT[] DEFAULT '{}',
  lat          NUMERIC(10,7),
  lon          NUMERIC(10,7),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STALLS ──────────────────────────────────────────────────────────────────
CREATE TABLE stalls (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centre_id     UUID REFERENCES centres(id) ON DELETE CASCADE,
  slug          VARCHAR(50) UNIQUE NOT NULL,
  name          VARCHAR(200) NOT NULL,
  heritage_year VARCHAR(10),
  story         TEXT,
  hawker_bio    TEXT,
  awards        TEXT[] DEFAULT '{}',
  stall_type    VARCHAR(100),
  rating        NUMERIC(3,2) DEFAULT 0,
  review_count  INTEGER DEFAULT 0,
  wait_mins     INTEGER DEFAULT 10,
  wait_level    VARCHAR(20) DEFAULT 'moderate',
  image_emoji   VARCHAR(10),
  eco           BOOLEAN DEFAULT FALSE,
  dietary_tags  TEXT[] DEFAULT '{}',
  tags          TEXT[] DEFAULT '{}',
  is_open       BOOLEAN DEFAULT TRUE,
  loyalty_total INTEGER DEFAULT 10,
  loyalty_reward VARCHAR(200),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MENU ITEMS ──────────────────────────────────────────────────────────────
CREATE TABLE menu_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id      UUID REFERENCES stalls(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  price         NUMERIC(8,2) NOT NULL,
  cost          NUMERIC(8,2) DEFAULT 0,
  category      VARCHAR(100),
  calories      INTEGER,
  eco           BOOLEAN DEFAULT FALSE,
  is_popular    BOOLEAN DEFAULT FALSE,
  is_hot        BOOLEAN DEFAULT FALSE,
  stock_level   stock_level DEFAULT 'ok',
  is_sold_out   BOOLEAN DEFAULT FALSE,
  portions_left INTEGER DEFAULT 50,
  daily_max     INTEGER DEFAULT 50,
  dietary_tags  TEXT[] DEFAULT '{}',
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CUSTOMERS ───────────────────────────────────────────────────────────────
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          VARCHAR(200),
  phone         VARCHAR(20),
  dietary_prefs TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CUSTOMER FAVOURITES ─────────────────────────────────────────────────────
CREATE TABLE customer_fav_stalls (
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  stall_id    UUID REFERENCES stalls(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (customer_id, stall_id)
);

CREATE TABLE customer_fav_items (
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (customer_id, item_id)
);

-- ─── LOYALTY STAMPS ──────────────────────────────────────────────────────────
CREATE TABLE loyalty_stamps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  stall_id    UUID REFERENCES stalls(id) ON DELETE CASCADE,
  stamps      INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (customer_id, stall_id)
);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_ref       VARCHAR(30) UNIQUE NOT NULL,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  stall_id        UUID REFERENCES stalls(id) ON DELETE SET NULL,
  centre_id       UUID REFERENCES centres(id) ON DELETE SET NULL,
  customer_name   VARCHAR(200),
  order_type      order_type NOT NULL,
  status          order_status DEFAULT 'new',
  subtotal        NUMERIC(8,2) NOT NULL,
  delivery_fee    NUMERIC(8,2) DEFAULT 0,
  eco_discount    NUMERIC(8,2) DEFAULT 0,
  total           NUMERIC(8,2) NOT NULL,
  eco_container   BOOLEAN DEFAULT FALSE,
  scheduled_date  DATE,
  scheduled_time  VARCHAR(10),
  note            TEXT,
  group_order     BOOLEAN DEFAULT FALSE,
  group_members   TEXT[] DEFAULT '{}',
  prep_mins       INTEGER,
  started_at      TIMESTAMPTZ,
  ready_at        TIMESTAMPTZ,
  collected_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name        VARCHAR(200) NOT NULL,
  qty         INTEGER NOT NULL,
  unit_price  NUMERIC(8,2) NOT NULL,
  subtotal    NUMERIC(8,2) NOT NULL
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type        VARCHAR(50),
  icon        VARCHAR(10),
  title       VARCHAR(200) NOT NULL,
  body        TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HAWKER STAFF ────────────────────────────────────────────────────────────
CREATE TABLE hawker_staff (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id    UUID REFERENCES stalls(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  role        VARCHAR(50) NOT NULL,
  pin_hash    TEXT NOT NULL,
  avatar      VARCHAR(10) DEFAULT '👤',
  phone       VARCHAR(30),               
  address     TEXT, 
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHIFT LOG ───────────────────────────────────────────────────────────────
CREATE TABLE shift_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id     UUID REFERENCES hawker_staff(id) ON DELETE CASCADE,
  stall_id     UUID REFERENCES stalls(id) ON DELETE CASCADE,
  clock_in     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out    TIMESTAMPTZ,
  hours_worked NUMERIC(5,2),
  date         DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ─── INGREDIENTS / INVENTORY ─────────────────────────────────────────────────
CREATE TABLE ingredients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id        UUID REFERENCES stalls(id) ON DELETE CASCADE,
  supplier_id     UUID,
  name            VARCHAR(200) NOT NULL,
  unit            VARCHAR(50),
  category        VARCHAR(100),
  qty             NUMERIC(10,3) DEFAULT 0,
  min_qty         NUMERIC(10,3) DEFAULT 0,
  max_qty         NUMERIC(10,3) DEFAULT 100,
  cost_per_unit   NUMERIC(8,2) DEFAULT 0,
  expiry_days     INTEGER,
  last_restocked  DATE,
  used_per_day    NUMERIC(10,3) DEFAULT 0,
  note            TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHIFT SIGNATURES ────────────────────────────────────────────────────────
ALTER TABLE shift_log ADD COLUMN IF NOT EXISTS signature TEXT;

-- ─── STAFF NOTES ─────────────────────────────────────────────────────────────
CREATE TABLE staff_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id   UUID REFERENCES stalls(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  text       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (stall_id, date)
);

-- ─── STAFF TASKS ─────────────────────────────────────────────────────────────
CREATE TABLE staff_tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id    UUID REFERENCES stalls(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  title       VARCHAR(200) NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  assigned_to VARCHAR(200) DEFAULT 'all',
  color       VARCHAR(50)  DEFAULT 'var(--gold)',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_notes_stall ON staff_notes(stall_id, date);
CREATE INDEX idx_staff_tasks_stall ON staff_tasks(stall_id, date);

-- ─── SUPPLIERS ───────────────────────────────────────────────────────────────
CREATE TABLE suppliers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id    UUID REFERENCES stalls(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  contact     VARCHAR(50),
  email       VARCHAR(200),
  lead_days   INTEGER DEFAULT 1,
  min_order   NUMERIC(8,2) DEFAULT 0,
  notes       TEXT
);

-- ─── SUPPLIER INGREDIENT LINK ────────────────────────────────────────────────
CREATE TABLE supplier_ingredients (
  supplier_id    UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  ingredient_id  UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, ingredient_id)
);

-- ─── TRANSACTIONS (CASHIER POS) ───────────────────────────────────────────────
CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  txn_ref     VARCHAR(30) UNIQUE NOT NULL,
  stall_id    UUID REFERENCES stalls(id) ON DELETE SET NULL,
  staff_id    UUID REFERENCES hawker_staff(id) ON DELETE SET NULL,
  subtotal    NUMERIC(8,2),
  discount    NUMERIC(8,2) DEFAULT 0,
  total       NUMERIC(8,2),
  method      payment_method NOT NULL,
  cash_given  NUMERIC(8,2) DEFAULT 0,
  change_due  NUMERIC(8,2) DEFAULT 0,
  paynow_ref  VARCHAR(50),
  txn_type    VARCHAR(20) DEFAULT 'walkin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transaction_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  name           VARCHAR(200),
  qty            INTEGER,
  unit_price     NUMERIC(8,2),
  subtotal       NUMERIC(8,2)
);

-- ─── EXPENSES (ACCOUNTING) ────────────────────────────────────────────────────
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id    UUID REFERENCES stalls(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  category    VARCHAR(100),
  description TEXT,
  amount      NUMERIC(8,2) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WASTE LOG (ECO TRACK) ────────────────────────────────────────────────────
CREATE TABLE waste_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id    UUID REFERENCES stalls(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  item_name   VARCHAR(200),
  qty         NUMERIC(10,3),
  unit        VARCHAR(50),
  reason      VARCHAR(200),
  value_lost  NUMERIC(8,2),
  disposed    disposal_method DEFAULT 'bin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROMOS ──────────────────────────────────────────────────────────────────
CREATE TABLE promos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id    UUID REFERENCES stalls(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  type        promo_type NOT NULL,
  value       NUMERIC(8,2) DEFAULT 0,
  min_spend   NUMERIC(8,2) DEFAULT 0,
  start_time  TIME DEFAULT '00:00',
  end_time    TIME DEFAULT '23:59',
  active_days TEXT[] DEFAULT '{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',
  is_active   BOOLEAN DEFAULT TRUE,
  used_today  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SETTINGS ────────────────────────────────────────────────────────────────
CREATE TABLE stall_settings (
  stall_id         UUID PRIMARY KEY REFERENCES stalls(id) ON DELETE CASCADE,
  open_time        TIME DEFAULT '10:00',
  close_time       TIME DEFAULT '20:00',
  closed_days      TEXT[] DEFAULT '{}',
  phone            VARCHAR(30),
  email            VARCHAR(200),
  paynow_uen       VARCHAR(50),
  paynow_name      VARCHAR(200),
  low_stock_alert  BOOLEAN DEFAULT TRUE,
  expiry_alert     BOOLEAN DEFAULT TRUE,
  order_ready_alert BOOLEAN DEFAULT TRUE,
  auto_notify_late BOOLEAN DEFAULT TRUE,
  prep_time_base   INTEGER DEFAULT 8,
  prep_time_per_item INTEGER DEFAULT 3,
  daily_wage_cashier NUMERIC(8,2) DEFAULT 80,
  daily_wage_kitchen NUMERIC(8,2) DEFAULT 90,
  loyalty_stamps_total INTEGER DEFAULT 10,
  loyalty_reward   VARCHAR(200),
  loyalty_bonus_at INTEGER DEFAULT 5,
  loyalty_bonus_item VARCHAR(200),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  stall_id    UUID REFERENCES stalls(id) ON DELETE CASCADE,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  customer_name VARCHAR(200),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_orders_stall      ON orders(stall_id);
CREATE INDEX idx_orders_customer   ON orders(customer_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_created    ON orders(created_at DESC);
CREATE INDEX idx_menu_stall        ON menu_items(stall_id);
CREATE INDEX idx_ingredients_stall ON ingredients(stall_id);
CREATE INDEX idx_transactions_stall ON transactions(stall_id);
CREATE INDEX idx_notifs_customer   ON notifications(customer_id, is_read);
CREATE INDEX idx_loyalty_customer  ON loyalty_stamps(customer_id);
CREATE INDEX idx_stalls_centre     ON stalls(centre_id);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_menu_updated    BEFORE UPDATE ON menu_items   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated  BEFORE UPDATE ON orders       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ingred_updated  BEFORE UPDATE ON ingredients  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON stall_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
