import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, CreditCard, Calendar, Trash2, LogIn, Copy, Check, Search, Tag, Repeat, X, Pencil, Bell, BellRing, BellOff, AlarmClock, Clock } from 'lucide-react'
import { getRecentCodes, deleteRecentCode, updateCodeNote, updateCodeExpiry, loginToHotspot, LOGO_URL, NETWORK_NAME } from '../netConfig'
import PageHeader from '../components/PageHeader'
import { push } from '../lib/push'
import { format } from 'date-fns'

// خيارات مدة الكرت (بالأيام)
const DURATION_PRESETS = [
  { label: 'يوم', days: 1 },
  { label: 'أسبوع', days: 7 },
  { label: '15 يوم', days: 15 },
  { label: 'شهر', days: 30 },
]

// متى يُرسل التذكير قبل الانتهاء (بالساعات)
const LEAD_PRESETS = [
  { label: 'قبل يوم', hours: 24 },
  { label: 'قبل 12 ساعة', hours: 12 },
  { label: 'قبل 6 ساعات', hours: 6 },
  { label: 'قبل 3 ساعات', hours: 3 },
]

export default function MyCards() {
  const navigate = useNavigate()
  const [codes, setCodes] = useState([])
  const [copied, setCopied] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // { code, note }
  const [reminder, setReminder] = useState(null) // { code, days, leadHours }
  const [savingReminder, setSavingReminder] = useState(false)
  const [reminderMsg, setReminderMsg] = useState('')

  useEffect(() => { setCodes(getRecentCodes()) }, [])

  const confirmDelete = () => {
    if (!pendingDelete) return
    const entry = codes.find(c => c.code === pendingDelete)
    if (entry?.reminderId) push.cancelSchedule(entry.reminderId).catch(() => {})
    const list = deleteRecentCode(pendingDelete)
    setCodes(list)
    setPendingDelete(null)
  }

  const copyOne = async (code) => {
    try { await navigator.clipboard.writeText(code) } catch {}
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
  }

  const saveNote = () => {
    if (!editing) return
    const list = updateCodeNote(editing.code, editing.note)
    setCodes(list)
    setEditing(null)
  }

  const fmt = (d) => { try { return format(new Date(d), 'dd/MM/yyyy hh:mm a') } catch { return d } }
  const fmtDate = (d) => { try { return format(new Date(d), 'dd/MM/yyyy hh:mm a') } catch { return d } }

  // حساب الأيام المتبقية حتى انتهاء الكرت
  const daysLeft = (expiry) => {
    if (!expiry) return null
    const ms = new Date(expiry).getTime() - Date.now()
    return ms / (1000 * 60 * 60 * 24)
  }

  const openReminder = (entry) => {
    setReminderMsg('')
    setReminder({ code: entry.code, days: 30, leadHours: 24 })
  }

  // حفظ التذكير: يضبط تاريخ الانتهاء ويجدول إشعاراً حقيقياً قبله
  const saveReminder = async () => {
    if (!reminder) return
    setSavingReminder(true)
    setReminderMsg('')
    try {
      const d = push.diagnose()
      if (!d.canSchedule) {
        setReminderMsg(d.hint || 'فعّل الإشعارات بعد تثبيت التطبيق على الشاشة الرئيسية.')
        setSavingReminder(false)
        return
      }
      const perm = await push.requestPermission()
      if (perm !== 'granted') {
        setReminderMsg('لم يتم السماح بالإشعارات. فعّلها من إعدادات المتصفح ثم حاول مجدداً.')
        setSavingReminder(false)
        return
      }
      await push.subscribe()

      const expiryDate = new Date(Date.now() + reminder.days * 24 * 60 * 60 * 1000)
      const fireAt = new Date(expiryDate.getTime() - reminder.leadHours * 60 * 60 * 1000)

      // إلغاء أي تذكير سابق لنفس الكرت
      const existing = codes.find(c => c.code === reminder.code)
      if (existing?.reminderId) await push.cancelSchedule(existing.reminderId).catch(() => {})

      if (fireAt <= new Date()) {
        setReminderMsg('المدة قصيرة جداً على وقت التذكير المختار. اختر مدة أطول أو تذكيراً أقرب من الانتهاء.')
        setSavingReminder(false)
        return
      }

      const label = existing?.note ? `(${existing.note}) ` : ''
      const { id } = await push.schedule({
        at: fireAt,
        title: `⏳ كرت ${NETWORK_NAME} قارب على الانتهاء`,
        body: `كرتك ${label}سينتهي قريباً — جدّد اشتراكك لتبقى متصلاً.`,
        url: '/cards',
      })

      const list = updateCodeExpiry(reminder.code, { expiry: expiryDate.toISOString(), reminderId: id })
      setCodes(list)
      setReminder(null)
    } catch (e) {
      setReminderMsg('تعذّر ضبط التذكير. تأكد من تثبيت التطبيق وتفعيل الإشعارات ثم حاول مجدداً.')
    } finally {
      setSavingReminder(false)
    }
  }

  // إلغاء التذكير والصلاحية لكرت
  const clearReminder = async (entry) => {
    if (entry?.reminderId) await push.cancelSchedule(entry.reminderId).catch(() => {})
    const list = updateCodeExpiry(entry.code, { expiry: null, reminderId: null })
    setCodes(list)
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? codes.filter(h => h.code.toLowerCase().includes(q) || (h.note || '').toLowerCase().includes(q))
    : codes

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Header */}
      <PageHeader icon={History} title="سجل الكروت" subtitle="الكروت المستخدمة على هذا الجهاز" back />

      {codes.length === 0 ? (
        <div className="flex flex-col items-center py-20 px-8 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <History size={36} className="text-blue-300" />
          </div>
          <h2 className="text-xl font-black text-gray-700 mb-2">لا توجد كروت بعد</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">الكروت التي تستخدمها للدخول ستظهر هنا تلقائياً على هذا الجهاز</p>
          <button onClick={() => navigate('/activate')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl active:scale-95 transition-transform">
            الدخول بالبطاقة
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          {/* Summary + Search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white rounded-2xl border border-blue-100 shadow-sm flex items-center gap-2 px-3 py-2.5">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالكود أو الملاحظة..."
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="shrink-0 text-gray-400 active:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="bg-blue-600 text-white rounded-2xl px-3 py-2.5 text-center shadow-sm shrink-0">
              <p className="text-[10px] leading-none opacity-80">الإجمالي</p>
              <p className="font-black text-base leading-tight">{codes.length}</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400 text-center">
              <Search size={40} className="opacity-30 mb-2" />
              <p className="text-sm font-semibold">لا توجد نتائج مطابقة</p>
            </div>
          ) : filtered.map((h, i) => {
            const dl = daysLeft(h.expiry)
            const expired = dl !== null && dl <= 0
            const soon = dl !== null && dl > 0 && dl <= 2
            return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
              <div className={`h-1 bg-gradient-to-l ${expired ? 'from-red-500 to-orange-400' : soon ? 'from-amber-500 to-yellow-400' : 'from-blue-500 to-cyan-400'}`} />
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <CreditCard size={20} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Note / label row */}
                  <button
                    onClick={() => setEditing({ code: h.code, note: h.note || '' })}
                    className="flex items-center gap-1 text-right active:opacity-70"
                  >
                    {h.note ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <Tag size={11} /> {h.note}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <Pencil size={11} /> أضف ملاحظة / تسمية
                      </span>
                    )}
                  </button>
                  <p className="font-mono font-bold text-gray-800 text-sm truncate mt-0.5" dir="ltr">{h.code}</p>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400 mt-0.5">
                    {h.date && (
                      <span className="flex items-center gap-1"><Calendar size={11} /> آخر استخدام {fmt(h.date)}</span>
                    )}
                    {h.uses > 1 && (
                      <span className="flex items-center gap-1 text-blue-500 font-bold"><Repeat size={11} /> {h.uses} مرات</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expiry / reminder strip */}
              <div className="px-4 pb-3 -mt-1">
                {h.expiry ? (
                  <div className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${expired ? 'bg-red-50' : soon ? 'bg-amber-50' : 'bg-blue-50'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {expired ? <BellOff size={15} className="text-red-500 shrink-0" /> : <BellRing size={15} className={soon ? 'text-amber-500 shrink-0' : 'text-blue-500 shrink-0'} />}
                      <div className="min-w-0">
                        <p className={`text-xs font-bold leading-tight ${expired ? 'text-red-600' : soon ? 'text-amber-700' : 'text-blue-700'}`}>
                          {expired ? 'انتهت صلاحية الكرت' : dl < 1 ? 'ينتهي خلال أقل من يوم' : `يتبقى ${Math.ceil(dl)} يوم`}
                        </p>
                        <p className="text-[10px] text-gray-400 leading-tight flex items-center gap-1 mt-0.5">
                          <Clock size={9} /> ينتهي {fmtDate(h.expiry)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearReminder(h)}
                      className="shrink-0 text-[11px] font-bold text-gray-400 active:text-gray-600 px-1"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openReminder(h)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-200 py-2 text-blue-500 text-xs font-bold active:bg-blue-50 transition-colors"
                  >
                    <Bell size={13} /> أضف تذكيراً قبل انتهاء الكرت
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex border-t border-gray-50">
                <button
                  onClick={() => loginToHotspot({ username: h.code, recordCode: true })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-blue-600 text-sm font-bold active:bg-blue-50 transition-colors"
                >
                  <LogIn size={15} /> دخول
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => copyOne(h.code)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-gray-600 text-sm font-bold active:bg-gray-50 transition-colors"
                >
                  {copied === h.code ? <><Check size={15} className="text-green-500" /> تم النسخ</> : <><Copy size={15} /> نسخ</>}
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => setPendingDelete(h.code)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-red-500 text-sm font-bold active:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} /> حذف
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Note edit modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-6"
          style={{ height: 'var(--visual-height, 100dvh)' }}
          onClick={() => setEditing(null)}
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag size={24} className="text-indigo-500" />
            </div>
            <h2 className="text-lg font-black text-gray-800 mb-1 text-center">تسمية الكرت</h2>
            <p className="text-xs text-gray-400 text-center mb-4">مثال: كرت المنزل، كرت العمل، كرت الضيوف</p>
            <input
              value={editing.note}
              onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              maxLength={60}
              autoFocus
              placeholder="اكتب الملاحظة هنا"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-300 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold active:scale-95 transition-transform"
              >
                إلغاء
              </button>
              <button
                onClick={saveNote}
                className="flex-1 py-3 rounded-2xl bg-indigo-500 text-white font-bold active:scale-95 transition-transform"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder modal */}
      {reminder && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center"
          style={{ height: 'var(--visual-height, 100dvh)' }}
          onClick={() => !savingReminder && setReminder(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 overflow-y-auto"
            style={{ maxHeight: 'calc(var(--visual-height, 100dvh) - 2rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlarmClock size={26} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-black text-gray-800 mb-1 text-center">تذكير قبل انتهاء الكرت</h2>
            <p className="text-xs text-gray-400 text-center mb-5 leading-relaxed">
              حدّد كم تدوم صلاحية هذا الكرت، وسنرسل لك إشعاراً قبل انتهائه — حتى والتطبيق مغلق.
            </p>

            {/* Duration */}
            <p className="text-xs font-bold text-gray-600 mb-2">مدة صلاحية الكرت</p>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setReminder({ ...reminder, days: p.days })}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${reminder.days === p.days ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs text-gray-400">أو عدد أيام مخصص:</span>
              <input
                type="number"
                min={1}
                max={365}
                value={reminder.days}
                onChange={(e) => setReminder({ ...reminder, days: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })}
                className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-center text-gray-700 outline-none focus:border-blue-300"
              />
              <span className="text-xs text-gray-400">يوم</span>
            </div>

            {/* Lead time */}
            <p className="text-xs font-bold text-gray-600 mb-2">متى يصلك التذكير؟</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {LEAD_PRESETS.map((p) => (
                <button
                  key={p.hours}
                  onClick={() => setReminder({ ...reminder, leadHours: p.hours })}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${reminder.leadHours === p.hours ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {reminderMsg && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
                <p className="text-xs text-amber-700 leading-relaxed text-center">{reminderMsg}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setReminder(null)}
                disabled={savingReminder}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold active:scale-95 transition-transform disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={saveReminder}
                disabled={savingReminder}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingReminder ? 'جاري الحفظ...' : <><Bell size={16} /> تفعيل التذكير</>}
              </button>
            </div>
            <p className="text-[10px] text-gray-300 text-center mt-3 leading-relaxed">
              يتطلب تثبيت التطبيق على الشاشة الرئيسية وتفعيل الإشعارات. لا يعمل داخل معاينة الاستوديو.
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-6"
          style={{ height: 'var(--visual-height, 100dvh)' }}
          onClick={() => setPendingDelete(null)}
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={26} className="text-red-500" />
            </div>
            <h2 className="text-lg font-black text-gray-800 mb-2">هل أنت متأكد من حذف هذا الكرت؟</h2>
            <p className="font-mono text-sm text-gray-400 mb-6" dir="ltr">{pendingDelete}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold active:scale-95 transition-transform"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold active:scale-95 transition-transform"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
