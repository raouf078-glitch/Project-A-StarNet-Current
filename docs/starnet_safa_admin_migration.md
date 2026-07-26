# StarNET Wallet & Store - Admin Financial Administration Migration Guide

This document defines the exact migration of the financial administration features from the **Safa Wallet Store System** into the **StarNET** platform, maintaining StarNET's design language and strictly adhering to the original backend RPC logic and DB constraints.

---

## Table of Contents
1. [Overview & Scope](#1-overview--scope)
2. [Migrated Modules & Source Mapping](#2-migrated-modules--source-mapping)
3. [UI Design Language (StarNET Integration)](#3-ui-design-language-starnet-integration)
4. [Financial Admin Feature Specifications](#4-financial-admin-feature-specifications)
   - [A. Product & Category Management](#a-product--category-management)
   - [B. Card Inventory Management](#b-card-inventory-management)
   - [C. Deposit Approval Queue](#c-deposit-approval-queue)
   - [D. Wallet Balance Adjustments](#d-wallet-balance-adjustments)
   - [E. Notifications Management](#e-notifications-management)
5. [Database & RPC Interface Reference](#5-database--rpc-interface-reference)
6. [Implementation Steps](#6-implementation-steps)

---

## 1. Overview & Scope

The purpose of this migration is to integrate Safa's administrative core into StarNET without altering tested financial workflows.

### Included Features:
* **Product Management**: Managing categories (`categories`) and store cards (`store_cards`).
* **Card Inventory Management**: Importing, tracking, and auditing voucher PINs (`card_inventory`).
* **Deposit Approval Queue**: Approving/rejecting user top-ups via `process_deposit_request`.
* **Wallet Adjustments**: Direct manual adjustments to customer balances and transaction logging.
* **Notifications Engine**: Dispatching system and broadcast notifications (`notifications`).

---

## 2. Migrated Modules & Source Mapping

| Safa Source Component | StarNET Destination Component | Primary Action / Target |
| :--- | :--- | :--- |
| `src/screens/admin/AdminCategories.tsx` | `src/components/admin/AdminCategories.tsx` | Full CRUD on `categories` table |
| `src/screens/admin/AdminInventory.tsx` | `src/components/admin/AdminStoreCards.tsx` | Full CRUD on `store_cards` + image uploads |
| `src/screens/admin/AdminInventory.tsx` | `src/components/admin/AdminInventory.tsx` | Batch PIN import to `card_inventory` |
| `src/screens/admin/AdminDeposits.tsx` | `src/components/admin/AdminDeposits.tsx` | Execute `process_deposit_request` RPC |
| `src/screens/admin/AdminGemsAdjust.tsx` | `src/components/admin/AdminWalletAdjust.tsx` | Manual balance edits + `wallet_transactions` log |
| `src/screens/admin/MessageCenter.tsx` | `src/components/admin/AdminNotifications.tsx` | Insert into `notifications` |

---

## 3. UI Design Language (StarNET Integration)

All migrated administrative components must be wrapped in StarNET's existing aesthetic:
* **Dark Mode**: Soft dark background `#0F172A` / Slate cards `#1E293B`.
* **Accent Colors**: StarNET Cyan `#06B6D4` / Emerald `#10B981` for financial confirmations.
* **Typography & Icons**: Tailwind CSS layout with Lucide React icons (`Package`, `CreditCard`, `CheckCircle2`, `XCircle`, `Send`).

---

## 4. Financial Admin Feature Specifications

### A. Product & Category Management

#### Categories Manager (`AdminCategories.tsx`)
- **Queries**:
  ```sql
  SELECT * FROM categories ORDER BY display_order ASC;
  ```
- **Operations**: Insert, Update, Soft-Toggle (`is_active`).

#### Store Cards Manager (`AdminStoreCards.tsx`)
- **Queries**:
  ```sql
  SELECT sc.*, c.name as category_name, 
         (SELECT COUNT(*) FROM card_inventory ci WHERE ci.card_id = sc.id AND ci.is_used = false) as stock_count
  FROM store_cards sc
  LEFT JOIN categories c ON sc.category_id = c.id
  ORDER BY sc.display_order ASC;
  ```
- **Operations**:
  - Insert/Edit Card (Title, Price, Gems Reward, Category ID, Image URL).
  - Upload asset to Supabase Storage bucket `store-cards`.

---

### B. Card Inventory Management (`AdminInventory.tsx`)

- **Stock Audit Query**:
  ```sql
  SELECT ci.*, sc.title as card_title, p.full_name as used_by_name
  FROM card_inventory ci
  JOIN store_cards sc ON ci.card_id = sc.id
  LEFT JOIN profiles p ON ci.used_by = p.id
  ORDER BY ci.created_at DESC;
  ```

- **Batch PIN Importer**:
  - Accepts line-separated or CSV input: `CODE, PIN, SERIAL_NUMBER`.
  - Executes batch insert:
    ```sql
    INSERT INTO card_inventory (card_id, code, pin, serial_number)
    VALUES (:card_id, :code, :pin, :serial_number);
    ```

---

### C. Deposit Approval Queue (`AdminDeposits.tsx`)

Processes pending manual bank/agent top-ups using Safa's atomic RPC.

- **Pending Queue Query**:
  ```sql
  SELECT dr.*, p.full_name, p.phone_number, da.bank_name, da.account_name
  FROM deposit_requests dr
  JOIN profiles p ON dr.user_id = p.id
  JOIN deposit_accounts da ON dr.account_id = da.id
  WHERE dr.status = 'pending'
  ORDER BY dr.created_at ASC;
  ```

- **Execution Handler**:
  ```typescript
  const handleProcessDeposit = async (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    const { data, error } = await supabase.rpc('process_deposit_request', {
      p_request_id: requestId,
      p_status: status,
      p_notes: notes || null
    });
    if (error) throw error;
    // Refresh queue & trigger toast notification
  };
  ```

---

### D. Wallet Balance Adjustments (`AdminWalletAdjust.tsx`)

Allows admins to manually adjust user balances safely while logging the exact reason into the ledger.

- **Adjustment Handler**:
  ```typescript
  const handleWalletAdjustment = async (userId: string, amount: number, reason: string) => {
    // 1. Update user profile balance
    const { error: profileErr } = await supabase.rpc('admin_adjust_balance', {
      p_user_id: userId,
      p_amount: amount
    });
    
    // Fallback or explicit SQL update if RPC isn't available:
    // UPDATE profiles SET balance = balance + p_amount WHERE id = p_user_id;

    // 2. Insert audit log into wallet_transactions
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      amount: amount,
      type: 'admin_adjustment',
      description: `Admin adjustment: ${reason}`
    });

    // 3. Dispatch system alert notification
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Wallet Adjustment',
      message: `Your balance was adjusted by ${amount > 0 ? '+' : ''}${amount}. Reason: ${reason}`,
      type: 'system'
    });
  };
  ```

---

### E. Notifications Management (`AdminNotifications.tsx`)

Dispatches targeted alerts or system broadcast notifications.

- **Broadcast Handler**:
  ```typescript
  const sendBroadcastNotification = async (title: string, message: string, targetUserId?: string) => {
    if (targetUserId) {
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        title,
        message,
        type: 'system'
      });
    } else {
      // Broadcast to all active customer profiles
      const { data: users } = await supabase.from('profiles').select('id');
      if (users) {
        const payload = users.map(u => ({
          user_id: u.id,
          title,
          message,
          type: 'system' as const
        }));
        await supabase.from('notifications').insert(payload);
      }
    }
  };
  ```

---

## 5. Database & RPC Interface Reference

Ensure the backend contains the exact Safa Stored Procedures:

```sql
-- Safa Deposit Processing RPC
CREATE OR REPLACE FUNCTION process_deposit_request(
    p_request_id UUID,
    p_status deposit_status,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_deposit deposit_requests%ROWTYPE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role IN ('admin', 'manager')) THEN
        RAISE EXCEPTION 'Unauthorized action';
    END IF;

    SELECT * INTO v_deposit FROM deposit_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Deposit request not found'; END IF;
    IF v_deposit.status != 'pending' THEN RAISE EXCEPTION 'Deposit request already processed'; END IF;

    IF p_status = 'approved' THEN
        UPDATE profiles SET balance = balance + v_deposit.amount WHERE id = v_deposit.user_id;

        INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id)
        VALUES (v_deposit.user_id, v_deposit.amount, 'deposit', 'Deposit approved', p_request_id);

        INSERT INTO notifications (user_id, title, message, type)
        VALUES (v_deposit.user_id, 'Deposit Approved', 'Your deposit of ' || v_deposit.amount || ' has been approved.', 'deposit');
    ELSE
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (v_deposit.user_id, 'Deposit Rejected', 'Your deposit request was rejected. Reason: ' || COALESCE(p_notes, 'None'), 'deposit');
    END IF;

    UPDATE deposit_requests 
    SET status = p_status, notes = p_notes, processed_by = v_admin_id, processed_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
```

---

## 6. Implementation Steps

1. **Copy Database Schemas**: Ensure `categories`, `store_cards`, `card_inventory`, `deposit_requests`, `wallet_transactions`, and `notifications` exist in StarNET's PostgreSQL instance.
2. **Deploy Safa RPCs**: Install `process_deposit_request` and RLS admin policies on all administrative targets.
3. **Mount UI in StarNET Admin Routing**: Add the financial admin tabs into StarNET's sidebar navigation (`/admin/store`, `/admin/inventory`, `/admin/deposits`, `/admin/wallet-adjust`, `/admin/notifications`).
4. **Test Financial Transactions**: Verify deposit approvals immediately credit customer balances and reflect on StarNET's user screens via Supabase Realtime.
