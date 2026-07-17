import { useState, useMemo, useRef } from 'react'
import {
  Plus, Search, Pencil, Trash2, X, Check, Upload, Download as DownloadIcon,
  ArrowUpDown, Filter, Save, AlertTriangle, CheckSquare, Square, Trash,
} from 'lucide-react'
import { db } from '../../lib/db'
import { useLiveShared } from '../../lib/useLive'
import {
  newRecord, normalizeRecord, parseCsv, toCsv,
} from '../../kbSchemas'
import { useBulkSelect, deleteIdsBatched } from '../../hooks/useBulkSelect'
import { BulkBar, ConfirmDanger } from './BulkBar'

// حقول لا تظهر في المحرّر (تُدار تلقائياً).
const AUTO_FIELDS = new Set(['createdAt', 'updatedAt'])

// ───────────────────────────────────────────────────────────────
// مدير عام لأي مجموعة معرفة: قائمة حيّة + بحث + فرز + CRUD + CSV
// + تحديد جماعي (Bulk Actions) وحذف القاعدة كاملة.
// props:
//   managed  : مدخل من MANAGED { coll, schema, titleField, subField, ... }
//   refOptions : خيارات المراجع { fieldKey: [{value,label}] } (اختياري)
// ───────────────────────────────────────────────────────────────
export default function CrudManager({ managed, refOptions = {} }) {
  const { coll, schema, titleField, subField } = managed
  const { data: rows, loading } = useLiveShared(coll, { limit: 1000 })

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | active | inactive
  const [sortDesc, setSortDesc] = useState(true)
  const [editing, setEditing] = useState(null) // كائن السجل قيد التحرير أو null
  const [confirmDel, setConfirmDel] = useState(null)
  const [confirmBulk, setConfirmBulk] = useState(false) // حذف المحدد
  const [confirmAll, setConfirmAll] = useState(false)    // حذف القاعدة كاملة
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null) // {done,total} أثناء الحذف الجماعي
  const [toast, setToast] = useState('')
  const fileRef = useRef(null)

  const hasActive = schema.some((f) => f.key === 'active')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = rows.filter((r) => {
      if (statusFilter === 'active' && r.active === false) return false
      if (statusFilter === 'inactive' && r.active !== false) return false
      if (!q) return true
      return schema.some((f) => {
        const v = r[f.key]
        const s = Array.isArray(v) ? v.join(' ') : String(v ?? '')
        return s.toLowerCase().includes(q)
      })
    })
    list = [...list].sort((a, b) => {
      const av = a.updatedAt || a.createdAt || ''
      const bv = b.updatedAt || b.createdAt || ''
      return sortDesc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1)
    })
    return list
  }, [rows, query, statusFilter, sortDesc, schema])

  // التحديد الجماعي عبر الخطّاف المشترك.
  const bulk = useBulkSelect(filtered)

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const openNew = () => setEditing({ ...newRecord(schema), __isNew: true })
  const openEdit = (row) => setEditing({ ...row })

  const save = async () => {
    if (busy) return
    const rec = normalizeRecord(schema, editing)
    if (!rec.id) rec.id = `${managed.key}-${Date.now().toString(36)}`
    setBusy(true)
    try {
      await db.upsertShared(coll, rec, rec.id)
      setEditing(null)
      flash('تم الحفظ ✓')
    } catch {
      flash('تعذّر الحفظ')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (row) => {
    try {
      await db.updateShared(coll, row.id, { active: row.active === false })
    } catch { flash('تعذّر التحديث') }
  }

  const doDelete = async () => {
    if (!confirmDel) return
    setBusy(true)
    try {
      await db.deleteShared(coll, confirmDel.id)
      setConfirmDel(null)
      flash('تم الحذف')
    } catch {
      flash('تعذّر الحذف')
    } finally {
      setBusy(false)
    }
  }

  // حذف العناصر المحددة.
  const doBulkDelete = async () => {
    const ids = bulk.selectedIds
    if (!ids.length) return
    setBusy(true)
    setProgress({ done: 0, total: ids.length })
    try {
      const { ok, failed } = await deleteIdsBatched((id) => db.deleteShared(coll, id), ids, (done) => setProgress({ done, total: ids.length }))
      bulk.clear()
      setConfirmBulk(false)
      flash(failed ? `تم حذف ${ok}، وتعذّر حذف ${failed} — أعد المحاولة` : `تم حذف ${ok} عنصر`)
    } catch {
      flash('تعذّر الحذف الجماعي')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  // حذف القاعدة كاملة (كل سجلات هذا القسم).
  const doDeleteAll = async () => {
    const ids = rows.map((r) => r.id)
    if (!ids.length) { setConfirmAll(false); return }
    setBusy(true)
    setProgress({ done: 0, total: ids.length })
    try {
      const { ok, failed } = await deleteIdsBatched((id) => db.deleteShared(coll, id), ids, (done) => setProgress({ done, total: ids.length }))
      bulk.clear()
      setConfirmAll(false)
      flash(failed ? `حُذف ${ok}، وتبقّى ${failed} — أعد المحاولة لإكمالها` : 'تم حذف جميع السجلات')
    } catch {
      flash('تعذّر حذف القاعدة')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const exportCsv = async () => {
    try {
      const csv = '\uFEFF' + toCsv(rows, schema)
      const filename = `${managed.key}.csv`
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      // iOS: المشاركة هي الطريقة الموثوقة لحفظ ملف مُولّد محلياً.
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      if (isIOS && navigator.canShare) {
        const file = new File([blob], filename, { type: 'text/csv' })
        if (navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file] }); return } catch { /* المستخدم ألغى — نكمل للتنزيل */ }
        }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.rel = 'noopener'
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch {
      flash('تعذّر التصدير')
    }
  }

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      const normalized = parsed
        .map((raw) => normalizeRecord(schema, raw))
        .filter((r) => r.id) // يجب أن يحتوي كل صف على معرّف ثابت
      // إزالة التكرار داخل الملف: نفس المعرّف يُحتفظ به مرة واحدة (الأخير يفوز).
      const byId = new Map()
      for (const r of normalized) byId.set(r.id, r)
      const records = [...byId.values()]
      if (!records.length) { flash('لم يُعثر على صفوف صالحة (تأكد من عمود id)'); return }
      for (let i = 0; i < records.length; i += 500) {
        await db.insertManyShared(coll, records.slice(i, i + 500), { idField: 'id' })
      }
      flash(`تم استيراد ${records.length} سجل ✓`)
    } catch {
      flash('تعذّر الاستيراد — تحقق من صيغة الملف')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 py-3 space-y-3">
      {/* شريط الأدوات */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث..."
            className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <button onClick={openNew} className="shrink-0 bg-blue-600 text-white rounded-xl px-3.5 py-2.5 flex items-center gap-1.5 text-sm font-bold active:scale-95 transition-transform shadow-sm">
          <Plus size={17} /> إضافة
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {hasActive && (
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            {[
              { k: 'all', t: 'الكل' },
              { k: 'active', t: 'مفعّل' },
              { k: 'inactive', t: 'معطّل' },
            ].map((o) => (
              <button
                key={o.k}
                onClick={() => setStatusFilter(o.k)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors ${statusFilter === o.k ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
              >
                {o.t}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setSortDesc((s) => !s)} className="text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
          <ArrowUpDown size={13} /> {sortDesc ? 'الأحدث' : 'الأقدم'}
        </button>
        <div className="flex-1" />
        <button onClick={() => fileRef.current?.click()} className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
          <Upload size={13} /> استيراد
        </button>
        <button onClick={exportCsv} className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
          <DownloadIcon size={13} /> تصدير
        </button>
        <button onClick={() => setConfirmAll(true)} disabled={rows.length === 0} className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1 disabled:opacity-40">
          <Trash size={13} /> حذف القاعدة كاملة
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onPickFile} className="hidden" />
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="flex justify-center py-14">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <Filter size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-500">لا توجد سجلات</p>
          <p className="text-xs text-gray-400 mt-1">أضف سجلاً جديداً أو استورد ملف CSV.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* رأس القائمة: تحديد الكل + العدّاد */}
          <div className="flex items-center justify-between px-1">
            <button onClick={bulk.toggleAll} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 active:scale-95 transition-transform">
              {bulk.allSelected ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-gray-400" />}
              تحديد الكل
            </button>
            <p className="text-[11px] text-gray-400">{filtered.length} سجل</p>
          </div>

          {filtered.map((row) => {
            const isSel = bulk.isSelected(row.id)
            return (
              <div key={row.id} className={`bg-white rounded-xl border shadow-sm p-3 flex items-start gap-2 transition-colors ${isSel ? 'border-blue-300 ring-1 ring-blue-200 bg-blue-50/40' : 'border-gray-100'}`}>
                {/* مربع التحديد */}
                <button onClick={() => bulk.toggle(row.id)} className="shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center active:scale-90 transition-transform" aria-label="تحديد">
                  {isSel
                    ? <CheckSquare size={20} className="text-blue-600" />
                    : <Square size={20} className="text-gray-300" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800 text-sm truncate">
                      {String(row[titleField] || row.id || '—')}
                    </p>
                    {hasActive && (
                      <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${row.active === false ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        {row.active === false ? 'معطّل' : 'مفعّل'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {(() => {
                      const v = row[subField]
                      return Array.isArray(v) ? v.join('، ') : String(v ?? '')
                    })() || `المعرّف: ${row.id}`}
                  </p>
                </div>
                {hasActive && (
                  <button onClick={() => toggleActive(row)} title="تفعيل/تعطيل" className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${row.active === false ? 'bg-gray-50 text-gray-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Check size={15} />
                  </button>
                )}
                <button onClick={() => openEdit(row)} className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setConfirmDel(row)} className="shrink-0 w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
          {/* مساحة سفلية لكي لا يغطي شريط الإجراءات آخر عنصر */}
          {bulk.count > 0 && <div className="h-24" />}
        </div>
      )}

      {/* شريط الإجراءات الجماعية */}
      <BulkBar
        count={bulk.count}
        total={filtered.length}
        onDelete={() => setConfirmBulk(true)}
        onSelectAll={bulk.selectAll}
        onClear={bulk.clear}
      />

      {/* محرّر السجل */}
      {editing && (
        <RecordEditor
          managed={managed}
          value={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
          busy={busy}
          refOptions={refOptions}
        />
      )}

      {/* تأكيد حذف عنصر واحد */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" style={{ height: 'var(--visual-height, 100dvh)' }}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-rose-500" />
            </div>
            <p className="font-bold text-gray-800">حذف هذا السجل؟</p>
            <p className="text-xs text-gray-400 mt-1 truncate">{String(confirmDel[titleField] || confirmDel.id)}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">إلغاء</button>
              <button onClick={doDelete} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm disabled:opacity-60">حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* تأكيد حذف المحدد */}
      {confirmBulk && (
        <ConfirmDanger
          title={`حذف ${bulk.count} عنصر محدد؟`}
          message="سيتم حذف العناصر المحددة نهائياً. لا يمكن التراجع عن هذه العملية."
          confirmText={`حذف ${bulk.count} عنصر`}
          busy={busy}
          progress={progress}
          onCancel={() => !busy && setConfirmBulk(false)}
          onConfirm={doBulkDelete}
        />
      )}

      {/* تأكيد حذف القاعدة كاملة */}
      {confirmAll && (
        <ConfirmDanger
          title="حذف جميع السجلات؟"
          message={`هل أنت متأكد من حذف جميع السجلات (${rows.length})؟ لا يمكن التراجع عن هذه العملية.`}
          confirmText="نعم، احذف الكل"
          busy={busy}
          progress={progress}
          onCancel={() => !busy && setConfirmAll(false)}
          onConfirm={doDeleteAll}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── محرّر سجل (نافذة سفلية) ───
function RecordEditor({ managed, value, onChange, onClose, onSave, busy, refOptions }) {
  const { schema } = managed
  const set = (key, v) => onChange({ ...value, [key]: v })
  const fields = schema.filter((f) => !AUTO_FIELDS.has(f.key))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" style={{ height: 'var(--visual-height, 100dvh)' }}>
      <div className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(var(--visual-height, 100dvh) - 2rem)' }}>
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-black text-gray-800">{value.__isNew ? 'سجل جديد' : 'تعديل سجل'}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><X size={18} className="text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {fields.map((f) => (
            <Field key={f.key} field={f} value={value[f.key]} onChange={(v) => set(f.key, v)} refOptions={refOptions} />
          ))}
        </div>

        <div className="shrink-0 border-t border-gray-100 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
          <button onClick={onSave} disabled={busy} className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 shadow-lg shadow-blue-200">
            <Save size={18} /> {busy ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ field, value, onChange, refOptions }) {
  const f = field
  const label = (
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-xs font-bold text-gray-600">{f.label}</label>
      {f.note && <span className="text-[10px] text-gray-300 mr-2 truncate max-w-[60%]">{f.note}</span>}
    </div>
  )
  const boxCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400'

  if (f.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-600">{f.label}</label>
        <button onClick={() => onChange(!value)} className={`w-12 h-7 rounded-full transition-colors relative ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${value ? 'right-0.5' : 'right-[calc(100%-1.625rem)]'}`} />
        </button>
      </div>
    )
  }

  if (f.type === 'select' || (f.type === 'ref' && refOptions[f.key])) {
    const opts = f.type === 'select' ? f.options : refOptions[f.key]
    return (
      <div>{label}
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={boxCls}>
          <option value="">— اختر —</option>
          {(opts || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    )
  }

  if (f.type === 'text' || f.type === 'answer') {
    return <div>{label}<textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={3} className={`${boxCls} resize-none leading-relaxed`} /></div>
  }

  if (f.type === 'number') {
    return <div>{label}<input type="number" value={value ?? 0} onChange={(e) => onChange(e.target.value)} className={boxCls} /></div>
  }

  if (f.type === 'list' || f.type === 'ref-list') {
    const str = Array.isArray(value) ? value.join(' | ') : String(value ?? '')
    return (
      <div>{label}
        <input value={str} onChange={(e) => onChange(e.target.value.split('|').map((s) => s.trim()).filter(Boolean))} placeholder="قيمة | قيمة | قيمة" className={boxCls} />
      </div>
    )
  }

  // string / ref (بدون خيارات) / افتراضي
  return <div>{label}<input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={boxCls} /></div>
}
