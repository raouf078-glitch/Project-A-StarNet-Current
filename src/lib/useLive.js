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
