import { supabase } from './supabase'

let onAuthChangeCb = null
let currentSession = null
let currentProfile = null
let initialized = false

async function fetchProfile(uid) {
  if (!uid) { currentProfile = null; return null }
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle()
  currentProfile = data || null
  return currentProfile
}

async function initSession() {
  if (initialized) return
  initialized = true
  const { data: { session } } = await supabase.auth.getSession()
  currentSession = session
  if (session?.user?.id) await fetchProfile(session.user.id)
  if (onAuthChangeCb) onAuthChangeCb(session)
}

export const auth = {
  async getCurrentUser() {
    if (!currentSession) await initSession()
    return currentSession?.user || null
  },

  isAppOwner() {
    return !!currentSession
  },

  isAdmin() {
    return currentProfile?.role === 'admin' || currentProfile?.role === 'manager'
  },

  getRole() {
    return currentProfile?.role || 'customer'
  },

  getProfile() {
    return currentProfile
  },

  async sendOtp(phone) {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: true },
    })
    if (error) throw error
    return true
  },

  async verifyOtp(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    if (error) throw error
    currentSession = data.session
    if (data.session?.user?.id) await fetchProfile(data.session.user.id)
    if (onAuthChangeCb) onAuthChangeCb(data.session)
    return data.user
  },

  async signOut() {
    await supabase.auth.signOut()
    currentSession = null
    currentProfile = null
    if (onAuthChangeCb) onAuthChangeCb(null)
  },

  onAuthChange(cb) {
    onAuthChangeCb = cb
    initSession()
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      currentSession = session
      if (session?.user?.id) {
        await fetchProfile(session.user.id)
      } else {
        currentProfile = null
      }
      cb(session)
    })
    return () => data.subscription.unsubscribe()
  },

  getSession() {
    return currentSession
  },
}
