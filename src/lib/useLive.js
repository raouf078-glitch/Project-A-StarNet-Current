import { useState, useEffect, useCallback } from 'react'

const LOCAL_STORE = typeof window !== 'undefined' ? window : null
const LS_PREFIX = 'whacka_mock_'

const SEED_PACKAGES = [
  { id: 'pkg_200', name: 'باقة 200', description: 'باقة اقتصادية', price: 200, speed: '5 ميجا', validity: '7 أيام', quota: '5 جيجا', active: true, colorIndex: 0, sort: 0 },
  { id: 'pkg_300', name: 'باقة 300', description: 'باقة يومية', price: 300, speed: '8 ميجا', validity: '7 أيام', quota: '10 جيجا', active: true, colorIndex: 1, sort: 1 },
  { id: 'pkg_500', name: 'باقة 500', description: 'باقة أسبوعية', price: 500, speed: '10 ميجا', validity: '7 أيام', quota: '20 جيجا', active: true, colorIndex: 2, sort: 2 },
  { id: 'pkg_1000', name: 'باقة 1000', description: 'باقة شهرية', price: 1000, speed: '15 ميجا', validity: '30 يوم', quota: '40 جيجا', active: true, colorIndex: 3, sort: 3 },
  { id: 'pkg_1500', name: 'باقة 1500', description: 'باقة شهرية بلس', price: 1500, speed: '20 ميجا', validity: '30 يوم', quota: '60 جيجا', active: true, colorIndex: 4, sort: 4 },
  { id: 'pkg_2000', name: 'باقة 2000', description: 'باقة عائلية', price: 2000, speed: '25 ميجا', validity: '30 يوم', quota: '80 جيجا', active: true, colorIndex: 5, sort: 5 },
  { id: 'pkg_3000', name: 'باقة 3000', description: 'باقة كبيرة', price: 3000, speed: '30 ميجا', validity: '30 يوم', quota: '120 جيجا', active: true, colorIndex: 6, sort: 6 },
  { id: 'pkg_5000', name: 'باقة 5000', description: 'باقة أعمال', price: 5000, speed: '40 ميجا', validity: '30 يوم', quota: '200 جيجا', active: true, colorIndex: 7, sort: 7 },
  { id: 'pkg_10000', name: 'باقة 10000', description: 'الباقة الذهبية', price: 10000, speed: 'مفتوحة', validity: '30 يوم', quota: 'مفتوح', active: true, colorIndex: 8, sort: 8 },
]

function readLocal(coll) {
  try {
    const raw = LOCAL_STORE?.localStorage?.getItem(LS_PREFIX + coll)
    if (!raw && coll === 'packages') {
      writeLocal(coll, SEED_PACKAGES)
      return SEED_PACKAGES
    }
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocal(coll, rows) {
  try {
    LOCAL_STORE?.localStorage?.setItem(LS_PREFIX + coll, JSON.stringify(rows))
  } catch {}
}

export function useLiveShared(coll, opts = {}) {
  const [data, setData] = useState(() => readLocal(coll))
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(() => {
    setData(readLocal(coll))
  }, [coll])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, refresh }
}

export function useLive(coll, opts = {}) {
  return useLiveShared(coll, opts)
}

export const _mockStore = { readLocal, writeLocal }
