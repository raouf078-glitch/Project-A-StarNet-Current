import { supabase } from './supabase'

export function getAppUserId() {
  return null
}

export function getAnonymousId() {
  return null
}

// Returns the authenticated user's UUID (auth.uid) or null if not signed in
export async function getAuthUid() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id || null
}

// Synchronous check — returns cached session user id if available
export function getAuthUidSync() {
  const { data } = supabase.auth.getSession()
  return data?.session?.user?.id || null
}
