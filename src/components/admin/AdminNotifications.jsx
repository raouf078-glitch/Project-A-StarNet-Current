import { useState, useEffect } from 'react'
import { Loader as Loader2, Bell, Send, Megaphone } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminNotifications() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [toast, setToast] = useState('')

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, uid, title, body, type, read, created_at')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      setRows(data || [])
    } catch { flash('تعذّر تحميل الإشعارات') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const broadcast = async () => {
    if (busy) return
    if (!title.trim()) { flash('العنوان مطلوب'); return }
    if (!body.trim()) { flash('النص مطلوب'); return }

    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('broadcast_notification', {
        p_title: title.trim(),
        p_body: body.trim(),
        p_type: 'announcement',
      })
      if (error) throw error
      flash(`تم إرسال الإشعار إلى ${data?.recipients ?? 'كل'} مستخدم ✓`)
      setTitle('')
      setBody('')
      load()
    } catch (e) { flash(e.message || 'تعذّر الإرسال') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      {/* Broadcast composer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-rose-600" />
          <p className="text-xs font-bold text-gray-600">إرسال إشعار جماعي لكل المستخدمين</p>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1.5 block">العنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الإشعار"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1.5 block">النص</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="نص الإشعار"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none leading-relaxed" />
        </div>
        <button onClick={broadcast} disabled={busy}
          className="w-full bg-rose-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 shadow-lg shadow-rose-200">
          {busy ? <><Loader2 size={18} className="animate-spin" /> جاري الإرسال...</> : <><Send size={18} /> إرسال للجميع</>}
        </button>
      </div>

      {/* Recent notifications log */}
      <div>
        <p className="text-xs font-bold text-gray-600 mb-2">آخر الإشعارات المرسلة</p>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <Bell size={26} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-500">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {rows.map((n) => (
              <div key={n.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell size={15} className="text-rose-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-gray-300 mt-1">{new Date(n.created_at).toLocaleString('ar')}</p>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${n.read ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
                  {n.read ? 'مقروء' : 'جديد'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg">{toast}</div>
      )}
    </div>
  )
}
