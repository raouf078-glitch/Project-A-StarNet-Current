import { useEffect, useState } from 'react'
import { checkInternet, LOGO_URL } from '../netConfig'

// شاشة بداية أنيقة بهوية ستار نت الجديدة: خلفية فاتحة ناعمة،
// الشعار في الوسط مع حركة Fade، عبارة ترحيب، عبارات متغيّرة أثناء
// التحقق، وشريط تقدّم متحرك. تظهر ~2.6 ثانية ثم تنتقل للرئيسية.

const STEPS = [
  '📶 جاري فحص الاتصال...',
  '🔐 التحقق من بوابة الشبكة...',
  '🚀 تجهيز خدمات التطبيق...',
  '✅ مرحباً بك في ستار نت',
]

export default function Splash({ onDone }) {
  const [showToast, setShowToast] = useState(false)
  const [hide, setHide] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    let alive = true

    checkInternet(2400)
      .then(ok => { if (alive && !ok) setShowToast(true) })
      .catch(() => { if (alive) setShowToast(true) })

    // تبديل العبارات تباعاً
    const stepTimers = STEPS.map((_, i) =>
      setTimeout(() => alive && setStep(i), i * 650)
    )

    const t = setTimeout(() => {
      if (!alive) return
      setHide(true)
      setTimeout(() => alive && onDone && onDone(), 350)
    }, 2600)

    return () => {
      alive = false
      clearTimeout(t)
      stepTimers.forEach(clearTimeout)
    }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden transition-opacity duration-300 ${
        hide ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(180deg,#ffffff 0%,#eef5ff 55%,#e0ecff 100%)' }}
    >
      {/* وهج علوي ناعم بلون الهوية */}
      <div
        className="absolute inset-x-0 top-0 h-[55%] pointer-events-none"
        style={{ background: 'radial-gradient(120% 70% at 50% 0%, rgba(37,99,235,0.12), transparent 65%)' }}
      />
      {/* وهج سفلي خفيف */}
      <div
        className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none"
        style={{ background: 'radial-gradient(100% 60% at 50% 100%, rgba(37,99,235,0.10), transparent 70%)' }}
      />

      {/* المحتوى: الشعار + الترحيب */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 -mt-[4%]">
        <div className="w-full flex justify-center animate-[fadeIn_.8s_ease]" dir="ltr">
          <img
            src={LOGO_URL}
            alt="StarNET"
            className="w-[72vw] max-w-[360px] block object-contain drop-shadow-[0_10px_28px_rgba(20,80,160,0.18)]"
            draggable={false}
          />
        </div>

        <div className="mt-7 text-center animate-[fadeIn_1.2s_ease]">
          <p className="text-[#0b3a73] text-xl font-extrabold leading-snug">
            مرحباً بك في تطبيق ستار نت
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="h-[2px] w-5 bg-[#0b3a73]/30 rounded-full" />
            <p className="text-[#2563eb] text-sm font-bold tracking-wide">سرعة • ثبات • جودة</p>
            <span className="h-[2px] w-5 bg-[#0b3a73]/30 rounded-full" />
          </div>
        </div>
      </div>

      {/* عبارة التحقق المتغيّرة + شريط التقدّم */}
      <div className="absolute inset-x-0 bottom-[max(11%,calc(env(safe-area-inset-bottom)+3rem))] flex flex-col items-center gap-4 px-10 z-10">
        <span
          key={step}
          className="text-[#0b3a73] text-sm font-semibold animate-[fadeIn_.4s_ease] min-h-[1.25rem]"
        >
          {STEPS[step]}
        </span>
        <div className="w-full max-w-[260px] h-1.5 rounded-full bg-[#2563eb]/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#38bdf8] transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Toast عند عدم وجود إنترنت */}
      {showToast && (
        <div className="absolute inset-x-0 top-[max(6%,env(safe-area-inset-top))] flex justify-center px-6 z-20">
          <div className="bg-red-600/95 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-lg backdrop-blur-sm animate-[fadeIn_.3s_ease]">
            لا يوجد اتصال بالإنترنت
          </div>
        </div>
      )}
    </div>
  )
}
