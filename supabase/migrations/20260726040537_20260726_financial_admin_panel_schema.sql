/*
# Financial Admin Panel — Schema & RPC Migration

Adds role-based admin access, admin_adjust_balance RPC, broadcast_notification RPC,
and tightens card_inventory RLS so PINs are only exposed via purchase RPC output.
*/

-- ============================================================
-- PROFILES — add role column for Safa-style authorization
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role text NOT NULL DEFAULT 'customer';
  END IF;
END $$;

UPDATE public.profiles SET role = 'admin' WHERE is_admin = true AND role = 'customer';

-- ============================================================
-- ADMIN_ADJUST_BALANCE — atomic wallet adjustment + ledger + notification
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_user_id uuid,
  p_amount numeric,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_wallet wallets%ROWTYPE;
  v_new_balance numeric;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin AND role IN ('admin', 'manager')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'Amount must be non-zero';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE uid = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO wallets (uid, balance, points, tier)
    VALUES (p_user_id, p_amount, 0, 'bronze')
    RETURNING * INTO v_wallet;
    v_new_balance := p_amount;
  ELSE
    v_new_balance := v_wallet.balance + p_amount;
    UPDATE wallets SET balance = v_new_balance, updated_at = now() WHERE id = v_wallet.id;
  END IF;

  INSERT INTO wallet_transactions (uid, type, title, amount, status, category, metadata)
  VALUES (
    p_user_id, 'admin_adjustment', p_reason, p_amount, 'completed', 'wallet',
    jsonb_build_object('admin_id', v_admin, 'admin_adjustment', true)
  );

  INSERT INTO notifications (uid, title, body, type)
  VALUES (
    p_user_id,
    CASE WHEN p_amount > 0 THEN 'تم إضافة رصيد' ELSE 'تم خصم رصيد' END,
    'تم تعديل رصيدك بمقدار ' || abs(p_amount) || ' — السبب: ' || p_reason,
    'wallet'
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, numeric, text) TO authenticated;

-- ============================================================
-- BROADCAST_NOTIFICATION — admin sends to all users
-- ============================================================
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  p_title text,
  p_body text,
  p_type text DEFAULT 'announcement'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin AND role IN ('admin', 'manager')) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  INSERT INTO notifications (uid, title, body, type)
  SELECT id, p_title, p_body, p_type FROM public.profiles;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'recipients', v_count);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.broadcast_notification(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.broadcast_notification(text, text, text) TO authenticated;

-- ============================================================
-- RLS — admin policies check role IN ('admin','manager')
-- ============================================================

DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products" ON public.products FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;
CREATE POLICY "admin_manage_categories" ON public.categories FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

DROP POLICY IF EXISTS "admin_manage_deposit_accounts" ON public.deposit_accounts;
CREATE POLICY "admin_manage_deposit_accounts" ON public.deposit_accounts FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

DROP POLICY IF EXISTS "admin_manage_card_inventory" ON public.card_inventory;
CREATE POLICY "admin_manage_card_inventory" ON public.card_inventory FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Deposits — admin can read ALL deposits and update any deposit
DROP POLICY IF EXISTS "admin_read_all_deposits" ON public.deposits;
CREATE POLICY "admin_read_all_deposits" ON public.deposits FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "admin_update_deposits" ON public.deposits;
CREATE POLICY "admin_update_deposits" ON public.deposits FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Notifications — admin can read all
DROP POLICY IF EXISTS "admin_read_all_notifications" ON public.notifications;
CREATE POLICY "admin_read_all_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Wallets — admin can read all
DROP POLICY IF EXISTS "admin_read_all_wallets" ON public.wallets;
CREATE POLICY "admin_read_all_wallets" ON public.wallets FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Wallet transactions — admin can read all (audit)
DROP POLICY IF EXISTS "admin_read_all_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "admin_read_all_wallet_transactions" ON public.wallet_transactions FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Profiles — admin can read all profiles
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_read_all_profiles" ON public.profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Card sales — admin can read all sales (audit)
DROP POLICY IF EXISTS "admin_read_all_card_sales" ON public.card_sales;
CREATE POLICY "admin_read_all_card_sales" ON public.card_sales FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
