import { supabase } from './supabase'
import { getAuthUid } from './wallet'

export async function getNotifications(limit = 50) {
  const uid = await getAuthUid()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('uid', uid)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function markAsRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markAllAsRead() {
  const uid = await getAuthUid()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('uid', uid)
    .eq('read', false)

  if (error) throw error
}

export async function getUnreadCount() {
  const uid = await getAuthUid()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('uid', uid)
    .eq('read', false)

  if (error) throw error
  return count || 0
}

export function subscribeToNotifications(onInsert) {
  const channel = supabase
    .channel('user-notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
    }, (payload) => {
      onInsert(payload.new)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function subscribeToWalletUpdates(onUpdate) {
  const channel = supabase
    .channel('wallet-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'wallets',
    }, (payload) => {
      onUpdate(payload.new)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}
