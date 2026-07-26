import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Upload, Loader as Loader2, Boxes, Trash2, CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminInventory() {
  const [products, setProducts] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef(null)

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  const load = async () => {
    setLoading(true)
    try {
      const { data: prods } = await supabase.from('products').select('id, title').order('title', { ascending: true })
      setProducts(prods || [])
      const { data: inv } = await supabase
        .from('card_inventory')
        .select('id, card_id, code, pin, serial_number, is_used, used_at, created_at')
        .order('created_at', { ascending: false })
        .limit(500)
      setRows(inv || [])
    } catch { flash('تعذّر تحميل المخزون') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = rows
    if (selectedProduct) list = list.filter((r) => r.card_id === selectedProduct)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((r) => (r.code || '').toLowerCase().includes(q) || (r.serial_number || '').toLowerCase().includes(q))
    return list
  }, [rows, query, selectedProduct])

  const stockByProduct = useMemo(() => {
    const map = {}
    rows.forEach((r) => { if (!r.is_used) map[r.card_id] = (map[r.card_id] || 0) + 1 })
    return map
  }, [rows])

  const parseLines = (text) => {
    return text.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const parts = line.split(/[,\t|]/).map((p) => p.trim())
      return { code: parts[0] || '', pin: parts[1] || '', serial_number: parts[2] || '' }
    }).filter((r) => r.code)
  }

  const doImport = async () => {
    if (importing || !selectedProduct) return
    const records = parseLines(importText)
    if (!records.length) { flash('لا توجد أسطر صالحة'); return }

    setImporting(true)
    try {
      const inserts = records.map((r) => ({ card_id: selectedProduct, code: r.code, pin: r.pin || null, serial_number: r.serial_number || null }))
      let ok = 0, failed = 0
      for (let i = 0; i < inserts.length; i += 200) {
        const batch = inserts.slice(i, i + 200)
        const { error } = await supabase.from('card_inventory').insert(batch)
        if (error) failed += batch.length
        else ok += batch.length
      }
      setImportText('')
      flash(failed ? `تم استيراد ${ok}، فشل ${failed}` : `تم استيراد ${ok} بطاقة ✓`)
      load()
    } catch (e) { flash('تعذّر الاستيراد') }
    finally { setImporting(false) }
  }

  const removeCard = async (row) => {
    try {
      await supabase.from('card_inventory').delete().eq('id', row.id)
      flash('تم الحذف')
      load()
    } catch { flash('تعذّر الحذف') }
  }

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    setImportText(text)
  }

  return (
    <div className="space-y-4">
      {/* Stock overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-600 mb-3">المخزون المتاح لكل منتج</p>
        <div className="space-y-1.5">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate flex-1">{p.title}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${(stockByProduct[p.id] || 0) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                {stockByProduct[p.id] || 0} متاح
              </span>
            </div>
          ))}
          {products.length === 0 && <p className="text-xs text-gray-400 text-center py-2">أضف منتجات أولاً</p>}
        </div>
      </div>

      {/* Import section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Upload size={16} className="text-teal-600" />
          <p className="text-xs font-bold text-gray-600">استيراد بطاقات جديدة</p>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1.5 block">المنتج</label>
          <select value={selectedProduct || ''} onChange={(e) => setSelectedProduct(e.target.value || null)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
            <option value="">— اختر منتج —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1.5 block">أكواد البطاقات (سطر لكل بطاقة: CODE, PIN, SERIAL)</label>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={5} dir="ltr"
            placeholder={'CODE1,PIN1,SERIAL1\nCODE2,PIN2,SERIAL2\nCODE3,PIN3'}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-400 resize-none leading-relaxed" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="flex-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2.5 flex items-center justify-center gap-1.5">
            <Upload size={14} /> من ملف
          </button>
          <button onClick={doImport} disabled={importing || !selectedProduct}
            className="flex-1 bg-blue-600 text-white font-bold rounded-xl px-3 py-2.5 flex items-center justify-center gap-1.5 text-sm active:scale-95 transition-transform disabled:opacity-50 shadow-sm">
            {importing ? <><Loader2 size={14} className="animate-spin" /> جاري...</> : <><Boxes size={14} /> استيراد</>}
          </button>
          <input ref={fileRef} type="file" accept=".txt,.csv,text/plain" onChange={onPickFile} className="hidden" />
        </div>
      </div>

      {/* Inventory list */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث بالكود أو التسلسل..."
              className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <select value={selectedProduct || ''} onChange={(e) => setSelectedProduct(e.target.value || null)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-600 focus:outline-none">
            <option value="">كل المنتجات</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <Boxes size={26} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-500">لا توجد بطاقات</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.slice(0, 100).map((row) => (
              <div key={row.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-2">
                <div className="shrink-0">
                  {row.is_used ? <XCircle size={18} className="text-gray-300" /> : <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono font-bold text-gray-800 truncate" dir="ltr">{row.code}</p>
                  {row.serial_number && <p className="text-[10px] text-gray-400" dir="ltr">SN: {row.serial_number}</p>}
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${row.is_used ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  {row.is_used ? 'مستخدم' : 'متاح'}
                </span>
                {!row.is_used && (
                  <button onClick={() => removeCard(row)} className="shrink-0 w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
            {filtered.length > 100 && <p className="text-[11px] text-gray-400 text-center py-2">عرض أول 100 من {filtered.length} بطاقة</p>}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg">{toast}</div>
      )}
    </div>
  )
}
