import { supabase } from './supabase'
import { getAnonymousId } from './user'

const POINTS_PER_RIYAL = 10

export function getUserId() {
  return getAnonymousId()
}

export async function getOrCreateWallet() {
  const userId = getUserId()
  const { data } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (data) return data

  const { data: created, error } = await supabase
    .from('wallets')
    .insert({ user_id: userId })
    .select()
    .maybeSingle()

  if (error) throw error
  return created
}

export async function getWalletBalance() {
  const wallet = await getOrCreateWallet()
  return { balance: Number(wallet.balance), points: wallet.points, tier: wallet.tier }
}

export async function addFunds(amount, reason = 'top_up') {
  const wallet = await getOrCreateWallet()
  const newBalance = Number(wallet.balance) + amount
  const pointsEarned = Math.floor(amount * POINTS_PER_RIYAL)

  await supabase
    .from('wallets')
    .update({ balance: newBalance, points: wallet.points + pointsEarned, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  await supabase.from('wallet_transactions').insert({
    type: 'deposit',
    title: reason,
    amount,
    status: 'completed',
    category: 'wallet',
    metadata: { points_earned: pointsEarned },
  })

  return { balance: newBalance, points: wallet.points + pointsEarned }
}

export async function deductFunds(amount, reason = 'purchase') {
  const wallet = await getOrCreateWallet()
  const newBalance = Number(wallet.balance) - amount
  if (newBalance < 0) throw new Error('رصيد غير كافٍ')

  await supabase
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  await supabase.from('wallet_transactions').insert({
    type: 'purchase',
    title: reason,
    amount: -amount,
    status: 'completed',
    category: 'wallet',
  })

  return { balance: newBalance }
}

export async function spendPoints(points, reason = 'redeem') {
  const wallet = await getOrCreateWallet()
  if (wallet.points < points) throw new Error('نقاط غير كافية')

  const newPoints = wallet.points - points
  await supabase
    .from('wallets')
    .update({ points: newPoints, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  await supabase.from('wallet_transactions').insert({
    type: 'purchase',
    title: reason,
    amount: 0,
    status: 'completed',
    category: 'points',
    metadata: { points_spent: points },
  })

  return { points: newPoints }
}

export async function getTransactions(limit = 20) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getRewardsHistory() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export function getTier(points) {
  if (points >= 5000) return { name: 'ذهبي', color: 'text-amber-600', bg: 'bg-amber-50', next: null, progress: 100 }
  if (points >= 2000) return { name: 'فضي', color: 'text-sky-600', bg: 'bg-sky-50', next: 5000, progress: Math.round((points / 5000) * 100) }
  if (points >= 500) return { name: 'برونزي', color: 'text-orange-600', bg: 'bg-orange-50', next: 2000, progress: Math.round((points / 2000) * 100) }
  return { name: 'مبتدئ', color: 'text-gray-600', bg: 'bg-gray-50', next: 500, progress: Math.round((points / 500) * 100) }
}

export { POINTS_PER_RIYAL }
