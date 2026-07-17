import { useState, useMemo, useEffect, useCallback } from 'react'

// ───────────────────────────────────────────────────────────────
// خطّاف تحديد جماعي عام قابل لإعادة الاستخدام في أي قائمة.
//   items   : المصفوفة المعروضة حالياً (بعد البحث/التصفية)
//   getId   : دالة لاستخراج معرّف العنصر (افتراضياً r.id)
// يُرجع أدوات التحديد الكاملة لبناء واجهة موحّدة (checkbox + شريط إجراءات).
// ───────────────────────────────────────────────────────────────
export function useBulkSelect(items, getId = (r) => r.id) {
  const [selected, setSelected] = useState(() => new Set())

  const ids = useMemo(() => items.map(getId), [items, getId])

  // تنظيف المعرّفات المحددة التي لم تعد موجودة (بعد حذف/تحديث).
  useEffect(() => {
    if (selected.size === 0) return
    const live = new Set(ids)
    let changed = false
    const next = new Set()
    for (const id of selected) {
      if (live.has(id)) next.add(id); else changed = true
    }
    if (changed) setSelected(next)
  }, [ids]) // eslint-disable-line react-hooks/exhaustive-deps

  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id))

  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => setSelected(new Set(ids)), [ids])
  const clear = useCallback(() => setSelected(new Set()), [])
  const toggleAll = useCallback(() => {
    setSelected((prev) => (ids.length > 0 && ids.every((id) => prev.has(id)) ? new Set() : new Set(ids)))
  }, [ids])

  const isSelected = useCallback((id) => selected.has(id), [selected])

  return {
    selected,
    selectedIds: [...selected],
    count: selected.size,
    allSelected,
    isSelected,
    toggle,
    toggleAll,
    selectAll,
    clear,
    total: ids.length,
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const isRateLimit = (e) => {
  const s = String(e?.message || e?.status || e || '')
  return /429|rate|limit|too many|quota/i.test(s)
}

// حذف معرّف واحد مع إعادة محاولة تلقائية عند الرفض (429) بتباعد متصاعد.
async function deleteWithRetry(deleteFn, id) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await Promise.resolve(deleteFn(id))
      return true
    } catch (e) {
      if (attempt === 5) return false
      // مهلة أطول عند تجاوز حدّ المعدّل، لضمان أن الحذف يُنفَّذ فعلاً على الخادم.
      const base = isRateLimit(e) ? 1500 : 500
      await sleep(base * (attempt + 1))
    }
  }
  return false
}

// تنفيذ مهمة على عنصر واحد مع إعادة محاولة تلقائية عند الرفض (429).
async function runWithRetry(taskFn, item) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await Promise.resolve(taskFn(item))
      return true
    } catch (e) {
      if (attempt === 5) return false
      const base = isRateLimit(e) ? 1500 : 500
      await sleep(base * (attempt + 1))
    }
  }
  return false
}

// تشغيل مهمة (تحديث/كتابة) على مجموعة عناصر بمعدّل آمن تحت حدّ الخادم،
// مع إعادة المحاولة عند الرفض. يُرجع { ok, failed, total }.
export async function runBatched(taskFn, items, onProgress) {
  const CONCURRENCY = 4
  const PAUSE_MS = 400
  let done = 0
  let ok = 0
  let failed = 0
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const chunk = items.slice(i, i + CONCURRENCY)
    const results = await Promise.all(chunk.map((it) => runWithRetry(taskFn, it)))
    for (const r of results) { if (r) ok++; else failed++ }
    done += chunk.length
    onProgress?.(done, items.length)
    if (i + CONCURRENCY < items.length) await sleep(PAUSE_MS)
  }
  return { ok, failed, total: items.length }
}

// حذف مجموعة معرّفات بمعدّل آمن تحت حدّ الخادم (تزامن محدود + مهلة بين الدفعات)
// مع إعادة المحاولة. يُرجع { ok, failed, total } ليعرف المستدعي ما حُذف فعلاً.
export async function deleteIdsBatched(deleteFn, ids, onProgress) {
  const CONCURRENCY = 4      // عدد الطلبات المتزامنة (منخفض عمداً)
  const PAUSE_MS = 400       // مهلة بين كل دفعة والتالية لاحترام حدّ المعدّل
  let done = 0
  let ok = 0
  let failed = 0
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const chunk = ids.slice(i, i + CONCURRENCY)
    const results = await Promise.all(chunk.map((id) => deleteWithRetry(deleteFn, id)))
    for (const r of results) { if (r) ok++; else failed++ }
    done += chunk.length
    onProgress?.(done, ids.length)
    if (i + CONCURRENCY < ids.length) await sleep(PAUSE_MS)
  }
  return { ok, failed, total: ids.length }
}
