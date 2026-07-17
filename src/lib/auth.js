const LS_KEY = 'whacka_mock_user'

function getUser() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setUser(u) {
  try {
    if (u) localStorage.setItem(LS_KEY, JSON.stringify(u))
    else localStorage.removeItem(LS_KEY)
  } catch {}
}

export const auth = {
  getCurrentUser() {
    return getUser()
  },

  isAppOwner() {
    return !!getUser()
  },

  async signIn() {
    const u = { id: 'mock-owner', email: 'owner@starnet.local', name: 'المالك' }
    setUser(u)
    return u
  },

  async signOut() {
    setUser(null)
  },

  onAuthChange(cb) {
    const handler = () => cb(getUser())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  },
}

