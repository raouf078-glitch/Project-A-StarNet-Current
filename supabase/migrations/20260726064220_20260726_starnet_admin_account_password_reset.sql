/*
# StarNET Admin Account + Password Hashing Fix + Password Reset RPC

## Summary
1. Create ONE permanent administrator account (raouf078@gmail.com / admin123)
   - Uses bcrypt password hashing via pgcrypto's crypt() function
   - If the admin already exists, NEVER recreate or overwrite password
   - Links to profiles table with role='admin'
2. Fix approve_registration RPC to use crypt() for proper bcrypt password hashing
   - Previously stored plain text password as encrypted_password (broken)
   - Now uses crypt(password_hash, gen_salt('bf')) for proper bcrypt hash
3. New RPC: admin_reset_user_password
   - Admin can reset any customer's password
   - Uses bcrypt hashing, updates auth.users.encrypted_password
   - Does NOT touch wallet, rewards, deposits, or any financial data
4. No tables created, no tables modified, no RLS changes, no trigger changes

## Important Notes
- The admin account is created ONLY if it does not already exist
- The admin password is NEVER overwritten if the account exists
- Customer passwords in approve_registration are now properly bcrypt-hashed
- Password reset only modifies auth.users.encrypted_password — no financial data affected
*/

-- ============================================================
-- 1. CREATE PERMANENT ADMIN ACCOUNT (if not exists)
-- ============================================================
DO $$
DECLARE
  v_admin_id uuid;
  v_admin_email text := 'raouf078@gmail.com';
  v_admin_password text := 'admin123';
  v_hashed_password text;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email LIMIT 1;

  -- Only create if does NOT exist — never overwrite
  IF v_admin_id IS NULL THEN
    -- Generate bcrypt hash using pgcrypto
    v_hashed_password := crypt(v_admin_password, gen_salt('bf'));

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      confirmation_token, confirmation_sent_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_admin_email,
      v_hashed_password,
      now(),
      encode(gen_random_bytes(32), 'hex'),
      now(),
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('full_name', 'Raouf Admin', 'phone', '777175885', 'source', 'permanent_admin', 'role', 'admin')
    ) RETURNING id INTO v_admin_id;
  END IF;

  -- Create admin profile (if not exists), mark as admin
  INSERT INTO public.profiles (id, phone, full_name, role)
  VALUES (v_admin_id, '777175885', 'Raouf Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
END $$;

-- ============================================================
-- 2. FIX approve_registration RPC — proper bcrypt password hashing
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
  v_hashed_password text;
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
    -- Hash the password using bcrypt via pgcrypto
    v_hashed_password := crypt(v_request.password_hash, gen_salt('bf'));

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
      v_hashed_password,
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

  -- Create rewards entry (if not exists)
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
-- 3. NEW RPC: admin_reset_user_password
--    Admin can reset any customer's password securely
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  p_user_email text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_owner text := coalesce(auth.jwt() ->> 'email', '');
  v_hashed text;
  v_user_id uuid;
BEGIN
  -- Only the owner can reset passwords
  IF v_owner <> 'raouf078@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Validate password length
  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  -- Find the user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_user_email LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Prevent admin from resetting own password via this RPC (use Supabase auth for that)
  IF p_user_email = 'raouf078@gmail.com' THEN
    RAISE EXCEPTION 'Cannot reset admin password via this function';
  END IF;

  -- Hash new password with bcrypt
  v_hashed := crypt(p_new_password, gen_salt('bf'));

  -- Update only the password — no other fields touched
  UPDATE auth.users
  SET encrypted_password = v_hashed,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'user_email', p_user_email);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_reset_user_password(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(text, text) TO authenticated;
