import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, X, Save, Loader as Loader2, Package, TriangleAlert as AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminProducts() {
  const [rows, setRows] = useState([])
  const [categories, setCategories] = useState([])
  const [stockMap, setStockMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2200) }

  const load = async () => {
    setLoading(true)
    try {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('display_order', { ascending: true }),
      ])
      setRows(prods || [])
      setCategories(cats || [])

      const { data: stock } = await supabase
        .from('card_inventory')
        .select('card_id')
        .eq('is_used', false)
      const map = {}
      ;(stock || []).forEach((s) => { map[s.card_id] = (map[s.card_id] || 0) + 1 })
      setStockMap(map)
    } catch { flash('تعذّر تحميل المنتجات') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => (r.title || '').toLowerCase().includes(q))
  }, [rows, query])

  const catName = (id, fallback) => categories.find((c) => c.id === id)?.name || fallback || '—'

  const save = async () => {
    if (busy) return
    setBusy(true)
    try {
      const rec = { ...editing }
      delete rec.__isNew
      delete rec.stock
      if (rec.price !== undefined) rec.price = Number(rec.price)
      if (rec.old_price !== undefined) rec.old_price = Number(rec.old_price)
      if (rec.gems_price !== undefined && rec.gems_price !== '') rec.gems_price = Number(rec.gems_price)
      if (rec.gems_reward !== undefined) rec.gems_reward = Number(rec.gems_reward)

      if (rec.id) {
        const { error } = await supabase.from('products').update(rec).eq('id', rec.id)
        if (error) throw error
      } else {
        delete rec.id
        const { error } = await supabase.from('products').insert(rec)
        if (error) throw error
      }
      setEditing(null)
      flash('تم الحفظ ✓')
      load()
    } catch (e) { flash(e.message || 'تعذّر الحفظ') }
    finally { setBusy(false) }
  }

  const remove = async (row) => {
    if (!confirm(`حذف "${row.title}"?`)) return
    try {
      await supabase.from('products').delete().eq('id', row.id)
      flash('تم الحذف')
      load()
    } catch { flash('تعذّر الحذف') }
  }

  const openNew = () => setEditing({
    __isNew: true,
    title: '', description: '', price: 0, old_price: 0, category: 'subscriptions',
    category_id: null, image_url: '', availability: true, featured: false,
    popular: false, gems_price: null, gems_reward: 0,
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث..."
            className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <button onClick={openNew} className="shrink-0 bg-blue-600 text-white rounded-xl px-3.5 py-2.5 flex items-center gap-1.5 text-sm font-bold active:scale-95 transition-transform shadow-sm">
          <Plus size={17} /> إضافة
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <Package size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-500">لا توجد منتجات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <div key={row.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {row.image_url ? <img src={row.image_url} alt="" className="w-full h-full object-cover" /> : <Package size={18} className="text-gray-300 m-auto mt-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-800 text-sm truncate">{row.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">{Number(row.price).toLocaleString()} ر.ي</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${row.availability ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {row.availability ? 'متاح' : 'معطّل'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">المخزون: {stockMap[row.id] || 0} بطاقة</p>
              </div>
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
              <h3 className="font-black text-gray-800">{editing.__isNew ? 'منتج جديد' : 'تعديل منتج'}</h3>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
              <Field label="اسم المنتج" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
              <Area label="الوصف" value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="السعر (ر.ي)" type="number" value={editing.price} onChange={(v) => setEditing({ ...editing, price: v })} />
                <Field label="السعر القديم" type="number" value={editing.old_price} onChange={(v) => setEditing({ ...editing, old_price: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="سعر النقاط" type="number" value={editing.gems_price || ''} onChange={(v) => setEditing({ ...editing, gems_price: v })} />
                <Field label="مكافأة النقاط" type="number" value={editing.gems_reward} onChange={(v) => setEditing({ ...editing, gems_reward: v })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">القسم</label>
                <select value={editing.category_id || ''} onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                  <option value="">— بدون قسم —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Field label="رابط الصورة" value={editing.image_url} onChange={(v) => setEditing({ ...editing, image_url: v })} />
              <Toggle label="متاح للبيع" value={editing.availability} onChange={(v) => setEditing({ ...editing, availability: v })} />
              <Toggle label="مميّز" value={editing.featured} onChange={(v) => setEditing({ ...editing, featured: v })} />
              <Toggle label="الأكثر مبيعاً" value={editing.popular} onChange={(v) => setEditing({ ...editing, popular: v })} />
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

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-600 mb-1.5 block">{label}</label>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
    </div>
  )
}

function Area({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-600 mb-1.5 block">{label}</label>
      <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none leading-relaxed" />
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-bold text-gray-600">{label}</label>
      <button onClick={() => onChange(!value)} className={`w-12 h-7 rounded-full transition-colors relative ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${value ? 'right-0.5' : 'right-[calc(100%-1.625rem)]'}`} />
      </button>
    </div>
  )
}
