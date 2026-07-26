import { supabase } from './supabase'

let onAuthChangeCb = null
let currentSession = null
let initialized = false

async function initSession() {
  if (initialized) return
  initialized = true
  const { data: { session } } = await supabase.auth.getSession()
  currentSession = session
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
    if (onAuthChangeCb) onAuthChangeCb(data.session)
    return data.user
  },

  async signOut() {
    await supabase.auth.signOut()
    currentSession = null
    if (onAuthChangeCb) onAuthChangeCb(null)
  },

  onAuthChange(cb) {
    onAuthChangeCb = cb
    initSession()
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      currentSession = session
      cb(session)
    })
    return () => data.subscription.unsubscribe()
  },

  getSession() {
    return currentSession
  },
}
