import { useState, useEffect } from 'react'
import { Phone, Lock, Eye, EyeOff, Loader as Loader2, ShieldCheck, Clock, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react'
import { auth } from '../lib/auth'

export default function NewLoginScreen({ onSuccess, onGoRegister }) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [statusPage, setStatusPage] = useState(null) // null | 'pending' | 'rejected' | 'notfound'

  const formatPhone = (raw) => {
    let digits = raw.replace(/\D/g, '')
    if (digits.startsWith('0')) digits = digits.slice(1)
    if (!digits.startsWith('967') && digits.length > 0) digits = '967' + digits
    return '+' + digits
  }

  const login = async () => {
    if (busy) return
    setError('')
    setStatusPage(null)

    const clean = phone.replace(/\D/g, '')
    if (clean.length < 9) { setError('أدخل رقم هاتف صحيح'); return }
    if (password.length < 6) { setError('أدخل كلمة المرور'); return }

    setBusy(true)
    try {
      const formattedPhone = formatPhone(phone)

      // Try to sign in
      try {
        await auth.signInWithPhone(formattedPhone, password)
        onSuccess?.()
        return
      } catch (signInErr) {
        // If sign-in fails, check registration status
        const status = await auth.checkRegistrationStatus(formattedPhone)

        if (!status) {
          setStatusPage('notfound')
          return
        }

        if (status.status === 'pending') {
          setStatusPage('pending')
          return
        }

        if (status.status === 'rejected') {
          setStatusPage('rejected')
          return
        }

        if (status.status === 'approved') {
          // Approved but sign-in failed → wrong password
          setError('كلمة المرور غير صحيحة')
          return
        }

        setError('تعذّر تسجيل الدخول')
      }
    } catch (e) {
      setError(e.message || 'تعذّر تسجيل الدخول')
    } finally {
      setBusy(false)
    }
  }

  if (statusPage === 'pending') {
    return (
      <StatusPage
        icon={<Clock size={38} className="text-amber-500" />}
        bg="bg-amber-50"
        title="🟡 طلبك قيد المراجعة"
        body="تم استلام طلب التسجيل بنجاح. يجري الآن مراجعة بياناتك من قبل إدارة شبكة StarNET. سيتم إشعارك فور اعتماد الحساب."
        onBack={() => setStatusPage(null)}
      />
    )
  }

  if (statusPage === 'rejected') {
    return (
      <StatusPage
        icon={<XCircle size={38} className="text-rose-500" />}
        bg="bg-rose-50"
        title="تم رفض الطلب"
        body="تم رفض طلب التسجيل. يرجى مراجعة البيانات أو التواصل مع الإدارة."
        onBack={() => setStatusPage(null)}
      />
    )
  }

  if (statusPage === 'notfound') {
    return (
      <StatusPage
        icon={<AlertCircle size={38} className="text-blue-500" />}
        bg="bg-blue-50"
        title="لا يوجد حساب بهذا الرقم"
        body="لم نجد طلب تسجيل بهذا الرقم. يرجى التسجيل أولاً."
        onBack={() => setStatusPage(null)}
        onRegister={onGoRegister}
      />
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center shadow-sm">
            <ShieldCheck size={38} className="text-blue-600" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-gray-800">تسجيل الدخول</h1>
            <p className="text-sm text-gray-400 mt-1">سجّل دخولك للوصول إلى المحفظة والمتجر</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <p className="text-xs text-red-600 text-center">{error}</p>
          </div>
        )}

        <div className="space-y-4">
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
                onKeyDown={e => e.key === 'Enter' && login()}
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
                onKeyDown={e => e.key === 'Enter' && login()}
              />
              <button onClick={() => setShowPwd(!showPwd)} className="text-gray-400 shrink-0">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={login}
            disabled={busy}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-blue-200"
          >
            {busy ? <><Loader2 size={18} className="animate-spin" /> جاري التحقق...</> : 'تسجيل الدخول'}
          </button>

          <button onClick={onGoRegister} className="w-full text-sm text-gray-500 font-semibold py-2">
            ليس لديك حساب؟ سجّل الآن
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusPage({ icon, bg, title, body, onBack, onRegister }) {
  return (
    <div className="min-h-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className={`w-20 h-20 rounded-3xl ${bg} flex items-center justify-center mx-auto shadow-sm`}>
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{body}</p>
        </div>
        <div className="space-y-2">
          {onRegister && (
            <button onClick={onRegister} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-blue-200">
              التسجيل الآن
            </button>
          )}
          <button onClick={onBack} className="w-full text-sm text-gray-500 font-semibold py-2">
            العودة
          </button>
        </div>
      </div>
    </div>
  )
}
