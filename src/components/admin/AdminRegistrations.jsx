import { useState, useEffect } from 'react'
import { Loader as Loader2, UserPlus, Check, X, Clock, User, Phone, Calendar, CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminRegistrations() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('pending')

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setRows(data || [])
    } catch { flash('تعذّر تحميل الطلبات') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = rows.filter((r) => filter === 'all' ? true : r.status === filter)

  const approve = async (row) => {
    if (busy) return
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('approve_registration', {
        p_request_id: row.id,
        p_action: 'approved',
      })
      if (error) throw error
      flash('تم اعتماد الطلب وإنشاء الحساب ✓')
      load()
    } catch (e) { flash(e.message || 'تعذّر الاعتماد') }
    finally { setBusy(false) }
  }

  const reject = async (row) => {
    if (busy) return
    const reason = prompt('سبب الرفض (اختياري):') || ''
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('approve_registration', {
        p_request_id: row.id,
        p_action: 'rejected',
        p_rejection_reason: reason,
      })
      if (error) throw error
      flash('تم رفض الطلب')
      load()
    } catch (e) { flash(e.message || 'تعذّر الرفض') }
    finally { setBusy(false) }
  }

  const STATUS = {
    pending: { label: 'قيد المراجعة', color: 'bg-amber-50 text-amber-600', icon: Clock },
    approved: { label: 'معتمد', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
    rejected: { label: 'مرفوض', color: 'bg-rose-50 text-rose-500', icon: XCircle },
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 w-fit">
        {[
          { k: 'pending', t: 'قيد المراجعة' },
          { k: 'approved', t: 'معتمد' },
          { k: 'rejected', t: 'مرفوض' },
          { k: 'all', t: 'الكل' },
        ].map((o) => (
          <button key={o.k} onClick={() => setFilter(o.k)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors ${filter === o.k ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
            {o.t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <UserPlus size={26} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-500">لا توجد طلبات {filter !== 'all' ? STATUS[filter]?.label : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => {
            const st = STATUS[row.status] || STATUS.pending
            const StIcon = st.icon
            return (
              <div key={row.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><User size={17} className="text-blue-600" /></div>
                    <div>
                      <p className="font-black text-gray-800 text-sm">{row.full_name}</p>
                      <p className="text-[10px] text-gray-400" dir="ltr">{row.phone}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${st.color}`}>
                    <StIcon size={12} /> {st.label}
                  </span>
                </div>

                <div className="text-xs text-gray-500 space-y-0.5 bg-gray-50 rounded-lg p-2.5">
                  {row.device_info && <p className="truncate">الجهاز: <span className="text-gray-400">{row.device_info.slice(0, 60)}</span></p>}
                  {row.ip_address && <p>IP: <span className="text-gray-400" dir="ltr">{row.ip_address}</span></p>}
                  <p className="flex items-center gap-1"><Calendar size={11} /> {new Date(row.created_at).toLocaleString('ar')}</p>
                  {row.rejection_reason && <p className="text-rose-500">سبب الرفض: {row.rejection_reason}</p>}
                </div>

                {row.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => approve(row)} disabled={busy}
                      className="flex-1 bg-emerald-500 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm active:scale-95 transition-transform disabled:opacity-50 shadow-sm shadow-emerald-200">
                      <Check size={16} /> اعتماد
                    </button>
                    <button onClick={() => reject(row)} disabled={busy}
                      className="flex-1 bg-rose-500 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm active:scale-95 transition-transform disabled:opacity-50 shadow-sm shadow-rose-200">
                      <X size={16} /> رفض
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg">{toast}</div>
      )}
    </div>
  )
}
