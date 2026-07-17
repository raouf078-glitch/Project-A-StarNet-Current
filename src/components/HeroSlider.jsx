import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Signal, Trophy, Gift, Rocket, Zap, Gamepad2, Headphones, MessageCircle } from 'lucide-react'

const SLIDES = [
  {
    title: 'تغطية واسعة',
    emoji: '📶',
    text: 'نغطي العديد من المناطق بكفاءة عالية',
    btn: 'عرض أماكن التغطية',
    action: { type: 'nav', value: '/coverage' },
    grad: 'from-blue-700 to-blue-500',
    btnColor: 'text-blue-600',
    Icon: MapPin,
    Sub: Signal,
  },
  {
    title: 'جوائز ونقاط',
    emoji: '🎁',
    text: 'اجمع كروت الشحن واحصل على النقاط، وشارك في المسابقات واربح جوائز مميزة.',
    btn: 'استكشف نظام النقاط',
    action: { type: 'link', value: 'https://starnn.shabakaty.site/auth/login' },
    grad: 'from-purple-700 to-fuchsia-500',
    btnColor: 'text-purple-600',
    Icon: Trophy,
    Sub: Gift,
  },
  {
    title: 'سرعة وثبات بلا حدود',
    emoji: '🚀',
    text: 'استمتع باتصال مستقر وسرعات عالية على مدار الساعة.',
    btn: 'استعرض الباقات',
    action: { type: 'nav', value: '/offers' },
    grad: 'from-emerald-600 to-teal-500',
    btnColor: 'text-emerald-600',
    Icon: Rocket,
    Sub: Zap,
  },
  {
    title: 'تجربة ألعاب احترافية',
    emoji: '🎮',
    text: 'بينق منخفض وأداء ممتاز لعشاق الألعاب والبث المباشر.',
    btn: 'اختر باقتك',
    action: { type: 'nav', value: '/offers' },
    grad: 'from-indigo-700 to-violet-500',
    btnColor: 'text-indigo-600',
    Icon: Gamepad2,
    Sub: Zap,
  },
  {
    title: 'دعم فني متواصل',
    emoji: '🎧',
    text: 'فريق الدعم الفني جاهز لخدمتك والرد على استفساراتك.',
    btn: 'تواصل معنا',
    action: { type: 'contact' },
    grad: 'from-cyan-600 to-sky-500',
    btnColor: 'text-cyan-600',
    Icon: Headphones,
    Sub: MessageCircle,
  },
]

export default function HeroSlider({ navigate, onContact }) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)
  const touchX = useRef(null)

  const go = useCallback((i) => {
    setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % SLIDES.length), 6000)
  }, [])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  const handleAction = (action) => {
    if (action.type === 'nav') navigate(action.value)
    else if (action.type === 'link') window.open(action.value, '_blank', 'noopener,noreferrer')
    else if (action.type === 'contact') onContact?.()
  }

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    // RTL: swipe left (dx<0) -> next ; swipe right (dx>0) -> prev
    if (Math.abs(dx) > 40) {
      go(dx < 0 ? index + 1 : index - 1)
      resetTimer()
    }
    touchX.current = null
  }

  return (
    <div>
      <div
        className="relative w-full rounded-2xl overflow-hidden min-h-[140px]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {SLIDES.map((s, i) => {
          const active = i === index
          return (
            <div
              key={i}
              className={`bg-gradient-to-l ${s.grad} ${active ? 'relative opacity-100 translate-x-0' : 'absolute inset-0 opacity-0 translate-x-4 pointer-events-none'} transition-all duration-500 ease-out`}
            >
              <button
                type="button"
                onClick={() => handleAction(s.action)}
                className="w-full text-right p-4 flex items-center gap-3 overflow-hidden min-h-[140px]"
              >
                <div className="flex-1 relative z-10">
                  <h3 className="text-white font-black text-base flex items-center gap-1.5">{s.title} {s.emoji}</h3>
                  <p className="text-white/80 text-xs mt-1 leading-snug">{s.text}</p>
                  <span
                    onClick={(e) => { e.stopPropagation(); handleAction(s.action) }}
                    className={`mt-3 bg-white ${s.btnColor} text-xs font-bold py-2 px-4 rounded-full active:scale-95 transition-transform inline-block shadow-sm`}
                  >
                    {s.btn}
                  </span>
                </div>
                <div className="relative flex-shrink-0">
                  <s.Icon size={64} className="text-white opacity-30" />
                  <s.Sub size={28} className="text-white opacity-50 absolute -top-1 -left-1" />
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Page indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`الشريحة ${i + 1}`}
            onClick={() => { go(i); resetTimer() }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-5 bg-blue-600' : 'w-1.5 bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  )
}
