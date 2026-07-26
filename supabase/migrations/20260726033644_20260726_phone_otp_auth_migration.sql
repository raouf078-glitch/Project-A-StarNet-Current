/*
# Phone OTP Auth Migration (fix)

Fixes: CREATE POLICY does not support IF EXISTS. Uses DROP POLICY IF EXISTS first.
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  full_name text,
  is_admin boolean NOT NULL DEFAULT false,
  welcome_gift_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (NEW.id, NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- WALLETS — add uid column, authenticated RLS
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wallets' AND column_name='uid') THEN
    ALTER TABLE public.wallets ADD COLUMN uid uuid;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_wallets" ON public.wallets;
DROP POLICY IF EXISTS "anon_insert_wallets" ON public.wallets;
DROP POLICY IF EXISTS "anon_update_wallets" ON public.wallets;
DROP POLICY IF EXISTS "anon_delete_wallets" ON public.wallets;

DROP POLICY IF EXISTS "select_own_wallet" ON public.wallets;
CREATE POLICY "select_own_wallet" ON public.wallets FOR SELECT
  TO authenticated USING (auth.uid() = uid);

DROP POLICY IF EXISTS "insert_own_wallet" ON public.wallets;
CREATE POLICY "insert_own_wallet" ON public.wallets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uid);

DROP POLICY IF EXISTS "update_own_wallet" ON public.wallets;
CREATE POLICY "update_own_wallet" ON public.wallets FOR UPDATE
  TO authenticated USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);

-- ============================================================
-- WALLET_TRANSACTIONS — add uid, authenticated read-only
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_transactions' AND column_name='uid') THEN
    ALTER TABLE public.wallet_transactions ADD COLUMN uid uuid;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_wallet_transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "select_own_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "select_own_wallet_transactions" ON public.wallet_transactions FOR SELECT
  TO authenticated USING (auth.uid() = uid);

-- ============================================================
-- DEPOSITS — add uid, authenticated CRUD
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='deposits' AND column_name='uid') THEN
    ALTER TABLE public.deposits ADD COLUMN uid uuid;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_deposits" ON public.deposits;
DROP POLICY IF EXISTS "anon_insert_deposits" ON public.deposits;
DROP POLICY IF EXISTS "anon_update_deposits" ON public.deposits;
DROP POLICY IF EXISTS "anon_delete_deposits" ON public.deposits;

DROP POLICY IF EXISTS "select_own_deposits" ON public.deposits;
CREATE POLICY "select_own_deposits" ON public.deposits FOR SELECT
  TO authenticated USING (auth.uid() = uid);

DROP POLICY IF EXISTS "insert_own_deposits" ON public.deposits;
CREATE POLICY "insert_own_deposits" ON public.deposits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uid);

-- ============================================================
-- CARD_SALES — add uid, authenticated read
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='card_sales' AND column_name='uid') THEN
    ALTER TABLE public.card_sales ADD COLUMN uid uuid;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_card_sales" ON public.card_sales;
DROP POLICY IF EXISTS "anon_insert_card_sales" ON public.card_sales;
DROP POLICY IF EXISTS "anon_update_card_sales" ON public.card_sales;
DROP POLICY IF EXISTS "anon_delete_card_sales" ON public.card_sales;

DROP POLICY IF EXISTS "select_own_card_sales" ON public.card_sales;
CREATE POLICY "select_own_card_sales" ON public.card_sales FOR SELECT
  TO authenticated USING (auth.uid() = uid);

-- ============================================================
-- NOTIFICATIONS — add uid, authenticated read+update
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='uid') THEN
    ALTER TABLE public.notifications ADD COLUMN uid uuid;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_notifications" ON public.notifications;
DROP POLICY IF EXISTS "anon_insert_notifications" ON public.notifications;
DROP POLICY IF EXISTS "anon_update_notifications" ON public.notifications;
DROP POLICY IF EXISTS "anon_delete_notifications" ON public.notifications;

DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;
CREATE POLICY "select_own_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() = uid);

DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
CREATE POLICY "update_own_notifications" ON public.notifications FOR UPDATE
  TO authenticated USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);

-- ============================================================
-- REWARDS — add uid, authenticated read
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rewards' AND column_name='uid') THEN
    ALTER TABLE public.rewards ADD COLUMN uid uuid;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_rewards" ON public.rewards;
DROP POLICY IF EXISTS "anon_insert_rewards" ON public.rewards;
DROP POLICY IF EXISTS "anon_update_rewards" ON public.rewards;
DROP POLICY IF EXISTS "anon_delete_rewards" ON public.rewards;

DROP POLICY IF EXISTS "select_own_rewards" ON public.rewards;
CREATE POLICY "select_own_rewards" ON public.rewards FOR SELECT
  TO authenticated USING (auth.uid() = uid);

-- ============================================================
-- PRODUCTS — public read, admin management
-- ============================================================
DROP POLICY IF EXISTS "anon_select_products" ON public.products;
DROP POLICY IF EXISTS "anon_insert_products" ON public.products;
DROP POLICY IF EXISTS "anon_update_products" ON public.products;
DROP POLICY IF EXISTS "anon_delete_products" ON public.products;

DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products" ON public.products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products" ON public.products FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- CATEGORIES — public read, admin management
-- ============================================================
DROP POLICY IF EXISTS "anon_select_categories" ON public.categories;
DROP POLICY IF EXISTS "anon_insert_categories" ON public.categories;
DROP POLICY IF EXISTS "anon_update_categories" ON public.categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON public.categories;

DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;
CREATE POLICY "admin_manage_categories" ON public.categories FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- DEPOSIT_ACCOUNTS — public read, admin management
-- ============================================================
DROP POLICY IF EXISTS "anon_select_deposit_accounts" ON public.deposit_accounts;
DROP POLICY IF EXISTS "anon_insert_deposit_accounts" ON public.deposit_accounts;
DROP POLICY IF EXISTS "anon_update_deposit_accounts" ON public.deposit_accounts;
DROP POLICY IF EXISTS "anon_delete_deposit_accounts" ON public.deposit_accounts;

DROP POLICY IF EXISTS "public_read_deposit_accounts" ON public.deposit_accounts;
CREATE POLICY "public_read_deposit_accounts" ON public.deposit_accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_deposit_accounts" ON public.deposit_accounts;
CREATE POLICY "admin_manage_deposit_accounts" ON public.deposit_accounts FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- CARD_INVENTORY — admin only
-- ============================================================
DROP POLICY IF EXISTS "anon_select_card_inventory" ON public.card_inventory;
DROP POLICY IF EXISTS "anon_insert_card_inventory" ON public.card_inventory;
DROP POLICY IF EXISTS "anon_update_card_inventory" ON public.card_inventory;
DROP POLICY IF EXISTS "anon_delete_card_inventory" ON public.card_inventory;

DROP POLICY IF EXISTS "admin_manage_card_inventory" ON public.card_inventory;
CREATE POLICY "admin_manage_card_inventory" ON public.card_inventory FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- ORDERS — add uid, authenticated own orders
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='uid') THEN
    ALTER TABLE public.orders ADD COLUMN uid uuid;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_update_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON public.orders;

DROP POLICY IF EXISTS "select_own_orders" ON public.orders;
CREATE POLICY "select_own_orders" ON public.orders FOR SELECT
  TO authenticated USING (auth.uid() = uid);

DROP POLICY IF EXISTS "insert_own_orders" ON public.orders;
CREATE POLICY "insert_own_orders" ON public.orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uid);

-- ============================================================
-- STORAGE — deposit receipts require auth
-- ============================================================
DROP POLICY IF EXISTS "Users can upload deposit receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view deposit receipts" ON storage.objects;

DROP POLICY IF EXISTS "auth_upload_deposit_receipts" ON storage.objects;
CREATE POLICY "auth_upload_deposit_receipts" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'deposit-receipts');

DROP POLICY IF EXISTS "auth_view_deposit_receipts" ON storage.objects;
CREATE POLICY "auth_view_deposit_receipts" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'deposit-receipts');
