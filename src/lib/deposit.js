import { supabase } from './supabase'
import { getUserId } from './wallet'

// Fetch active deposit accounts (bank/agent targets)
export async function getDepositAccounts() {
  const { data, error } = await supabase
    .from('deposit_accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// Upload receipt to deposit-receipts bucket
export async function uploadReceipt(file, userId) {
  const uid = userId || getUserId()
  const ext = file.name.split('.').pop()
  const path = `${uid}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('deposit-receipts')
    .upload(path, file, { contentType: file.type })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('deposit-receipts')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

// Submit a deposit request
export async function createDepositRequest({ accountId, amount, senderName, transferNumber, receiptUrl }) {
  const userId = getUserId()
  const { data, error } = await supabase
    .from('deposits')
    .insert({
      user_id: userId,
      account_id: accountId,
      amount,
      sender_name: senderName,
      transfer_number: transferNumber,
      proof_url: receiptUrl,
      status: 'pending',
    })
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// Fetch user's deposit requests
export async function getDepositRequests() {
  const userId = getUserId()
  const { data, error } = await supabase
    .from('deposits')
    .select(`
      *,
      account:deposit_accounts(id, account_name, account_number, bank_name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Admin: fetch pending deposits
export async function getPendingDeposits() {
  const { data, error } = await supabase
    .from('deposits')
    .select(`
      *,
      account:deposit_accounts(id, account_name, account_number, bank_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Admin: approve or reject a deposit via RPC
export async function processDeposit(requestId, status, notes = null) {
  const userId = getUserId()
  const { data, error } = await supabase.rpc('process_deposit_request', {
    p_request_id: requestId,
    p_status: status,
    p_notes: notes,
    p_user_id: userId,
  })

  if (error) throw error
  return data
}
