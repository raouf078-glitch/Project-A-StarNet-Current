import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot } from 'lucide-react'

const SEEN_KEY = 'sn_assistant_seen_v1'
const IDLE_MS = 5000

export default function AssistantFab() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)   // للدخول (تلاشي + انزلاق)
  const [expanded, setExpanded] = useState(true)  // ممتد أم مصغّر
  const [hasDot, setHasDot] = useState(false)     // نقطة التنبيه
  const idleTimer = useRef(null)

  // نقطة التنبيه: تظهر حتى يفتح المستخدم المساعد أول مرة
  useEffect(() => {
    try { setHasDot(!localStorage.getItem(SEEN_KEY)) } catch { setHasDot(false) }
  }, [])

  // حركة الدخول ثم بدء عدّاد التصغير
  useEffect(() => {
    const t1 = requestAnimationFrame(() => setEntered(true))
    startIdle()
    return () => { cancelAnimationFrame(t1); clearTimer() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearTimer = () => { if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null } }
  const startIdle = () => {
    clearTimer()
    idleTimer.current = setTimeout(() => setExpanded(false), IDLE_MS)
  }

  const open = () => {
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
    setHasDot(false)
    navigate('/assistant')
  }

  const handleClick = () => {
    if (expanded) {
      open()
    } else {
      // مصغّر: وسّعه أولاً ثم أعد عدّاد التصغير
      setExpanded(true)
      startIdle()
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label="مساعد ستار نت"
      className={[
        'fixed left-4 z-20 flex items-center overflow-hidden',
        'bg-gradient-to-br from-blue-700 to-blue-500 text-white rounded-full',
        'shadow-xl shadow-blue-400/40 active:scale-95',
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+0.75rem)]',
        'transition-all duration-500 ease-out will-change-transform',
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        expanded ? 'pl-3 pr-4 py-3 gap-2' : 'p-3 gap-0',
      ].join(' ')}
    >
      <span className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <Bot size={19} />
        {hasDot && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-sky-300 ring-2 ring-blue-600 animate-pulse" />
        )}
      </span>
      <span
        className={[
          'text-sm font-black whitespace-nowrap transition-all duration-500 ease-out',
          expanded ? 'max-w-[10rem] opacity-100 ml-0' : 'max-w-0 opacity-0',
        ].join(' ')}
      >
        مساعد ستار نت
      </span>
    </button>
  )
}
