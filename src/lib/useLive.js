import { useState, useEffect, useCallback } from 'react'

const LOCAL_STORE = typeof window !== 'undefined' ? window : null
const LS_PREFIX = 'whacka_mock_'

function readLocal(coll) {
  try {
    const raw = LOCAL_STORE?.localStorage?.getItem(LS_PREFIX + coll)
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

export function seedPackagesOnce() {
  try {
    const FLAG = LS_PREFIX + 'packages_seeded'
    if (LOCAL_STORE?.localStorage?.getItem(FLAG)) return
    const existing = LOCAL_STORE?.localStorage?.getItem(LS_PREFIX + 'packages')
    if (existing) { LOCAL_STORE.localStorage.setItem(FLAG, '1'); return }
    writeLocal('packages', SEED_PACKAGES)
    LOCAL_STORE.localStorage.setItem(FLAG, '1')
  } catch {}
}

const SEED_PACKAGES = [
  { id: 'الباقة اليومية', name: 'الباقة اليومية', description: 'اتصال سريع ليوم كامل', price: 200, quota: '1 جيجابايت', speed: 'مفتوحة', active: true, validity: 'يومان', colorIndex: 0, sort: 1 },
  { id: 'باقة 3 أيام', name: 'باقة 3 أيام', description: 'ثلاثة أيام من الاتصال', price: 300, quota: '2 جيجابايت', speed: 'مفتوحة', active: true, validity: '3 أيام', colorIndex: 1, sort: 2 },
  { id: 'الباقة الاقتصادية', name: 'الباقة الاقتصادية', description: 'قيمة ممتازة لعشرة أيام', price: 500, quota: '4.5 جيجابايت', speed: 'مفتوحة', active: true, validity: '10 أيام', colorIndex: 2, sort: 3 },
  { id: 'الباقة الشهرية الأساسية', name: 'الباقة الشهرية الأساسية', description: 'شهر كامل للاستخدام اليومي', price: 1000, quota: '10 جيجابايت', speed: 'مفتوحة', active: true, validity: 'شهر واحد', colorIndex: 3, sort: 4 },
  { id: 'الباقة الشهرية المميزة', name: 'الباقة الشهرية المميزة', description: 'تحميل أكثر طوال الشهر', price: 1500, quota: '16 جيجابايت', speed: 'مفتوحة', active: true, validity: 'شهر واحد', colorIndex: 4, sort: 5 },
  { id: 'الباقة الشهرية المتقدمة', name: 'الباقة الشهرية المتقدمة', description: 'للمستخدمين النشطين', price: 2000, quota: '22 جيجابايت', speed: 'مفتوحة', active: true, validity: 'شهر واحد', colorIndex: 5, sort: 6 },
  { id: 'الباقة الشهرية الذهبية', name: 'الباقة الشهرية الذهبية', description: 'أعلى استخدام شهري', price: 3000, quota: '33 جيجابايت', speed: 'مفتوحة', active: true, validity: 'شهر واحد', colorIndex: 6, sort: 7 },
  { id: 'الباقة المنزلية', name: 'الباقة المنزلية', description: 'مثالية للمنازل', price: 5000, quota: '60 جيجابايت', speed: 'مفتوحة', active: true, validity: 'شهر واحد', colorIndex: 7, sort: 8 },
  { id: 'الباقة المنزلية بلس', name: 'الباقة المنزلية بلس', description: 'أقصى استخدام للمنزل', price: 10000, quota: '130 جيجابايت', speed: 'مفتوحة', active: true, validity: 'شهر واحد', colorIndex: 8, sort: 9 },
  { id: 'باقة نصف الشهر', name: 'باقة نصف الشهر', price: 0, active: false, colorIndex: 0, sort: 99 },
  { id: 'الباقة الشهرية', name: 'الباقة الشهرية', price: 0, active: false, colorIndex: 0, sort: 99 },
  { id: 'باقة الألعاب', name: 'باقة الألعاب', price: 0, active: false, colorIndex: 0, sort: 99 },
  { id: 'الباقة الأسبوعية', name: 'الباقة الأسبوعية', price: 300, active: false, colorIndex: 1, sort: 99 },
]
