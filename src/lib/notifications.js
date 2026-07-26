import { supabase } from './supabase'
import { getUserId } from './wallet'

// Fetch user notifications (most recent first)
export async function getNotifications(limit = 50) {
  const userId = getUserId()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Mark a single notification as read
export async function markAsRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)

  if (error) throw error
}

// Mark all unread notifications as read
export async function markAllAsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)

  if (error) throw error
}

// Count unread notifications
export async function getUnreadCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)

  if (error) throw error
  return count || 0
}

// Subscribe to realtime notification inserts for this user
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

// Subscribe to realtime wallet balance updates
export function subscribeToWalletUpdates(onUpdate) {
  const userId = getUserId()
  const channel = supabase
    .channel('wallet-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'wallets',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      onUpdate(payload.new)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}
