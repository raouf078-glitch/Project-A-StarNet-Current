import { supabase } from './supabase'

const OWNER_EMAIL = 'raouf078@gmail.com'

let onAuthChangeCb = null
let currentSession = null
let currentProfile = null
let initialized = false

function phoneToEmail(phone) {
  const digits = phone.replace(/\D/g, '')
  return `user_${digits}@starnet.local`
}

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
  OWNER_EMAIL,

  async getCurrentUser() {
    if (!currentSession) await initSession()
    return currentSession?.user || null
  },

  isAppOwner() {
    return !!currentSession
  },

  isAdmin() {
    const email = currentSession?.user?.email || ''
    return email === OWNER_EMAIL
  },

  isOwner() {
    const email = currentSession?.user?.email || ''
    return email === OWNER_EMAIL
  },

  getRole() {
    return currentProfile?.role || 'customer'
  },

  getProfile() {
    return currentProfile
  },

  getEmail() {
    return currentSession?.user?.email || ''
  },

  phoneToEmail,

  // Submit a registration request (no auth user, no profile, no wallet)
  async submitRegistration({ full_name, phone, password, device_info, ip_address }) {
    const { error } = await supabase
      .from('registration_requests')
      .insert({
        full_name,
        phone,
        password_hash: password,
        device_info: device_info || null,
        ip_address: ip_address || null,
        status: 'pending',
      })
    if (error) throw error
    return true
  },

  // Check registration status by phone
  async checkRegistrationStatus(phone) {
    const { data, error } = await supabase
      .from('registration_requests')
      .select('status, rejection_reason')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  },

  // Sign in with phone + password (phone → synthetic email)
  async signInWithPhone(phone, password) {
    const email = phoneToEmail(phone)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    currentSession = data.session
    if (data.session?.user?.id) await fetchProfile(data.session.user.id)
    if (onAuthChangeCb) onAuthChangeCb(data.session)
    return data.user
  },

  // Sign in with Google (for admin/owner)
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/admin' },
    })
    if (error) throw error
    return data
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
