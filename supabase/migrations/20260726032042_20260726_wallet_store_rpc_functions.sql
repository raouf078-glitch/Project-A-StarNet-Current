/*
# Financial RPC Functions Migration

## Purpose
Implements the atomic financial operations extracted from Safa Wallet Store,
adapted to StarNET's no-auth (anonymous device ID) architecture.

## Functions
1. `purchase_card_v2(p_card_id, p_user_id)` — Atomic card purchase using wallet balance.
   Validates card, locks inventory (FOR UPDATE SKIP LOCKED), deducts balance,
   awards gems, marks inventory used, records sale, logs transactions, notifies.
2. `purchase_card_with_gems(p_card_id, p_user_id)` — Atomic card purchase using gems points.
   Same flow but deducts gems_balance instead of wallet balance.
3. `process_deposit_request(p_request_id, p_status, p_notes)` — Approve/reject deposit.
   On approve: credits wallet balance, logs transaction, notifies.
   On reject: notifies with reason. Updates deposit status.
4. `exchange_gems_for_balance(p_gems_amount, p_exchange_rate, p_user_id)` — Convert gems to wallet cash.
   Deducts gems, credits balance, logs both gem and wallet transactions.

## Security
All functions use SECURITY DEFINER to bypass RLS for atomic operations.
StarNET adaptation: functions accept p_user_id (text) parameter instead of auth.uid(),
since StarNET uses anonymous device IDs rather than Supabase Auth.

## Important Notes
1. `wallets.points` maps to Safa's `gems_balance` (loyalty/reward points).
2. `products` table is used instead of `store_cards` (StarNET's existing product table).
3. All operations execute inside a single database transaction with row-level locking.
4. Notifications are generated inside the same transaction for consistency.
*/

-- ============================================================
-- PURCHASE_CARD_V2 — Wallet Balance Purchase
-- ============================================================
CREATE OR REPLACE FUNCTION public.purchase_card_v2(p_card_id uuid, p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card products%ROWTYPE;
  v_inventory card_inventory%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_sale_id uuid;
BEGIN
  -- 1. Fetch & Lock Card
  SELECT * INTO v_card FROM products WHERE id = p_card_id AND availability = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found or inactive';
  END IF;

  -- 2. Fetch & Lock User Wallet
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_wallet.balance < v_card.price THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- 3. Select & Lock Unused Inventory Item
  SELECT * INTO v_inventory
  FROM card_inventory
  WHERE card_id = p_card_id AND is_used = false
  LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;

  -- 4. Deduct Balance and Add Gems Reward
  UPDATE wallets
  SET balance = balance - v_card.price,
      points = points + COALESCE(v_card.gems_reward, 0),
      updated_at = now()
  WHERE id = v_wallet.id;

  -- 5. Mark Inventory Code as Used
  UPDATE card_inventory
  SET is_used = true, used_at = now(), used_by = p_user_id
  WHERE id = v_inventory.id;

  -- 6. Record Sale Entry
  INSERT INTO card_sales (
    user_id, card_id, inventory_id, price_paid, payment_method,
    gems_used, gems_earned, card_code, card_pin
  ) VALUES (
    p_user_id, p_card_id, v_inventory.id, v_card.price, 'wallet',
    0, COALESCE(v_card.gems_reward, 0), v_inventory.code, v_inventory.pin
  ) RETURNING id INTO v_sale_id;

  -- 7. Log Wallet Ledger
  INSERT INTO wallet_transactions (type, title, amount, status, category, reference_id)
  VALUES ('purchase', 'Purchased ' || v_card.title, -v_card.price, 'completed', 'wallet', v_sale_id);

  -- 8. Log Gems Ledger if Earned
  IF COALESCE(v_card.gems_reward, 0) > 0 THEN
    INSERT INTO rewards (points, description, type)
    VALUES (v_card.gems_reward, 'Reward for buying ' || v_card.title, 'earned');
  END IF;

  -- 9. Generate Notification
  INSERT INTO notifications (title, body, type)
  VALUES ('Purchase Successful', 'You purchased ' || v_card.title, 'purchase');

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
CREATE OR REPLACE FUNCTION public.purchase_card_with_gems(p_card_id uuid, p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card products%ROWTYPE;
  v_inventory card_inventory%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_sale_id uuid;
BEGIN
  -- 1. Fetch & Lock Card
  SELECT * INTO v_card FROM products WHERE id = p_card_id AND availability = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found or inactive';
  END IF;

  IF v_card.gems_price IS NULL OR v_card.gems_price <= 0 THEN
    RAISE EXCEPTION 'Card cannot be purchased with gems';
  END IF;

  -- 2. Fetch & Lock User Wallet
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_wallet.points < v_card.gems_price THEN
    RAISE EXCEPTION 'Insufficient gems balance';
  END IF;

  -- 3. Select & Lock Unused Inventory Item
  SELECT * INTO v_inventory
  FROM card_inventory
  WHERE card_id = p_card_id AND is_used = false
  LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;

  -- 4. Deduct Gems
  UPDATE wallets
  SET points = points - v_card.gems_price,
      updated_at = now()
  WHERE id = v_wallet.id;

  -- 5. Mark Inventory Used
  UPDATE card_inventory
  SET is_used = true, used_at = now(), used_by = p_user_id
  WHERE id = v_inventory.id;

  -- 6. Record Sale
  INSERT INTO card_sales (
    user_id, card_id, inventory_id, price_paid, payment_method,
    gems_used, gems_earned, card_code, card_pin
  ) VALUES (
    p_user_id, p_card_id, v_inventory.id, 0.00, 'gems',
    v_card.gems_price, 0, v_inventory.code, v_inventory.pin
  ) RETURNING id INTO v_sale_id;

  -- 7. Log Gems Transaction
  INSERT INTO rewards (points, description, type)
  VALUES (-v_card.gems_price, 'Purchased ' || v_card.title || ' with gems', 'spent');

  -- 8. Log Wallet Ledger
  INSERT INTO wallet_transactions (type, title, amount, status, category, reference_id)
  VALUES ('purchase', 'Purchased ' || v_card.title || ' (gems)', 0, 'completed', 'points', v_sale_id);

  -- 9. Notification
  INSERT INTO notifications (title, body, type)
  VALUES ('Purchase Successful', 'You purchased ' || v_card.title || ' using gems', 'purchase');

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
  p_notes text DEFAULT NULL,
  p_user_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deposit deposits%ROWTYPE;
  v_wallet wallets%ROWTYPE;
BEGIN
  -- 1. Fetch & Lock Deposit Request
  SELECT * INTO v_deposit FROM deposits WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit request not found';
  END IF;

  IF v_deposit.status != 'pending' THEN
    RAISE EXCEPTION 'Deposit request already processed';
  END IF;

  IF p_status = 'approved' THEN
    -- 2a. Find or create user wallet
    SELECT * INTO v_wallet FROM wallets WHERE user_id = v_deposit.user_id FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO wallets (user_id, balance, points, tier)
      VALUES (v_deposit.user_id, v_deposit.amount, 0, 'bronze')
      RETURNING * INTO v_wallet;
    ELSE
      UPDATE wallets
      SET balance = balance + v_deposit.amount,
          updated_at = now()
      WHERE id = v_wallet.id;
    END IF;

    -- 3a. Record Ledger
    INSERT INTO wallet_transactions (type, title, amount, status, category, reference_id)
    VALUES ('deposit', 'Deposit approved', v_deposit.amount, 'completed', 'wallet', p_request_id);

    -- 4a. Send Approval Notification
    INSERT INTO notifications (title, body, type)
    VALUES ('Deposit Approved', 'Your deposit of ' || v_deposit.amount || ' has been approved.', 'deposit');
  ELSE
    -- 2b. Send Rejection Notification
    INSERT INTO notifications (title, body, type)
    VALUES ('Deposit Rejected', 'Your deposit request was rejected. Reason: ' || COALESCE(p_notes, 'None'), 'deposit');
  END IF;

  -- 5. Update Request Status
  UPDATE deposits
  SET status = p_status,
      notes = p_notes,
      processed_by = p_user_id,
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
  p_exchange_rate numeric,
  p_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_cash_value numeric;
BEGIN
  IF p_gems_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid gems amount';
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
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

  INSERT INTO rewards (points, description, type)
  VALUES (-p_gems_amount, 'Exchanged gems for wallet cash', 'spent');

  INSERT INTO wallet_transactions (type, title, amount, status, category)
  VALUES ('deposit', 'Exchanged ' || p_gems_amount || ' gems', v_cash_value, 'completed', 'points');

  RETURN jsonb_build_object('success', true, 'credited_amount', v_cash_value);
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.purchase_card_v2(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_card_with_gems(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_deposit_request(uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exchange_gems_for_balance(integer, numeric, text) TO anon, authenticated;
