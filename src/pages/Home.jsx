import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wifi, WifiOff, QrCode, Keyboard, Gift, Wrench, Settings, Phone, Sun, Moon,
  Router, MessageCircle, X, LogIn, Send, Facebook, Globe, CreditCard, RotateCw,
  Shield, Zap, Headphones, Signal, Rocket, Users, Power, Info, IdCard, Trophy, MapPin,
  Star, Megaphone, Lightbulb, Tv, Wallet, ShoppingBag, ArrowLeft, Camera, History,
} from 'lucide-react'
import { useLiveShared } from '../lib/useLive'
import {
  LOGO_URL, LOGO_DAY, LOGO_NIGHT, NETWORK_NAME, SUPPORT_PHONE, SUPPORT_WA, SOCIAL,
  getGateway, getLastCode, loginToHotspot, logoutFromHotspot, checkInternet, openHotspotStatus,
  extractCardCode,
} from '../netConfig'
import { getTheme, toggleTheme } from '../theme'
import HeroSlider from '../components/HeroSlider'
import AssistantFab from '../components/AssistantFab'
import CameraGuide from '../components/CameraGuide'
import { processImageBarcode, processImageOcr } from '../lib/barcode'

const HEADER_BANNER = 'https://api.whacka.app/storage/v1/object/public/app-images/platform/chat/image/ae3a569e-c919-49ab-a00b-310b831991e6/62a40b30-c1d1-4933-b1bf-7367ce916b15.png'

export default function Home() {
  const navigate = useNavigate()
  const [showContact, setShowContact] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [feature, setFeature] = useState(null)
  const [showGuide, setShowGuide] = useState(null) // null | 'barcode' | 'ocr'
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [loginCode, setLoginCode] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const loginInputRef = useRef(null)
  // null = جاري الفحص، true = متصل، false = غير متصل
  const [online, setOnline] = useState(null)
  const [checking, setChecking] = useState(true)
  const [lastCard, setLastCard] = useState(null)
  const [dark, setDark] = useState(getTheme() === 'dark')
  const gateway = getGateway()
  const { data: announcements } = useLiveShared('announcements', { order: 'sort' })
  const activeAnnouncements = announcements.filter(a => a.active !== false)

  // فحص الوصول الفعلي للإنترنت (مو مجرد اتصال الواي‑فاي)
  const refreshStatus = async () => {
    setChecking(true)
    const ok = await checkInternet()
    setOnline(ok)
    setChecking(false)
  }

  useEffect(() => {
    setLastCard(getLastCode())
    refreshStatus()

    // أعد الفحص عند رجوع المستخدم للتطبيق (مثلاً بعد تسجيل الخروج من الهوتسبوت)
    const onVisible = () => { if (document.visibilityState === 'visible') refreshStatus() }
    const onOffline = () => { setOnline(false); setChecking(false) }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refreshStatus)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', refreshStatus)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refreshStatus)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', refreshStatus)
    }
  }, [])

  // أزرار التنقّل الثانوية (بدون تكرار لوظائف تسجيل الدخول)
  const menu = [
    // الصف الأول
    { icon: CreditCard, label: 'سجل الكروت', sub: 'الكروت المستخدمة', path: '/my-cards', color: 'bg-indigo-50 text-indigo-600' },
    { icon: IdCard, label: 'معلومات الكرت', sub: 'عرض الرصيد والصلاحية', action: 'cardInfo', color: 'bg-sky-50 text-sky-600' },
    { icon: Power, label: 'تسجيل الخروج', sub: 'إنهاء جلسة الاتصال الحالية', action: 'logout', color: 'bg-red-50 text-red-600', danger: true },
    // الصف الثاني
    { icon: Gift, label: 'العروض', sub: 'الباقات والأسعار', path: '/offers', color: 'bg-purple-50 text-purple-600' },
    { icon: Trophy, label: 'نظام النقاط', sub: 'اجمع النقاط واستبدلها', action: 'points', color: 'bg-purple-50 text-purple-600' },
    // الصف الثالث
    { icon: Tv, label: 'الاستراحة والبث', sub: 'البث المباشر والمحتوى الترفيهي', action: 'broadcast', color: 'bg-rose-50 text-rose-600' },
    { icon: Lightbulb, label: 'الإرشادات', sub: 'نصائح الاستخدام', path: '/guide', color: 'bg-yellow-50 text-yellow-600' },
    { icon: Phone, label: 'اتصل بنا', sub: 'الدعم والمساعدة', action: 'contact', color: 'bg-green-50 text-green-600' },
    // الصف الرابع
    { icon: Star, label: 'قيّم الخدمة', sub: 'رأيك يهمنا', path: '/feedback', color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Full-width hero header banner */}
      <div className="w-full page-hero pt-[env(safe-area-inset-top,0px)] shadow-lg relative overflow-hidden">
        <div className="absolute -top-8 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none animate-glow" />
        <div className="absolute -bottom-10 right-1/4 w-40 h-40 rounded-full bg-sky-300/10 blur-3xl pointer-events-none" />
        <div className="relative w-full overflow-hidden" style={{ paddingTop: '50%' }}>
          <img
            src={HEADER_BANNER}
            alt="ستار نت"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            className="absolute inset-0 w-full h-full object-cover object-top"
            style={{ objectPosition: 'center top' }}
          />
          {/* غطاء سفلي لإخفاء كلمة v2 ودمج البانر مع الخلفية */}
          <div className="absolute bottom-0 left-0 right-0 h-[14%] bg-gradient-to-t from-blue-700 to-transparent" />
        </div>
      </div>

      {/* Announcements ticker */}
      {activeAnnouncements.length > 0 && (
        <div className="bg-blue-600 text-white overflow-hidden flex items-center">
          <div className="flex items-center gap-1.5 bg-blue-700 px-3 py-2 shrink-0 z-10">
            <Megaphone size={15} />
            <span className="text-xs font-bold">إعلانات</span>
          </div>
          <div className="flex-1 overflow-hidden relative py-2">
            <div className="flex whitespace-nowrap animate-marquee">
              {[...activeAnnouncements, ...activeAnnouncements].map((a, i) => (
                <span key={i} className="text-sm font-medium px-6 inline-flex items-center gap-1.5">
                  <span>{a.emoji || '⭐'}</span> {a.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-3">
        {/* Network status card */}
        <div className="sn-card rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${checking ? 'bg-blue-50' : online ? 'bg-green-50' : 'bg-red-50'}`}>
              {checking
                ? <RotateCw size={26} className="text-blue-500 animate-spin" />
                : online
                  ? <Wifi size={28} className="text-green-500" />
                  : <WifiOff size={28} className="text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">حالة الاتصال</p>
              <p className={`font-black text-lg leading-tight ${checking ? 'text-blue-500' : online ? 'text-green-600' : 'text-red-500'}`}>
                {checking ? 'جاري التحقق...' : online ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}
              </p>
            </div>
            <button
              onClick={refreshStatus}
              disabled={checking}
              aria-label="تحديث حالة الاتصال"
              className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-50"
            >
              <RotateCw size={18} className={`text-blue-600 ${checking ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400">الشبكة</p>
              <p className="text-sm font-bold text-gray-700 truncate">{NETWORK_NAME}</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400">بوابة الشبكة</p>
              <p className="text-sm font-bold text-gray-700 truncate" dir="ltr">{gateway}</p>
            </div>
          </div>
        </div>

        {/* Login section */}
        <div>
          <h2 className="text-[1.05rem] font-[900] text-gray-800 dark:text-gray-100 mb-3">تسجيل الدخول للإنترنت</h2>
          <div className="grid grid-cols-3 gap-2">
            {/* 1 — إدخال الكود (blue) — DOM first = visual right in RTL */}
            <button
              type="button"
              onClick={() => setShowCodeInput(true)}
              className="rounded-[1.1rem] overflow-hidden flex flex-col items-center justify-center gap-2.5 py-5 px-2 min-h-[8.5rem] active:scale-95 transition-transform shadow-[0_6px_22px_rgba(0,80,200,0.28)] bg-gradient-to-br from-[#2b6fd4] to-[#1a3fa6]"
            >
              <div className="w-11 h-11 rounded-[0.7rem] bg-white/20 flex items-center justify-center flex-shrink-0">
                <Keyboard size={22} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-[800] text-[0.8rem] leading-snug">إدخال الكود</p>
                <p className="text-white/70 text-[0.58rem] leading-snug mt-0.5">اكتب كود البطاقة يدوياً</p>
              </div>
            </button>

            {/* 2 — مسح الباركود (teal) */}
            <button
              type="button"
              onClick={() => setShowGuide('barcode')}
              className="rounded-[1.1rem] overflow-hidden flex flex-col items-center justify-center gap-2.5 py-5 px-2 min-h-[8.5rem] active:scale-95 transition-transform shadow-[0_6px_22px_rgba(0,190,170,0.28)] bg-gradient-to-br from-[#2dd4bf] to-[#0d9488]"
            >
              <div className="w-11 h-11 rounded-[0.7rem] bg-white/20 flex items-center justify-center flex-shrink-0">
                <QrCode size={22} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-[800] text-[0.8rem] leading-snug">مسح الباركود</p>
                <p className="text-white/70 text-[0.58rem] leading-snug mt-0.5">امسح كود البطاقة بالكاميرا</p>
              </div>
            </button>

            {/* 3 — مسح رقم الكرت — OCR (violet) */}
            <button
              type="button"
              onClick={() => setShowGuide('ocr')}
              className="rounded-[1.1rem] overflow-hidden flex flex-col items-center justify-center gap-2.5 py-5 px-2 min-h-[8.5rem] active:scale-95 transition-transform shadow-[0_6px_22px_rgba(109,40,217,0.28)] bg-gradient-to-br from-[#7c3aed] to-[#4c1d95]"
            >
              <div className="w-11 h-11 rounded-[0.7rem] bg-white/20 flex items-center justify-center flex-shrink-0">
                <Camera size={20} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-[800] text-[0.8rem] leading-snug">مسح رقم الكرت</p>
                <p className="text-white/70 text-[0.58rem] leading-snug mt-0.5">صوّر رقم البطاقة المطبوع</p>
              </div>
            </button>
          </div>
        </div>

        {/* Last used card — quick reuse */}
        {lastCard && (
          <button
            onClick={() => loginToHotspot({ username: lastCard.code, recordCode: true })}
            className="w-full sn-card rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <RotateCw size={20} className="text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[11px] text-gray-400">آخر كرت مستخدم — إعادة الدخول</p>
              <p className="font-mono font-bold text-gray-800 text-sm truncate" dir="ltr">{lastCard.code}</p>
            </div>
            <span className="flex items-center gap-1 text-indigo-600 text-xs font-bold flex-shrink-0">
              <LogIn size={14} /> دخول
            </span>
          </button>
        )}

        {/* Secondary menu grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {menu.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.action === 'contact') setShowContact(true)
                else if (item.action === 'logout') setShowLogout(true)
                else if (item.action === 'cardInfo') openHotspotStatus()
                else if (item.action === 'points') window.open('https://starnn.shabakaty.site/auth/login', '_blank', 'noopener,noreferrer')
                else if (item.action === 'broadcast') window.location.href = 'http://3.3.3.1/restfull.html'
                else navigate(item.path)
              }}
              className={`rounded-2xl p-3 shadow-sm border flex flex-col items-center text-center gap-1.5 active:scale-95 transition-transform ${item.danger ? 'bg-red-50/70 border-red-100' : 'bg-white border-gray-100'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon size={22} />
              </div>
              <p className={`text-xs font-bold leading-tight ${item.danger ? 'text-red-600' : 'text-gray-700'}`}>{item.label}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{item.sub}</p>
            </button>
          ))}
        </div>

        {/* Hero slider */}
        <HeroSlider navigate={navigate} onContact={() => setShowContact(true)} />

        {/* Features row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              icon: Shield, label: 'اتصال آمن', color: 'text-emerald-600 bg-emerald-50', iconColor: 'text-emerald-600',
              title: 'اتصال آمن',
              desc: 'لا تشارك بيانات اشتراكك مع الآخرين، واستخدم الإنترنت فيما ينفع.',
              btn: 'الإرشادات', onClick: (nav) => nav('/guide'),
            },
            {
              icon: Zap, label: 'سرعة عالية', color: 'text-amber-600 bg-amber-50', iconColor: 'text-amber-600',
              title: 'سرعة عالية',
              desc: 'استمتع بسرعات ثابتة وأداء ممتاز للتصفح والألعاب ومشاهدة الفيديو.',
              btn: 'فحص السرعة', onClick: (nav) => nav('/tools'),
            },
            {
              icon: Headphones, label: 'دعم فني', color: 'text-blue-600 bg-blue-50', iconColor: 'text-blue-600',
              title: 'دعم فني متواصل',
              desc: 'فريق الدعم الفني جاهز لخدمتك والرد على استفساراتك ومساعدتك في حل المشاكل.',
              btn: 'تواصل الآن', onClick: () => setShowContact(true),
            },
            {
              icon: Signal, label: 'تغطية واسعة', color: 'text-purple-600 bg-purple-50', iconColor: 'text-purple-600',
              title: 'تغطية واسعة',
              desc: 'نغطي العديد من المناطق داخل سيئون والأحياء المجاورة، ونعمل باستمرار على توسيع نطاق التغطية.',
              btn: 'عرض أماكن التغطية', onClick: (nav) => nav('/coverage'),
            },
          ].map((f, i) => (
            <button
              key={i}
              onClick={() => setFeature(f)}
              className="flex flex-col items-center gap-1.5 text-center active:scale-90 transition-transform"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${f.color}`}>
                <f.icon size={20} />
              </div>
              <p className="text-[10px] font-bold text-gray-600 leading-tight">{f.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Wallet & Store quick access (appended section) ── */}
      <div className="px-4 mt-3 animate-sn-enter" style={{ animationDelay: '0.2s' }}>
        <div className="sn-card--premium p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <Wallet size={16} className="text-blue-600" />
              المحفظة والمتجر
            </h3>
            <button onClick={() => navigate('/wallet')} className="text-xs font-bold text-blue-600">
              عرض المحفظة <ArrowLeft size={10} className="inline" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => navigate('/wallet')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-50 active:scale-95 transition-transform"
            >
              <Wallet size={20} className="text-blue-600" />
              <span className="text-[10px] font-bold text-blue-700">المحفظة</span>
            </button>
            <button
              onClick={() => navigate('/store')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-emerald-50 active:scale-95 transition-transform"
            >
              <ShoppingBag size={20} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700">المتجر</span>
            </button>
            <button
              onClick={() => navigate('/rewards')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-amber-50 active:scale-95 transition-transform"
            >
              <Trophy size={20} className="text-amber-600" />
              <span className="text-[10px] font-bold text-amber-700">المكافآت</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature info popup */}
      {feature && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center"
          style={{ height: 'var(--visual-height, 100dvh)' }}
          onClick={() => setFeature(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 text-center animate-[slideUp_0.25s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${feature.color}`}>
              <feature.icon size={32} className={feature.iconColor} />
            </div>
            <h2 className="text-xl font-black text-gray-800">{feature.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed mt-2">{feature.desc}</p>
            <button
              onClick={() => { const fn = feature.onClick; setFeature(null); fn && fn(navigate) }}
              className="w-full mt-6 py-3.5 rounded-2xl bg-blue-600 text-white font-bold active:scale-95 transition-transform shadow-lg shadow-blue-200"
            >
              {feature.btn}
            </button>
            <button
              onClick={() => setFeature(null)}
              className="w-full mt-2 py-2.5 rounded-2xl text-gray-400 font-bold active:scale-95 transition-transform"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {showLogout && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-6"
          style={{ height: 'var(--visual-height, 100dvh)' }}
          onClick={() => setShowLogout(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Power size={30} className="text-red-500" />
            </div>
            <h2 className="text-lg font-black text-gray-800">هل أنت متأكد من تسجيل الخروج؟</h2>
            <p className="text-sm text-gray-400 mt-1.5">سيتم إنهاء جلسة الاتصال الحالية بالشبكة.</p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowLogout(false)}
                className="py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold active:scale-95 transition-transform"
              >
                إلغاء
              </button>
              <button
                onClick={() => { setShowLogout(false); try { sessionStorage.setItem('starnet_just_logged_out', '1') } catch {} ; logoutFromHotspot() }}
                className="py-3 rounded-2xl bg-red-500 text-white font-bold active:scale-95 transition-transform shadow-lg shadow-red-200"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {showContact && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-end justify-center"
          style={{ height: 'var(--visual-height, 100dvh)' }}
          onClick={() => setShowContact(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">تواصل معنا</h2>
              <button onClick={() => setShowContact(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2.5">
              <a href={`tel:+${SUPPORT_WA}`} className="flex items-center gap-3 bg-green-50 rounded-2xl p-3.5 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><Phone size={18} className="text-green-600" /></div>
                <div className="flex-1"><p className="font-bold text-gray-800 text-sm">اتصال مباشر</p><p className="text-xs text-gray-400" dir="ltr">{SUPPORT_PHONE}</p></div>
              </a>
              <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-emerald-50 rounded-2xl p-3.5 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><MessageCircle size={18} className="text-emerald-600" /></div>
                <div className="flex-1"><p className="font-bold text-gray-800 text-sm">واتساب</p><p className="text-xs text-gray-400">محادثة عبر الواتساب</p></div>
              </a>
              <a href="https://chat.whatsapp.com/FucljYJwl6248q04xpIkeS" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-teal-50 rounded-2xl p-3.5 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center"><Users size={18} className="text-teal-600" /></div>
                <div className="flex-1"><p className="font-bold text-gray-800 text-sm">جروب واتساب الشبكة</p><p className="text-xs text-gray-400">انضم لمجموعة ستار نت</p></div>
              </a>
              <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-blue-50 rounded-2xl p-3.5 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Facebook size={18} className="text-blue-600" /></div>
                <div className="flex-1"><p className="font-bold text-gray-800 text-sm">فيسبوك</p><p className="text-xs text-gray-400">صفحتنا على فيسبوك</p></div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* زر مساعد ستار نت العائم */}
      <AssistantFab />

      {/* Manual code input bottom sheet */}
      {showCodeInput && (
        <div
          className="fixed inset-0 bg-black/40 z-40 flex items-end justify-center"
          style={{ height: 'var(--visual-height, 100dvh)' }}
          onClick={() => setShowCodeInput(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[rgb(10,22,40)] rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-gray-800 dark:text-gray-100">إدخال رقم الكرت</h2>
              <button onClick={() => setShowCodeInput(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <input
              ref={loginInputRef}
              type="text"
              autoComplete="off"
              autoFocus
              value={loginCode}
              onChange={e => setLoginCode(e.target.value)}
              placeholder="أدخل رقم الكرت هنا"
              dir="ltr"
              className="w-full h-[3.2rem] rounded-[0.8rem] border-[1.5px] border-[rgba(0,119,212,0.2)] dark:border-[rgba(0,180,216,0.2)] bg-[#f4f9ff] dark:bg-[rgba(0,16,32,0.5)] px-3 text-center text-[0.95rem] font-bold tracking-widest text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-[#0077d4] transition-colors mb-3"
            />
            <button
              type="button"
              onClick={() => {
                const c = extractCardCode(loginCode)
                if (!c || loginBusy) return
                setLoginBusy(true)
                setShowCodeInput(false)
                loginToHotspot({ username: c, recordCode: true })
              }}
              disabled={loginBusy || !loginCode.trim()}
              className="w-full h-[3.1rem] rounded-[0.85rem] bg-gradient-to-l from-[#0077d4] to-[#00b4d8] text-white font-[800] text-[0.95rem] flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(0,119,212,0.28)] disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              <Wifi size={20} />
              <span>{loginBusy ? 'جاري الاتصال...' : 'دخول الإنترنت'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-cards')}
              className="w-full mt-2.5 py-2.5 rounded-2xl text-gray-400 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <History size={14} /> سجل الكروت السابقة
            </button>
          </div>
        </div>
      )}

      {/* Camera guide overlay — Hotspot offline barcode + OCR logic */}
      <CameraGuide
        open={!!showGuide}
        mode={showGuide || 'barcode'}
        onClose={() => setShowGuide(null)}
        onCapture={async (file) => {
          try {
            let code = null
            if (showGuide === 'barcode') {
              code = await processImageBarcode(file)
            } else {
              code = await processImageOcr(file)
            }
            if (code) {
              setLoginCode(code)
              setShowGuide(null)
              setShowCodeInput(true)
            }
          } catch (e) {
            console.error('[CameraGuide] capture error:', e)
          }
        }}
      />
    </div>
  )
}
