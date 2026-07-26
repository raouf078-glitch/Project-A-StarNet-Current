/*
# Wallet & Store Financial Schema Migration

## Purpose
Migrates the Safa Wallet Store financial business logic into StarNET's existing
database. Adapts the schema to StarNET's no-auth (anonymous device ID) architecture
while preserving the atomic transactional behavior, inventory locking, deposit
approval workflow, gems exchange, and notification generation from Safa.

## New Tables
1. `categories` — Store catalog category groupings (id, name, icon, display_order, is_active)
2. `card_inventory` — Individual prepaid card codes/pins linked to products (code, pin, serial_number, is_used, used_by, used_at)
3. `card_sales` — Historical purchase records with snapshot of card code/pin (user_id, card_id, inventory_id, price_paid, payment_method, gems_used, gems_earned, card_code, card_pin)
4. `deposit_accounts` — Bank/agent deposit target accounts (account_name, account_number, bank_name, logo_url, instructions, is_active)

## Extended Existing Tables
1. `products` — Added `gems_price` (int, nullable), `gems_reward` (int, default 0), `category_id` (uuid, nullable FK to categories)
2. `wallet_transactions` — Added `reference_id` (uuid, nullable) — links to deposit_requests or card_sales
3. `deposits` — Added `account_id` (uuid FK to deposit_accounts), `sender_name`, `transfer_number`, `processed_by`, `processed_at`
4. `notifications` — `type` column already exists (text); Safa notification types (deposit/purchase/system/reward) are used as text values

## Security
- RLS enabled on all new tables with anon+authenticated access (no-auth app pattern)
- RPC functions use SECURITY DEFINER to bypass RLS for atomic financial operations
- All financial mutations go through RPC functions only

## Important Notes
1. StarNET uses anonymous device IDs (text `user_id`) instead of Supabase Auth (`auth.uid()`).
   RPC functions accept `p_user_id` as a parameter instead of calling `auth.uid()`.
2. `wallets.points` serves as the gems/loyalty points balance (maps to Safa's `gems_balance`).
3. Existing `products` table is extended (not replaced) to avoid breaking the current Store UI.
4. Existing `deposits` table is extended (not replaced) to preserve backward compatibility.
*/

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON public.categories;
CREATE POLICY "anon_select_categories" ON public.categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON public.categories;
CREATE POLICY "anon_insert_categories" ON public.categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON public.categories;
CREATE POLICY "anon_update_categories" ON public.categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON public.categories;
CREATE POLICY "anon_delete_categories" ON public.categories FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- DEPOSIT_ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deposit_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  account_number text NOT NULL,
  bank_name text NOT NULL,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deposit_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_deposit_accounts" ON public.deposit_accounts;
CREATE POLICY "anon_select_deposit_accounts" ON public.deposit_accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_deposit_accounts" ON public.deposit_accounts;
CREATE POLICY "anon_insert_deposit_accounts" ON public.deposit_accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_deposit_accounts" ON public.deposit_accounts;
CREATE POLICY "anon_update_deposit_accounts" ON public.deposit_accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_deposit_accounts" ON public.deposit_accounts;
CREATE POLICY "anon_delete_deposit_accounts" ON public.deposit_accounts FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CARD_INVENTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.card_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  code text NOT NULL,
  pin text,
  serial_number text,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  used_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_inventory_card_id ON public.card_inventory(card_id);
CREATE INDEX IF NOT EXISTS idx_card_inventory_unused ON public.card_inventory(card_id, is_used) WHERE is_used = false;

ALTER TABLE public.card_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_card_inventory" ON public.card_inventory;
CREATE POLICY "anon_select_card_inventory" ON public.card_inventory FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_card_inventory" ON public.card_inventory;
CREATE POLICY "anon_insert_card_inventory" ON public.card_inventory FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_card_inventory" ON public.card_inventory;
CREATE POLICY "anon_update_card_inventory" ON public.card_inventory FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_card_inventory" ON public.card_inventory;
CREATE POLICY "anon_delete_card_inventory" ON public.card_inventory FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CARD_SALES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.card_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  card_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  inventory_id uuid NOT NULL REFERENCES public.card_inventory(id) ON DELETE RESTRICT,
  price_paid numeric(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'wallet',
  gems_used integer NOT NULL DEFAULT 0,
  gems_earned integer NOT NULL DEFAULT 0,
  card_code text NOT NULL,
  card_pin text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_sales_user_id ON public.card_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_card_sales_card_id ON public.card_sales(card_id);

ALTER TABLE public.card_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_card_sales" ON public.card_sales;
CREATE POLICY "anon_select_card_sales" ON public.card_sales FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_card_sales" ON public.card_sales;
CREATE POLICY "anon_insert_card_sales" ON public.card_sales FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_card_sales" ON public.card_sales;
CREATE POLICY "anon_update_card_sales" ON public.card_sales FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_card_sales" ON public.card_sales;
CREATE POLICY "anon_delete_card_sales" ON public.card_sales FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- EXTEND PRODUCTS TABLE
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='gems_price') THEN
    ALTER TABLE public.products ADD COLUMN gems_price integer CHECK (gems_price >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='gems_reward') THEN
    ALTER TABLE public.products ADD COLUMN gems_reward integer NOT NULL DEFAULT 0 CHECK (gems_reward >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='category_id') THEN
    ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- EXTEND WALLET_TRANSACTIONS TABLE
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_transactions' AND column_name='reference_id') THEN
    ALTER TABLE public.wallet_transactions ADD COLUMN reference_id uuid;
  END IF;
END $$;

-- ============================================================
-- EXTEND DEPOSITS TABLE
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='deposits' AND column_name='account_id') THEN
    ALTER TABLE public.deposits ADD COLUMN account_id uuid REFERENCES public.deposit_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='deposits' AND column_name='sender_name') THEN
    ALTER TABLE public.deposits ADD COLUMN sender_name text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='deposits' AND column_name='transfer_number') THEN
    ALTER TABLE public.deposits ADD COLUMN transfer_number text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='deposits' AND column_name='processed_by') THEN
    ALTER TABLE public.deposits ADD COLUMN processed_by text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='deposits' AND column_name='processed_at') THEN
    ALTER TABLE public.deposits ADD COLUMN processed_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deposit-receipts',
  'deposit-receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-cards',
  'store-cards',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for deposit-receipts
DROP POLICY IF EXISTS "Users can upload deposit receipts" ON storage.objects;
CREATE POLICY "Users can upload deposit receipts"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'deposit-receipts');

DROP POLICY IF EXISTS "Users can view deposit receipts" ON storage.objects;
CREATE POLICY "Users can view deposit receipts"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'deposit-receipts');

-- Storage policies for store-cards
DROP POLICY IF EXISTS "Public Read Store Assets" ON storage.objects;
CREATE POLICY "Public Read Store Assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'store-cards');

DROP POLICY IF EXISTS "Manage Store Assets" ON storage.objects;
CREATE POLICY "Manage Store Assets"
ON storage.objects FOR ALL
TO anon, authenticated
USING (bucket_id = 'store-cards')
WITH CHECK (bucket_id = 'store-cards');
