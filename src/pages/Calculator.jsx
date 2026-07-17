import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator as CalcIcon, ArrowRight, Zap, Clock, Download, Sparkles, ShoppingCart, Smartphone, Gamepad2, Globe, Play } from 'lucide-react'
import { useLiveShared } from '../lib/useLive'
import { LOGO_URL } from '../netConfig'
import PageHeader from '../components/PageHeader'

// تقدير الاستهلاك الشهري بالجيجا حسب نوع الاستخدام
const USAGE = [
  { id: 'light', label: 'تصفح خفيف', sub: 'واتساب، تصفح، سوشيال', icon: Globe, perHour: 0.3, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'medium', label: 'فيديو ويوتيوب', sub: 'مشاهدة فيديو ومسلسلات', icon: Play, perHour: 1.2, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'heavy', label: 'ألعاب وتحميل', sub: 'ألعاب أونلاين وتحميل ثقيل', icon: Gamepad2, perHour: 3.0, color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

// استخراج رقم الجيجا من نص الباقة
function parseGB(quota) {
  const s = String(quota || '').toLowerCase()
  if (!s || /مفتوح|غير محدود|unlimited|لا محدود/.test(s)) return Infinity
  const num = parseFloat((s.match(/[\d.]+/) || [])[0])
  if (isNaN(num)) return Infinity
  if (/تيرا|tb|تيرابايت/.test(s)) return num * 1024
  return num // افتراض جيجا
}

export default function Calculator() {
  const navigate = useNavigate()
  const { data: packages } = useLiveShared('packages', { order: 'sort' })
  const active = packages.filter(p => p.active !== false)

  const [usage, setUsage] = useState('medium')
  const [hours, setHours] = useState(3)
  const [devices, setDevices] = useState(1)
  const [result, setResult] = useState(null)

  const compute = () => {
    const u = USAGE.find(x => x.id === usage)
    const deviceFactor = 1 + (devices - 1) * 0.6
    const monthlyGB = u.perHour * hours * 30 * deviceFactor
    const needed = Math.round(monthlyGB)

    // رتّب الباقات حسب الجيجا، واختر الأنسب (أصغر باقة تغطي الاحتياج)
    const ranked = [...active]
      .map(p => ({ ...p, gb: parseGB(p.quota) }))
      .sort((a, b) => a.gb - b.gb)

    let best = ranked.find(p => p.gb >= needed) || ranked[ranked.length - 1] || null
    const alternatives = ranked.filter(p => p.id !== best?.id).slice(0, 3)

    setResult({ needed, best, alternatives, usageLabel: u.label })
  }

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Header */}
      <PageHeader icon={CalcIcon} title="حاسبة الباقة المناسبة" subtitle="اختر الباقة الأنسب لاستهلاكك" back />

      <div className="px-4 py-5 space-y-4">
        {/* Intro */}
        <div className="bg-gradient-to-l from-blue-600 to-cyan-500 rounded-3xl p-5 text-white relative overflow-hidden">
          <CalcIcon size={90} className="absolute -left-3 -bottom-3 opacity-15" />
          <h2 className="font-black text-lg relative z-10">ما الباقة الأنسب لك؟</h2>
          <p className="text-blue-50 text-sm mt-1 relative z-10 leading-snug">أجب عن سؤالين بسيطين ونقترح لك أنسب باقة حسب استهلاكك.</p>
        </div>

        {/* Usage type */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 text-sm mb-3">نوع الاستخدام</h3>
          <div className="space-y-2">
            {USAGE.map(u => {
              const sel = usage === u.id
              return (
                <button
                  key={u.id}
                  onClick={() => { setUsage(u.id); setResult(null) }}
                  className={`w-full flex items-center gap-3 rounded-2xl p-3 border-2 transition-all ${sel ? u.color : 'border-gray-100 bg-white'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sel ? 'bg-white/70' : 'bg-gray-50'}`}>
                    <u.icon size={20} className={sel ? '' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 text-right">
                    <p className={`font-bold text-sm ${sel ? '' : 'text-gray-700'}`}>{u.label}</p>
                    <p className="text-[11px] text-gray-400">{u.sub}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? 'border-current' : 'border-gray-300'}`}>
                    {sel && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hours slider */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-700 text-sm">ساعات الاستخدام يومياً</h3>
            <span className="font-black text-blue-600">{hours} ساعة</span>
          </div>
          <input
            type="range" min="1" max="12" value={hours}
            onChange={(e) => { setHours(Number(e.target.value)); setResult(null) }}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>1</span><span>12</span></div>
        </div>

        {/* Devices */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-1.5"><Smartphone size={15} className="text-gray-400" /> عدد الأجهزة المتصلة</h3>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => { setDevices(n); setResult(null) }}
                className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${devices === n ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-500'}`}
              >
                {n}{n === 5 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Compute button */}
        <button
          onClick={compute}
          disabled={active.length === 0}
          className="w-full py-3.5 rounded-2xl font-bold text-white text-base bg-gradient-to-l from-blue-600 to-cyan-500 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-200"
        >
          <Sparkles size={18} /> احسب الباقة المناسبة
        </button>
        {active.length === 0 && (
          <p className="text-center text-xs text-gray-400">لا توجد باقات متاحة حالياً</p>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3 pt-1">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 text-center">
              <p className="text-xs text-gray-400">تقديرنا لاستهلاكك الشهري ({result.usageLabel})</p>
              <p className="text-3xl font-black text-blue-600 mt-1">≈ {result.needed} <span className="text-base">جيجا</span></p>
            </div>

            {result.best ? (
              <div className="rounded-3xl overflow-hidden shadow-lg border-2 border-blue-300">
                <div className="bg-gradient-to-l from-blue-600 to-cyan-500 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} />
                    <div>
                      <p className="text-[11px] opacity-80">الباقة المقترحة لك</p>
                      <h3 className="font-black text-lg leading-tight">{result.best.name}</h3>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] opacity-80">السعر</p>
                    <p className="font-black text-2xl">{result.best.price}<span className="text-xs"> ريال</span></p>
                  </div>
                </div>
                <div className="bg-blue-50 px-4 py-3 flex items-center justify-around">
                  <div className="flex items-center gap-1.5"><Zap size={14} className="text-blue-500" /><span className="text-xs font-bold text-blue-600">{result.best.speed || 'مفتوحة'}</span></div>
                  <div className="w-px h-6 bg-blue-200" />
                  <div className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /><span className="text-xs font-bold text-blue-600">{result.best.validity || '-'}</span></div>
                  <div className="w-px h-6 bg-blue-200" />
                  <div className="flex items-center gap-1.5"><Download size={14} className="text-blue-500" /><span className="text-xs font-bold text-blue-600">{result.best.quota || '-'}</span></div>
                </div>
                <div className="bg-white p-3">
                  <button
                    onClick={() => navigate('/deposit', { state: { pkg: { name: result.best.name, price: result.best.price } } })}
                    className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <ShoppingCart size={18} /> اطلب هذه الباقة
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400">لم نجد باقة مطابقة — تواصل مع الدعم لمساعدتك.</p>
            )}

            {result.alternatives.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 px-1 mb-2">باقات أخرى قد تناسبك</p>
                <div className="space-y-2">
                  {result.alternatives.map(p => (
                    <button
                      key={p.id}
                      onClick={() => navigate('/deposit', { state: { pkg: { name: p.name, price: p.price } } })}
                      className="w-full bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.98] transition-transform"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                        <Download size={18} className="text-gray-400" />
                      </div>
                      <div className="flex-1 text-right min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">{p.name}</p>
                        <p className="text-[11px] text-gray-400">{p.quota || '-'} · {p.validity || '-'}</p>
                      </div>
                      <span className="font-black text-blue-600 text-sm shrink-0">{p.price} ريال</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-gray-400 text-center leading-relaxed px-2">
              * هذا تقدير تقريبي للمساعدة في الاختيار، وقد يختلف الاستهلاك الفعلي حسب جودة الفيديو ونوع الاستخدام.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
