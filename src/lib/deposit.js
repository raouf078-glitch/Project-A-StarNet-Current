import { supabase } from './supabase'
import { getAuthUid } from './wallet'

export async function getDepositAccounts() {
  const { data, error } = await supabase
    .from('deposit_accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function uploadReceipt(file) {
  const uid = await getAuthUid()
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

export async function createDepositRequest({ accountId, amount, senderName, transferNumber, receiptUrl }) {
  const uid = await getAuthUid()
  const { data, error } = await supabase
    .from('deposits')
    .insert({
      uid,
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

export async function getDepositRequests() {
  const uid = await getAuthUid()
  const { data, error } = await supabase
    .from('deposits')
    .select(`
      *,
      account:deposit_accounts(id, account_name, account_number, bank_name)
    `)
    .eq('uid', uid)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

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

export async function processDeposit(requestId, status, notes = null) {
  const { data, error } = await supabase.rpc('process_deposit_request', {
    p_request_id: requestId,
    p_status: status,
    p_notes: notes,
  })

  if (error) throw error
  return data
}
