const LS_KEY = 'whacka_mock_anon_id'

function getOrCreateAnonId() {
  try {
    let id = localStorage.getItem(LS_KEY)
    if (!id) {
      id = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(LS_KEY, id)
    }
    return id
  } catch {
    return 'anon_preview'
  }
}

export function getAppUserId() {
  return null
}

export function getAnonymousId() {
  return getOrCreateAnonId()
}
