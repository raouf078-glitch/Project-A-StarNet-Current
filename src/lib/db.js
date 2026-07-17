const LS_PREFIX = 'whacka_mock_'

function readLocal(coll) {
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + coll)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocal(coll, rows) {
  try {
    window.localStorage.setItem(LS_PREFIX + coll, JSON.stringify(rows))
  } catch {}
}

function genId() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const db = {
  async insertShared(coll, record) {
    const rows = readLocal(coll)
    const row = { id: genId(), createdAt: new Date().toISOString(), ...record }
    rows.push(row)
    writeLocal(coll, rows)
    return row
  },

  async insertManyShared(coll, records) {
    const rows = readLocal(coll)
    const now = new Date().toISOString()
    const created = records.map((r) => ({ id: genId(), createdAt: now, ...r }))
    writeLocal(coll, [...rows, ...created])
    return created
  },

  async upsertShared(coll, id, record) {
    const rows = readLocal(coll)
    const idx = rows.findIndex((r) => r.id === id)
    const now = new Date().toISOString()
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...record, updatedAt: now }
    } else {
      rows.push({ id: id || genId(), createdAt: now, ...record })
    }
    writeLocal(coll, rows)
    return rows[idx] || rows[rows.length - 1]
  },

  async updateShared(coll, id, patch) {
    const rows = readLocal(coll)
    const idx = rows.findIndex((r) => r.id === id)
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() }
      writeLocal(coll, rows)
      return rows[idx]
    }
    return null
  },

  async deleteShared(coll, id) {
    const rows = readLocal(coll).filter((r) => r.id !== id)
    writeLocal(coll, rows)
    return true
  },

  async countShared(coll, filters = {}) {
    let rows = readLocal(coll)
    for (const [k, v] of Object.entries(filters)) {
      rows = rows.filter((r) => r[k] === v)
    }
    return rows.length
  },

  async groupByShared(coll, field, opts = {}) {
    const rows = readLocal(coll)
    let filtered = rows
    if (opts.filters) {
      for (const [k, v] of Object.entries(opts.filters)) {
        filtered = filtered.filter((r) => r[k] === v)
      }
    }
    const map = new Map()
    for (const r of filtered) {
      const key = r[field] || ''
      if (!map.has(key)) map.set(key, { key, count: 0 })
      map.get(key).count++
    }
    let out = [...map.values()]
    if (opts.order === '-count') out.sort((a, b) => b.count - a.count)
    else out.sort((a, b) => a.count - b.count)
    if (opts.limit) out = out.slice(0, opts.limit)
    return out
  },

  async groupBy(coll, field, opts = {}) {
    return this.groupByShared(coll, field, opts)
  },
}
