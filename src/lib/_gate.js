export async function clearGateToken() {
  return true
}

export async function gateSeedIsOpen() {
  return false
}

export async function setGateSeed() {
  return null
}

export async function handleGatedResponse() {
  return null
}

export async function popMagicKey() {
  return null
}

export async function fetchGateStatus() {
  return { open: false }
}

export async function submitGateCode() {
  return { ok: false, error: 'Gate login is not available in local preview.' }
}
