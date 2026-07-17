import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone, MessageCircle, Wifi, Save, CheckCircle2, Info, Radar,
  Send, Facebook, Globe, ExternalLink, Sun, Moon, Users, Cog, Bot, ChevronLeft,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getTheme, setTheme } from '../theme'
import {
  getGateway, setGateway, DEFAULT_GATEWAY, detectGateway, isAllowedGateway, ALLOWED_GATEWAYS,
  SUPPORT_PHONE, SUPPORT_WA, SOCIAL, NETWORK_NAME, DEV_NAME, DEV_WA, LOGO_URL,
} from '../netConfig'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [gw, setGw] = useState(getGateway())
  const [dark, setDark] = useState(getTheme() === 'dark')
  const [saved, setSaved] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectMsg, setDetectMsg] = useState(null)
  const [gwError, setGwError] = useState('')

  const save = () => {
    if (!isAllowedGateway(gw)) {
      setGwError('عنوان البوابة غير صحيح، يرجى استخدام بوابة شبكة ستار نت فقط. هذا التطبيق مخصص لشبكة ستار نت فقط.')
      setSaved(false)
      return
    }
    setGwError('')
    const clean = setGateway(gw)
    setGw(clean)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const autoDetect = async () => {
    setDetecting(true)
    setDetectMsg(null)
    const found = await detectGateway()
    setDetecting(false)
    if (found) {
      setGw(found)
      setDetectMsg({ ok: true, text: `تم العثور على البوابة: ${found}` })
    } else {
      setDetectMsg({ ok: false, text: 'تعذّر الكشف التلقائي. أدخل عنوان البوابة يدوياً.' })
    }
  }

  const socialItems = [
    { icon: MessageCircle, label: 'واتساب', href: SOCIAL.whatsapp, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Users, label: 'مجتمع شبكة ستار نت', href: 'https://chat.whatsapp.com/FucljYJwl6248q04xpIkeS', color: 'text-emerald-600 bg-emerald-50' },
    { icon: Facebook, label: 'فيسبوك', href: 'https://www.facebook.com/StarNet.cafe/', color: 'text-blue-600 bg-blue-50' },
  ]

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Header */}
      <PageHeader icon={Cog} title="الإعدادات" subtitle="مظهر التطبيق وبوابة الشبكة" back />

      <div className="px-4 py-4 space-y-3">
        {/* Theme toggle */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="font-bold text-gray-700 flex items-center gap-2">{dark ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />} مظهر التطبيق</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setDark(setTheme('light') === 'dark')}
              className={`flex flex-col items-center gap-1.5 rounded-2xl py-4 transition-all active:scale-95 border-2 ${!dark ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50'}`}
            >
              <Sun size={22} className={!dark ? 'text-amber-500' : 'text-gray-400'} />
              <span className={`text-sm font-bold ${!dark ? 'text-blue-600' : 'text-gray-500'}`}>نهاري</span>
            </button>
            <button
              onClick={() => setDark(setTheme('dark') === 'dark')}
              className={`flex flex-col items-center gap-1.5 rounded-2xl py-4 transition-all active:scale-95 border-2 ${dark ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50'}`}
            >
              <Moon size={22} className={dark ? 'text-indigo-400' : 'text-gray-400'} />
              <span className={`text-sm font-bold ${dark ? 'text-blue-600' : 'text-gray-500'}`}>ليلي</span>
            </button>
          </div>
        </div>

        {/* Gateway config */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="font-bold text-gray-700 flex items-center gap-2"><Wifi size={16} className="text-blue-500" /> بوابة الشبكة (Gateway)</span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-400 leading-relaxed">
              عنوان بوابة شبكة المايكروتيك. يُستخدم لبناء رابط تسجيل الدخول. جرّب الكشف التلقائي أو أدخله يدوياً.
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              البوابات المسموح بها: <span dir="ltr" className="font-mono text-gray-500">{ALLOWED_GATEWAYS.join(' · ')}</span>
            </p>
            <button
              onClick={autoDetect}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 bg-cyan-50 text-cyan-700 font-bold py-2.5 rounded-2xl active:scale-95 transition-all disabled:opacity-60"
            >
              {detecting
                ? <><div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /> جاري الكشف...</>
                : <><Radar size={18} /> كشف البوابة تلقائياً</>}
            </button>
            {detectMsg && (
              <p className={`text-xs font-semibold text-center ${detectMsg.ok ? 'text-green-600' : 'text-orange-500'}`}>{detectMsg.text}</p>
            )}
            <input
              value={gw}
              onChange={e => { setGw(e.target.value); setSaved(false); setGwError('') }}
              placeholder={DEFAULT_GATEWAY}
              className={`w-full bg-gray-50 border rounded-2xl px-4 py-3 text-center text-base font-bold tracking-wide focus:outline-none ${gwError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
              dir="ltr"
            />
            {gwError && (
              <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3">
                <Info size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-600 font-semibold leading-relaxed">{gwError}</p>
              </div>
            )}
            <button
              onClick={save}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-2xl active:scale-95 transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}
            >
              {saved ? <><CheckCircle2 size={18} /> تم الحفظ</> : <><Save size={18} /> حفظ</>}
            </button>
            <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
              <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                رابط الدخول الذي سيُنشأ: <span dir="ltr" className="font-mono">http://{gw || DEFAULT_GATEWAY}/login?username=...</span>
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="font-bold text-gray-700 flex items-center gap-2"><Phone size={16} className="text-green-500" /> اتصل بنا</span>
          </div>
          <div className="p-3 space-y-2">
            <a href={`tel:+${SUPPORT_WA}`} className="flex items-center gap-3 bg-green-50 rounded-xl p-3 active:scale-95 transition-transform">
              <Phone size={18} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-400">اتصال مباشر</p>
                <p className="font-bold text-gray-700 text-sm" dir="ltr">{SUPPORT_PHONE}</p>
              </div>
            </a>
            <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-emerald-50 rounded-xl p-3 active:scale-95 transition-transform">
              <MessageCircle size={18} className="text-emerald-600" />
              <div>
                <p className="text-xs text-gray-400">واتساب</p>
                <p className="font-bold text-gray-700 text-sm" dir="ltr">{SUPPORT_PHONE}</p>
              </div>
            </a>
          </div>
        </div>

        {/* Social links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="font-bold text-gray-700 flex items-center gap-2"><Globe size={16} className="text-blue-500" /> تابعنا</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {socialItems.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl p-3 active:scale-95 transition-transform border border-gray-100">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><s.icon size={17} /></div>
                <span className="text-sm font-bold text-gray-700 flex-1">{s.label}</span>
                <ExternalLink size={13} className="text-gray-300" />
              </a>
            ))}
          </div>
        </div>

        {/* مدخل لوحة إدارة المساعد — الوصول محمي لصاحب التطبيق فقط */}
        <button
          onClick={() => navigate('/admin')}
          className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform text-right"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Bot size={19} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-700 text-sm">لوحة إدارة المساعد</p>
            <p className="text-[11px] text-gray-400">مخصّصة لصاحب التطبيق</p>
          </div>
          <ChevronLeft size={18} className="text-gray-300 shrink-0" />
        </button>

        {/* App info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">إصدار التطبيق</span>
            <span className="font-bold text-gray-700">4.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">الشبكة</span>
            <span className="font-bold text-blue-600">{NETWORK_NAME}</span>
          </div>
        </div>

        {/* Footer — copyright + developer */}
        <div className="text-center pt-2 pb-2 space-y-1.5">
          <p className="text-sm font-bold text-gray-800">© 2026 جميع الحقوق محفوظة - شبكة ستار نت</p>
          <p className="text-sm font-medium text-gray-700">
            تصميم وتطوير التطبيق:{' '}
            <a
              href={`https://wa.me/${DEV_WA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-bold underline underline-offset-2 active:opacity-70"
            >
              {DEV_NAME}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
