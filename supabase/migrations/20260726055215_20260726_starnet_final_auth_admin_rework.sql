/*
# StarNET Final Implementation — Auth + Admin Rework

1. registration_requests table (pending/approved/rejected)
2. approve_registration RPC (atomic: create auth user + profile + wallet + rewards + notification)
3. Admin RPCs now check email = 'raouf078@gmail.com' (single owner, no roles)
4. Drop on_auth_user_created trigger (no auto-profile on signup)
5. RLS updated to check email for admin access
*/

-- ============================================================
-- 1. REGISTRATION_REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  password_hash text NOT NULL,
  device_info text,
  ip_address text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Only the owner can read registration requests
DROP POLICY IF EXISTS "owner_read_registration_requests" ON public.registration_requests;
CREATE POLICY "owner_read_registration_requests" ON public.registration_requests FOR SELECT
  TO authenticated USING (
    coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );

DROP POLICY IF EXISTS "owner_update_registration_requests" ON public.registration_requests;
CREATE POLICY "owner_update_registration_requests" ON public.registration_requests FOR UPDATE
  TO authenticated USING (
    coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  )
  WITH CHECK (
    coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );

-- Anyone can submit a registration request (anon + authenticated)
DROP POLICY IF EXISTS "anon_insert_registration_requests" ON public.registration_requests;
CREATE POLICY "anon_insert_registration_requests" ON public.registration_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ============================================================
-- 2. DROP on_auth_user_created trigger
--    (so new signups don't auto-create profiles)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================
-- 3. APPROVE_REGISTRATION RPC
--    Atomic: creates auth user, profile, wallet, rewards, notification
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_registration(
  p_request_id uuid,
  p_action text,
  p_rejection_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_owner text := coalesce(auth.jwt() ->> 'email', '');
  v_request registration_requests%ROWTYPE;
  v_new_user_id uuid;
  v_temp_token text;
BEGIN
  -- Only the owner can approve/reject
  IF v_owner <> 'raouf078@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action: must be approved or rejected';
  END IF;

  SELECT * INTO v_request FROM registration_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration request not found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  IF p_action = 'rejected' THEN
    UPDATE registration_requests
    SET status = 'rejected',
        rejection_reason = p_rejection_reason,
        reviewed_by = v_owner,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'action', 'rejected');
  END IF;

  -- === APPROVED: atomic creation of all entities ===

  -- Generate a synthetic email from phone for auth.users
  v_email := 'user_' || replace(replace(v_request.phone, '+', ''), ' ', '') || '@starnet.local';

  -- Check if auth user already exists with this email
  SELECT id INTO v_new_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_new_user_id IS NULL THEN
    -- Create auth user with the stored password hash
    v_temp_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      confirmation_token, confirmation_sent_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_email,
      v_request.password_hash,
      now(),
      v_temp_token,
      now(),
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('full_name', v_request.full_name, 'phone', v_request.phone, 'source', 'registration_request')
    ) RETURNING id INTO v_new_user_id;
  END IF;

  -- Create profile (if not exists)
  INSERT INTO public.profiles (id, phone, full_name, role)
  VALUES (v_new_user_id, v_request.phone, v_request.full_name, 'customer')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

  -- Create wallet (if not exists)
  INSERT INTO public.wallets (uid, balance, points, tier)
  VALUES (v_new_user_id, 0, 0, 'bronze')
  ON CONFLICT (uid) DO NOTHING;

  -- Create rewards entry (if table has uid column)
  INSERT INTO public.rewards (uid, points, description, type)
  VALUES (v_new_user_id, 0, 'Welcome to StarNET', 'earned')
  ON CONFLICT DO NOTHING;

  -- Send welcome notification
  INSERT INTO public.notifications (uid, title, body, type)
  VALUES (
    v_new_user_id,
    'تم تفعيل حسابك بنجاح',
    'يمكنك الآن تسجيل الدخول واستخدام المحفظة والمتجر.',
    'system'
  );

  -- Update request status
  UPDATE registration_requests
  SET status = 'approved',
      reviewed_by = v_owner,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'action', 'approved', 'user_id', v_new_user_id, 'email', v_email);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_registration(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_registration(uuid, text, text) TO authenticated;

-- ============================================================
-- 4. UPDATE ADMIN RPCs to check email instead of profiles.role
-- ============================================================

-- admin_adjust_balance
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
  v_owner text := coalesce(auth.jwt() ->> 'email', '');
  v_wallet wallets%ROWTYPE;
  v_new_balance numeric;
BEGIN
  IF v_owner <> 'raouf078@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
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
    jsonb_build_object('admin_email', v_owner, 'admin_adjustment', true)
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

-- broadcast_notification
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
  v_owner text := coalesce(auth.jwt() ->> 'email', '');
  v_count integer;
BEGIN
  IF v_owner <> 'raouf078@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  INSERT INTO notifications (uid, title, body, type)
  SELECT id, p_title, p_body, p_type FROM public.profiles;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'recipients', v_count);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.broadcast_notification(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.broadcast_notification(text, text, text) TO authenticated;

-- process_deposit_request
CREATE OR REPLACE FUNCTION public.process_deposit_request(
  p_request_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner text := coalesce(auth.jwt() ->> 'email', '');
  v_deposit deposits%ROWTYPE;
  v_wallet wallets%ROWTYPE;
BEGIN
  IF v_owner <> 'raouf078@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT * INTO v_deposit FROM deposits WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit request not found';
  END IF;

  IF v_deposit.status != 'pending' THEN
    RAISE EXCEPTION 'Deposit request already processed';
  END IF;

  IF p_status = 'approved' THEN
    SELECT * INTO v_wallet FROM wallets WHERE uid = v_deposit.uid FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO wallets (uid, balance, points, tier)
      VALUES (v_deposit.uid, v_deposit.amount, 0, 'bronze')
      RETURNING * INTO v_wallet;
    ELSE
      UPDATE wallets
      SET balance = balance + v_deposit.amount,
      updated_at = now()
      WHERE id = v_wallet.id;
    END IF;

    INSERT INTO wallet_transactions (uid, type, title, amount, status, category, reference_id)
    VALUES (v_deposit.uid, 'deposit', 'Deposit approved', v_deposit.amount, 'completed', 'wallet', p_request_id);

    INSERT INTO notifications (uid, title, body, type)
    VALUES (v_deposit.uid, 'تم اعتماد الإيداع', 'تم اعتماد إيداعك بمبلغ ' || v_deposit.amount, 'deposit');
  ELSE
    INSERT INTO notifications (uid, title, body, type)
    VALUES (v_deposit.uid, 'تم رفض الإيداع', 'تم رفض طلب الإيداع. ' || coalesce(p_notes, ''), 'deposit');
  END IF;

  UPDATE deposits
  SET status = p_status,
      notes = p_notes,
      processed_by = v_owner,
      processed_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_deposit_request(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_deposit_request(uuid, text, text) TO authenticated;

-- ============================================================
-- 5. UPDATE RLS POLICIES to check email for admin access
-- ============================================================

-- Products
DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products" ON public.products FOR ALL
  TO authenticated USING (coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com')
  WITH CHECK (coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com');

-- Categories
DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;
CREATE POLICY "admin_manage_categories" ON public.categories FOR ALL
  TO authenticated USING (coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com')
  WITH CHECK (coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com');

-- Deposit accounts
DROP POLICY IF EXISTS "admin_manage_deposit_accounts" ON public.deposit_accounts;
CREATE POLICY "admin_manage_deposit_accounts" ON public.deposit_accounts FOR ALL
  TO authenticated USING (coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com')
  WITH CHECK (coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com');

-- Card inventory
DROP POLICY IF EXISTS "admin_manage_card_inventory" ON public.card_inventory;
CREATE POLICY "admin_manage_card_inventory" ON public.card_inventory FOR ALL
  TO authenticated USING (coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com')
  WITH CHECK (coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com');

-- Deposits — admin can read all and update any
DROP POLICY IF EXISTS "admin_read_all_deposits" ON public.deposits;
CREATE POLICY "admin_read_all_deposits" ON public.deposits FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );

DROP POLICY IF EXISTS "admin_update_deposits" ON public.deposits;
CREATE POLICY "admin_update_deposits" ON public.deposits FOR UPDATE
  TO authenticated USING (
    coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  )
  WITH CHECK (
    coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );

-- Notifications — admin can read all
DROP POLICY IF EXISTS "admin_read_all_notifications" ON public.notifications;
CREATE POLICY "admin_read_all_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );

-- Wallets — admin can read all
DROP POLICY IF EXISTS "admin_read_all_wallets" ON public.wallets;
CREATE POLICY "admin_read_all_wallets" ON public.wallets FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );

-- Wallet transactions — admin can read all
DROP POLICY IF EXISTS "admin_read_all_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "admin_read_all_wallet_transactions" ON public.wallet_transactions FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );

-- Profiles — admin can read all
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_read_all_profiles" ON public.profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );

-- Card sales — admin can read all
DROP POLICY IF EXISTS "admin_read_all_card_sales" ON public.card_sales;
CREATE POLICY "admin_read_all_card_sales" ON public.card_sales FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );

-- Rewards — admin can read all
DROP POLICY IF EXISTS "admin_read_all_rewards" ON public.rewards;
CREATE POLICY "admin_read_all_rewards" ON public.rewards FOR SELECT
  TO authenticated USING (
    auth.uid() = uid
    OR coalesce(auth.jwt() ->> 'email', '') = 'raouf078@gmail.com'
  );
