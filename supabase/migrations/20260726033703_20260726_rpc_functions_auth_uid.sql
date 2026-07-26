/*
# RPC Functions — Switch to auth.uid()

All financial RPC functions now use auth.uid() internally instead of accepting
a p_user_id text parameter. This enforces server-side authentication validation.

Functions updated:
- purchase_card_v2(p_card_id uuid)
- purchase_card_with_gems(p_card_id uuid)
- process_deposit_request(p_request_id uuid, p_status text, p_notes text)
- exchange_gems_for_balance(p_gems_amount integer, p_exchange_rate numeric)

All functions now set the `uid` column (uuid, references auth.users) on inserted rows.
*/

-- ============================================================
-- PURCHASE_CARD_V2 — Wallet Balance Purchase
-- ============================================================
CREATE OR REPLACE FUNCTION public.purchase_card_v2(p_card_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_card products%ROWTYPE;
  v_inventory card_inventory%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_sale_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_card FROM products WHERE id = p_card_id AND availability = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found or inactive';
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE uid = v_user FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO wallets (uid, balance, points, tier)
    VALUES (v_user, 0, 0, 'bronze')
    RETURNING * INTO v_wallet;
  END IF;

  IF v_wallet.balance < v_card.price THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  SELECT * INTO v_inventory
  FROM card_inventory
  WHERE card_id = p_card_id AND is_used = false
  LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;

  UPDATE wallets
  SET balance = balance - v_card.price,
      points = points + COALESCE(v_card.gems_reward, 0),
      updated_at = now()
  WHERE id = v_wallet.id;

  UPDATE card_inventory
  SET is_used = true, used_at = now(), used_by = v_user::text
  WHERE id = v_inventory.id;

  INSERT INTO card_sales (
    uid, user_id, card_id, inventory_id, price_paid, payment_method,
    gems_used, gems_earned, card_code, card_pin
  ) VALUES (
    v_user, v_user::text, p_card_id, v_inventory.id, v_card.price, 'wallet',
    0, COALESCE(v_card.gems_reward, 0), v_inventory.code, v_inventory.pin
  ) RETURNING id INTO v_sale_id;

  INSERT INTO wallet_transactions (uid, type, title, amount, status, category, reference_id)
  VALUES (v_user, 'purchase', 'Purchased ' || v_card.title, -v_card.price, 'completed', 'wallet', v_sale_id);

  IF COALESCE(v_card.gems_reward, 0) > 0 THEN
    INSERT INTO rewards (uid, points, description, type)
    VALUES (v_user, v_card.gems_reward, 'Reward for buying ' || v_card.title, 'earned');
  END IF;

  INSERT INTO notifications (uid, title, body, type)
  VALUES (v_user, 'Purchase Successful', 'You purchased ' || v_card.title, 'purchase');

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'code', v_inventory.code,
    'pin', v_inventory.pin
  );
END;
$$;

-- ============================================================
-- PURCHASE_CARD_WITH_GEMS — Gems Points Purchase
-- ============================================================
CREATE OR REPLACE FUNCTION public.purchase_card_with_gems(p_card_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_card products%ROWTYPE;
  v_inventory card_inventory%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_sale_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_card FROM products WHERE id = p_card_id AND availability = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found or inactive';
  END IF;

  IF v_card.gems_price IS NULL OR v_card.gems_price <= 0 THEN
    RAISE EXCEPTION 'Card cannot be purchased with gems';
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE uid = v_user FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO wallets (uid, balance, points, tier)
    VALUES (v_user, 0, 0, 'bronze')
    RETURNING * INTO v_wallet;
  END IF;

  IF v_wallet.points < v_card.gems_price THEN
    RAISE EXCEPTION 'Insufficient gems balance';
  END IF;

  SELECT * INTO v_inventory
  FROM card_inventory
  WHERE card_id = p_card_id AND is_used = false
  LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;

  UPDATE wallets
  SET points = points - v_card.gems_price,
      updated_at = now()
  WHERE id = v_wallet.id;

  UPDATE card_inventory
  SET is_used = true, used_at = now(), used_by = v_user::text
  WHERE id = v_inventory.id;

  INSERT INTO card_sales (
    uid, user_id, card_id, inventory_id, price_paid, payment_method,
    gems_used, gems_earned, card_code, card_pin
  ) VALUES (
    v_user, v_user::text, p_card_id, v_inventory.id, 0.00, 'gems',
    v_card.gems_price, 0, v_inventory.code, v_inventory.pin
  ) RETURNING id INTO v_sale_id;

  INSERT INTO rewards (uid, points, description, type)
  VALUES (v_user, -v_card.gems_price, 'Purchased ' || v_card.title || ' with gems', 'spent');

  INSERT INTO wallet_transactions (uid, type, title, amount, status, category, reference_id)
  VALUES (v_user, 'purchase', 'Purchased ' || v_card.title || ' (gems)', 0, 'completed', 'points', v_sale_id);

  INSERT INTO notifications (uid, title, body, type)
  VALUES (v_user, 'Purchase Successful', 'You purchased ' || v_card.title || ' using gems', 'purchase');

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'code', v_inventory.code,
    'pin', v_inventory.pin
  );
END;
$$;

-- ============================================================
-- PROCESS_DEPOSIT_REQUEST — Approve/Reject Deposit
-- ============================================================
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
  v_admin uuid := auth.uid();
  v_deposit deposits%ROWTYPE;
  v_wallet wallets%ROWTYPE;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
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
    VALUES (v_deposit.uid, 'Deposit Approved', 'Your deposit of ' || v_deposit.amount || ' has been approved.', 'deposit');
  ELSE
    INSERT INTO notifications (uid, title, body, type)
    VALUES (v_deposit.uid, 'Deposit Rejected', 'Your deposit request was rejected. Reason: ' || COALESCE(p_notes, 'None'), 'deposit');
  END IF;

  UPDATE deposits
  SET status = p_status,
      notes = p_notes,
      processed_by = v_admin::text,
      processed_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- EXCHANGE_GEMS_FOR_BALANCE — Convert Gems to Wallet Cash
-- ============================================================
CREATE OR REPLACE FUNCTION public.exchange_gems_for_balance(
  p_gems_amount integer,
  p_exchange_rate numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_wallet wallets%ROWTYPE;
  v_cash_value numeric;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_gems_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid gems amount';
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE uid = v_user FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO wallets (uid, balance, points, tier)
    VALUES (v_user, 0, 0, 'bronze')
    RETURNING * INTO v_wallet;
  END IF;

  IF v_wallet.points < p_gems_amount THEN
    RAISE EXCEPTION 'Insufficient gems';
  END IF;

  v_cash_value := p_gems_amount * p_exchange_rate;

  UPDATE wallets
  SET points = points - p_gems_amount,
      balance = balance + v_cash_value,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO rewards (uid, points, description, type)
  VALUES (v_user, -p_gems_amount, 'Exchanged gems for wallet cash', 'spent');

  INSERT INTO wallet_transactions (uid, type, title, amount, status, category)
  VALUES (v_user, 'deposit', 'Exchanged ' || p_gems_amount || ' gems', v_cash_value, 'completed', 'points');

  RETURN jsonb_build_object('success', true, 'credited_amount', v_cash_value);
END;
$$;

-- Grant execute to authenticated only
REVOKE EXECUTE ON FUNCTION public.purchase_card_v2(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_card_with_gems(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_deposit_request(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.exchange_gems_for_balance(integer, numeric) FROM anon;

GRANT EXECUTE ON FUNCTION public.purchase_card_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_card_with_gems(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_deposit_request(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exchange_gems_for_balance(integer, numeric) TO authenticated;
