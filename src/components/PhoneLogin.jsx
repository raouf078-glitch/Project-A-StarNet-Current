import { useState, useEffect } from 'react'
import { Phone, Loader as Loader2, ShieldCheck, KeyRound } from 'lucide-react'
import { auth } from '../lib/auth'

// Phone OTP login screen — matches StarNET's blue/clean design language
export default function PhoneLogin({ onSuccess }) {
  const [step, setStep] = useState('phone') // phone | otp
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const formatPhone = (raw) => {
    let digits = raw.replace(/\D/g, '')
    if (digits.startsWith('0')) digits = digits.slice(1)
    if (!digits.startsWith('967') && digits.length > 0) digits = '967' + digits
    return '+' + digits
  }

  const sendOtp = async () => {
    if (busy) return
    setError('')
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 9) { setError('أدخل رقم هاتف صحيح'); return }

    setBusy(true)
    try {
      await auth.sendOtp(formatPhone(phone))
      setStep('otp')
    } catch (e) {
      setError(e.message || 'تعذّر إرسال رمز التحقق')
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async () => {
    if (busy) return
    setError('')
    if (otp.length < 6) { setError('أدخل رمز التحقق المكوّن من 6 أرقام'); return }

    setBusy(true)
    try {
      await auth.verifyOtp(formatPhone(phone), otp)
      onSuccess?.()
    } catch (e) {
      setError(e.message || 'رمز التحقق غير صحيح')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center shadow-sm">
            <ShieldCheck size={38} className="text-blue-600" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-gray-800">تسجيل الدخول</h1>
            <p className="text-sm text-gray-400 mt-1">سجّل دخولك برقم هاتفك للوصول إلى المحفظة والمتجر</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <p className="text-xs text-red-600 text-center">{error}</p>
          </div>
        )}

        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">رقم الهاتف</label>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 transition-colors">
                <Phone size={18} className="text-gray-400 shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="7XXXXXXXX"
                  dir="ltr"
                  className="flex-1 text-sm text-gray-700 outline-none bg-transparent text-left"
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                />
                <span className="text-xs text-gray-400 font-semibold">+967</span>
              </div>
            </div>

            <button
              onClick={sendOtp}
              disabled={busy}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {busy ? <><Loader2 size={18} className="animate-spin" /> جاري الإرسال...</> : 'إرسال رمز التحقق'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">رمز التحقق</label>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 transition-colors">
                <KeyRound size={18} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  dir="ltr"
                  className="flex-1 text-lg font-black tracking-widest text-gray-700 outline-none bg-transparent text-center"
                  onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 text-center">أُرسل رمز التحقق إلى {formatPhone(phone)}</p>
            </div>

            <button
              onClick={verifyOtp}
              disabled={busy}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {busy ? <><Loader2 size={18} className="animate-spin" /> جاري التحقق...</> : 'تأكيد وتسجيل الدخول'}
            </button>

            <button
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              className="w-full text-sm text-gray-500 font-semibold py-2"
            >
              تغيير رقم الهاتف
            </button>
          </div>
        )}

        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-4">
          بتسجيل دخولك فإنك توافق على شروط استخدام شبكة ستار نت. لا نشارك رقمك مع أي طرف ثالث.
        </p>
      </div>
    </div>
  )
}
