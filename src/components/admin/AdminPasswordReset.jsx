import { useState, useEffect } from 'react'
import { Loader as Loader2, KeyRound, Search, Mail, Lock, Eye, EyeOff, Check, User, CircleAlert as AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminPasswordReset() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [newPwd, setNewPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, phone, full_name, role')
        .neq('role', 'admin')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setUsers(data || [])
    } catch { flash('تعذّر تحميل المستخدمين') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (u.full_name || '').toLowerCase().includes(q) || (u.phone || '').includes(q)
  })

  const reset = async () => {
    if (busy || !selected) return
    if (newPwd.length < 6) { flash('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    setBusy(true)
    try {
      const { data: authData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', selected.id)
        .maybeSingle()

      const { data: userRow } = await supabase
        .rpc('admin_reset_user_password', {
          p_user_email: selected.email || `user_${(selected.phone || '').replace(/\D/g, '')}@starnet.local`,
          p_new_password: newPwd,
        })

      if (userRow?.success) {
        flash('تم تغيير كلمة المرور بنجاح')
        setSelected(null)
        setNewPwd('')
      } else {
        flash('تعذّر تغيير كلمة المرور')
      }
    } catch (e) {
      flash(e.message || 'تعذّر تغيير كلمة المرور')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
  }

  return (
    <div className="space-y-3">
      {!selected && (
        <>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم..."
              className="flex-1 text-sm outline-none bg-transparent text-gray-700"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <User size={26} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-500">لا يوجد مستخدمون بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform text-right"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-sm truncate">{u.full_name}</p>
                    <p className="text-[11px] text-gray-400" dir="ltr">{u.phone}</p>
                  </div>
                  <KeyRound size={16} className="text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <User size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="font-black text-gray-800">{selected.full_name}</p>
                <p className="text-xs text-gray-400" dir="ltr">{selected.phone}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2 mb-4">
              <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                سيتم تغيير كلمة مرور هذا المستخدم فقط. لن تتأثر المحفظة، المشتريات، المكافآت، الإيداعات أو أي بيانات مالية.
              </p>
            </div>

            <label className="text-xs font-bold text-gray-600 mb-1 block">كلمة المرور الجديدة</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-blue-400 transition-colors">
              <Lock size={16} className="text-gray-400 shrink-0" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="••••••"
                dir="ltr"
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent text-left"
              />
              <button onClick={() => setShowPwd(!showPwd)} className="text-gray-400 shrink-0">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={reset}
                disabled={busy || newPwd.length < 6}
                className="flex-1 bg-blue-600 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm active:scale-95 transition-transform disabled:opacity-50 shadow-sm shadow-blue-200"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> تغيير كلمة المرور</>}
              </button>
              <button
                onClick={() => { setSelected(null); setNewPwd('') }}
                className="px-4 bg-gray-100 text-gray-500 font-bold rounded-xl py-2.5 text-sm active:scale-95 transition-transform"
              >
                إلغاء
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
