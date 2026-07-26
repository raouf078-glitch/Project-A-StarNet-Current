import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Save, Loader as Loader2, Tags } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminCategories() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2200) }

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true })
      if (error) throw error
      setRows(data || [])
    } catch { flash('تعذّر تحميل الأقسام') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (busy) return
    setBusy(true)
    try {
      const rec = { ...editing }
      delete rec.__isNew
      if (rec.display_order !== undefined) rec.display_order = Number(rec.display_order)

      if (rec.id) {
        const { error } = await supabase.from('categories').update(rec).eq('id', rec.id)
        if (error) throw error
      } else {
        delete rec.id
        const { error } = await supabase.from('categories').insert(rec)
        if (error) throw error
      }
      setEditing(null)
      flash('تم الحفظ ✓')
      load()
    } catch (e) { flash(e.message || 'تعذّر الحفظ') }
    finally { setBusy(false) }
  }

  const remove = async (row) => {
    if (!confirm(`حذف قسم "${row.name}"?`)) return
    try {
      await supabase.from('categories').delete().eq('id', row.id)
      flash('تم الحذف')
      load()
    } catch { flash('تعذّر الحذف') }
  }

  const openNew = () => setEditing({ __isNew: true, name: '', icon: '', display_order: 0, is_active: true })

  return (
    <div className="space-y-3">
      <button onClick={openNew} className="w-full bg-blue-600 text-white rounded-xl px-3.5 py-2.5 flex items-center justify-center gap-1.5 text-sm font-bold active:scale-95 transition-transform shadow-sm">
        <Plus size={17} /> إضافة قسم
      </button>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <Tags size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-500">لا توجد أقسام</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0"><Tags size={18} className="text-indigo-600" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-800 text-sm truncate">{row.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">الترتيب: {row.display_order}</p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${row.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                {row.is_active ? 'مفعّل' : 'معطّل'}
              </span>
              <button onClick={() => setEditing({ ...row })} className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Pencil size={14} /></button>
              <button onClick={() => remove(row)} className="shrink-0 w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" style={{ height: 'var(--visual-height, 100dvh)' }}>
          <div className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(var(--visual-height, 100dvh) - 2rem)' }}>
            <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="font-black text-gray-800">{editing.__isNew ? 'قسم جديد' : 'تعديل قسم'}</h3>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">اسم القسم</label>
                <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">الأيقونة (اختياري)</label>
                <input value={editing.icon || ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="📱"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">ترتيب العرض</label>
                <input type="number" value={editing.display_order ?? 0} onChange={(e) => setEditing({ ...editing, display_order: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-600">مفعّل</label>
                <button onClick={() => setEditing({ ...editing, is_active: !editing.is_active })} className={`w-12 h-7 rounded-full transition-colors relative ${editing.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${editing.is_active ? 'right-0.5' : 'right-[calc(100%-1.625rem)]'}`} />
                </button>
              </div>
            </div>
            <div className="shrink-0 border-t border-gray-100 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
              <button onClick={save} disabled={busy} className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 shadow-lg shadow-blue-200">
                <Save size={18} /> {busy ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg">{toast}</div>
      )}
    </div>
  )
}
