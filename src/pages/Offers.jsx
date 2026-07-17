import { useNavigate } from 'react-router-dom'
import { Zap, Clock, Download, Gift, ShoppingCart } from 'lucide-react'
import { useLiveShared } from '../lib/useLive'
import PageHeader from '../components/PageHeader'

const COLORS = [
  // 0 — 200: بنفسجي فاتح
  { bg: 'from-violet-300 to-violet-400', head: 'text-white', sub: 'text-white/80', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', btn: 'bg-violet-500' },
  // 1 — 300: أحمر هادئ
  { bg: 'from-red-300 to-red-400', head: 'text-white', sub: 'text-white/80', light: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', btn: 'bg-red-500' },
  // 2 — 500: أخضر
  { bg: 'from-emerald-300 to-emerald-400', head: 'text-white', sub: 'text-white/80', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', btn: 'bg-emerald-500' },
  // 3 — 1000: وردي فاتح
  { bg: 'from-pink-200 to-pink-300', head: 'text-pink-900', sub: 'text-pink-900/60', light: 'bg-pink-50', text: 'text-pink-500', border: 'border-pink-200', btn: 'bg-pink-400' },
  // 4 — 1500: كريمي
  { bg: 'from-amber-100 to-amber-200', head: 'text-amber-900', sub: 'text-amber-900/60', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', btn: 'bg-amber-500' },
  // 5 — 2000: برتقالي فاتح
  { bg: 'from-orange-200 to-orange-300', head: 'text-orange-900', sub: 'text-orange-900/60', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', btn: 'bg-orange-500' },
  // 6 — 3000: تركوازي
  { bg: 'from-teal-300 to-cyan-400', head: 'text-white', sub: 'text-white/80', light: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', btn: 'bg-teal-500' },
  // 7 — 5000: أصفر فاتح
  { bg: 'from-yellow-100 to-yellow-200', head: 'text-yellow-900', sub: 'text-yellow-900/60', light: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', btn: 'bg-yellow-500' },
  // 8 — 10000: ذهبي
  { bg: 'from-amber-300 to-yellow-400', head: 'text-amber-950', sub: 'text-amber-950/60', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', btn: 'bg-amber-500' },
]

export default function Offers() {
  const { data: packages, loading } = useLiveShared('packages', { order: 'sort' })
  const navigate = useNavigate()
  const activePackages = packages.filter(p => p.active !== false)

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Header */}
      <PageHeader icon={Gift} title="العروض والباقات" subtitle="اختر الباقة المناسبة لك" back />

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activePackages.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Gift size={56} className="mb-3 opacity-30" />
            <p className="font-semibold">لا توجد باقات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activePackages.map((pkg, idx) => {
              const color = COLORS[pkg.colorIndex ?? (idx % COLORS.length)]
              return (
                <div key={pkg.id} className={`rounded-2xl overflow-hidden shadow-sm border ${color.border}`}>
                  <div className={`bg-gradient-to-l ${color.bg} p-4 flex items-center justify-between`}>
                    <div>
                      <h3 className={`${color.head} font-black text-lg`}>{pkg.name}</h3>
                      {pkg.description && <p className={`${color.sub} text-xs mt-0.5`}>{pkg.description}</p>}
                    </div>
                    <div className="text-left">
                      <p className={`${color.sub} text-xs`}>السعر</p>
                      <p className={`${color.head} font-black text-2xl`}>{pkg.price} <span className="text-sm font-semibold">ريال</span></p>
                    </div>
                  </div>
                  <div className={`${color.light} px-4 py-3 flex items-center justify-around`}>
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className={color.text} />
                      <div>
                        <p className="text-[10px] text-gray-500">السرعة</p>
                        <p className={`text-xs font-bold ${color.text}`}>{pkg.speed || 'مفتوحة'}</p>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className={color.text} />
                      <div>
                        <p className="text-[10px] text-gray-500">الصلاحية</p>
                        <p className={`text-xs font-bold ${color.text}`}>{pkg.validity || '-'}</p>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="flex items-center gap-1.5">
                      <Download size={14} className={color.text} />
                      <div>
                        <p className="text-[10px] text-gray-500">التحميل</p>
                        <p className={`text-xs font-bold ${color.text}`}>{pkg.quota || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white px-3 py-3">
                    <button
                      onClick={() => navigate('/deposit', { state: { pkg: { name: pkg.name, price: pkg.price } } })}
                      className={`w-full ${color.btn} text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform`}
                    >
                      <ShoppingCart size={18} />
                      طلب الباقة
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
