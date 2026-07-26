import { useState, useEffect } from 'react'
import { Loader as Loader2, Search, Wallet, CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminWalletAdjust() {
  const [users, setUsers] = useState([])
  const [wallets, setWallets] = useState({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  const load = async () => {
    setLoading(true)
    try {
      const { data: profs, error } = await supabase
        .from('profiles')
        .select('id, phone, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      setUsers(profs || [])

      const { data: wals } = await supabase.from('wallets').select('uid, balance, points')
      const wmap = {}
      ;(wals || []).forEach((w) => { wmap[w.uid] = w })
      setWallets(wmap)
    } catch { flash('تعذّر تحميل المستخدمين') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (u.phone || '').toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q) || (u.id || '').toLowerCase().includes(q)
  })

  const adjust = async () => {
    if (busy || !selected) return
    const amt = Number(amount)
    if (!amt || amt === 0) { flash('أدخل مبلغاً غير صفري'); return }
    if (!reason.trim()) { flash('سبب التعديل مطلوب'); return }

    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('admin_adjust_balance', {
        p_user_id: selected.id,
        p_amount: amt,
        p_reason: reason.trim(),
      })
      if (error) throw error
      flash(`تم تعديل الرصيد ✓ الرصيد الجديد: ${data?.new_balance ?? '—'}`)
      setSelected(null)
      setAmount('')
      setReason('')
      load()
    } catch (e) { flash(e.message || 'تعذّر التعديل') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 flex items-start gap-3">
        <Wallet size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-700 leading-relaxed">
          عدّل رصيد أي مستخدم بإضافة أو خصم. يتم تسجيل العملية في السجل المالي وإشعار المستخدم تلقائياً. السبب مطلوب.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث بالاسم أو الهاتف..."
          className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <Wallet size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-500">لا يوجد مستخدمون</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map((u) => {
            const w = wallets[u.id]
            return (
              <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Wallet size={18} className="text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800 text-sm truncate">{u.full_name || u.phone || 'مستخدم'}</p>
                  <p className="text-[10px] text-gray-400 truncate" dir="ltr">{u.phone || u.id}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-sm font-black text-gray-800">{Number(w?.balance || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">ر.ي</p>
                </div>
                <button onClick={() => setSelected(u)}
                  className="shrink-0 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg px-3 py-2 active:scale-95 transition-transform">
                  تعديل
                </button>
              </div>
            )
          })}
          {filtered.length > 50 && <p className="text-[11px] text-gray-400 text-center py-2">عرض أول 50 من {filtered.length}</p>}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" style={{ height: 'var(--visual-height, 100dvh)' }}>
          <div className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(var(--visual-height, 100dvh) - 2rem)' }}>
            <div className="shrink-0 px-5 py-3.5 border-b border-gray-100">
              <h3 className="font-black text-gray-800">تعديل رصيد المستخدم</h3>
              <p className="text-xs text-gray-400 mt-0.5">{selected.full_name || selected.phone || selected.id}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">الرصيد الحالي</p>
                <p className="text-2xl font-black text-gray-800">{Number(wallets[selected.id]?.balance || 0).toLocaleString()} ر.ي</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">المبلغ (موجب = إضافة، سالب = خصم)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثال: 5000 أو -2000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">السبب (مطلوب)</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="مثال: تعديل خطأ في الإيداع"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setAmount(''); setReason('') }} disabled={busy}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center gap-1.5">
                  <ArrowUpCircle size={16} /> إضافة (+)
                </button>
                <button onClick={() => { setAmount(amount || '0'); setReason(reason) }} disabled={busy}
                  className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-sm flex items-center justify-center gap-1.5">
                  <ArrowDownCircle size={16} /> خصم (-)
                </button>
              </div>
            </div>
            <div className="shrink-0 border-t border-gray-100 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">إلغاء</button>
              <button onClick={adjust} disabled={busy}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 shadow-lg shadow-blue-200">
                <Save size={18} /> {busy ? 'جاري...' : 'تأكيد'}
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
