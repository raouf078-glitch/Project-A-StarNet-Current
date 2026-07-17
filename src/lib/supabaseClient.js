import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
})

export function fmtMoney(n) {
  const v = Number(n) || 0
  return v.toLocaleString('en-US') + ' د.ع'
}

export function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '' }
}

export function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export function dateKey(iso) {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch { return '' }
}
