import { useState } from 'react'
import { User, Phone, Lock, Eye, EyeOff, Loader as Loader2, ShieldCheck, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 } from 'lucide-react'
import { auth } from '../lib/auth'

export default function RegistrationScreen({ onBack, onGoLogin }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const formatPhone = (raw) => {
    let digits = raw.replace(/\D/g, '')
    if (digits.startsWith('0')) digits = digits.slice(1)
    if (!digits.startsWith('967') && digits.length > 0) digits = '967' + digits
    return '+' + digits
  }

  const submit = async () => {
    if (busy) return
    setError('')

    if (!fullName.trim() || fullName.trim().length < 3) { setError('يرجى كتابة الاسم الكامل الصحيح'); return }
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 9) { setError('أدخل رقم جوال صحيح'); return }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return }

    setBusy(true)
    try {
      const device_info = navigator.userAgent
      await auth.submitRegistration({
        full_name: fullName.trim(),
        phone: formatPhone(phone),
        password,
        device_info,
      })
      setDone(true)
    } catch (e) {
      setError(e.message || 'تعذّر إرسال الطلب')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={38} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800">تم استلام طلبك</h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              تم استلام طلب التسجيل بنجاح. يجري الآن مراجعة بياناتك من قبل إدارة شبكة StarNET.
              سيتم إشعارك فور اعتماد الحساب.
            </p>
          </div>
          <button onClick={onGoLogin} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-blue-200">
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center shadow-sm">
            <ShieldCheck size={38} className="text-blue-600" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-gray-800">طلب تسجيل جديد</h1>
            <p className="text-sm text-gray-400 mt-1">أنشئ حسابك في شبكة ستار نت</p>
          </div>
        </div>

        {/* Warning notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            يرجى كتابة اسمك الحقيقي ورقم جوالك الصحيح. لن يتم قبول الأسماء المستعارة أو البيانات الوهمية.
            سيتم مراجعة الطلب يدوياً من قبل إدارة شبكة StarNET.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <p className="text-xs text-red-600 text-center">{error}</p>
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">الاسم الكامل</label>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 transition-colors">
              <User size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="الاسم الثلاثي"
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">رقم الجوال</label>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 transition-colors">
              <Phone size={18} className="text-gray-400 shrink-0" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="7XXXXXXXX"
                dir="ltr"
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent text-left"
              />
              <span className="text-xs text-gray-400 font-semibold">+967</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">كلمة المرور</label>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 transition-colors">
              <Lock size={18} className="text-gray-400 shrink-0" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                dir="ltr"
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent text-left"
              />
              <button onClick={() => setShowPwd(!showPwd)} className="text-gray-400 shrink-0">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">تأكيد كلمة المرور</label>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 transition-colors">
              <Lock size={18} className="text-gray-400 shrink-0" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••"
                dir="ltr"
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent text-left"
              />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={busy}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-blue-200"
          >
            {busy ? <><Loader2 size={18} className="animate-spin" /> جاري الإرسال...</> : 'إرسال طلب التسجيل'}
          </button>

          <button onClick={onGoLogin} className="w-full text-sm text-gray-500 font-semibold py-2">
            لديك حساب؟ سجّل الدخول
          </button>
        </div>
      </div>
    </div>
  )
}
