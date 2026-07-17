import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, ArrowRight, MapPin, ChevronDown, Search, X, Star, Map as MapIcon, Phone, Handshake, Sparkles } from 'lucide-react'
import { POS_REGIONS, countRegionPoints, totalPoints } from '../posData'
import { SUPPORT_WA } from '../netConfig'

function WhatsAppIcon({ size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// بطاقة المركز الرئيسي المميّزة ⭐
function FeaturedCard({ pt }) {
  return (
    <div className="rounded-2xl p-4 border-2 border-amber-300 bg-amber-50 relative overflow-hidden">
      <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-amber-200/40 blur-xl" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Store size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              <Star size={11} className="fill-current" />
              المركز الرئيسي
            </span>
            <h3 className="font-black text-gray-800 text-[18px] leading-tight mt-1.5">{pt.name}</h3>
          </div>
        </div>
        {pt.desc && (
          <div className="flex items-start gap-1.5 text-gray-600 text-[13.5px] mt-3">
            <MapPin size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{pt.desc}</span>
          </div>
        )}
        {(pt.map || pt.phone) && (
          <div className="flex gap-2 mt-3.5">
            {pt.map && (
              <a
                href={pt.map}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-amber-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[13px] active:scale-95 transition-transform shadow-sm"
              >
                <MapIcon size={15} />
                عرض الموقع
              </a>
            )}
            {pt.phone && (
              <a
                href={`tel:${pt.phone}`}
                className="flex-1 bg-teal-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[13px] active:scale-95 transition-transform shadow-sm"
              >
                <Phone size={15} />
                اتصال
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// بطاقة نقطة بيع عادية
function PointCard({ pt }) {
  if (pt.featured) return <FeaturedCard pt={pt} />
  return (
    <div className="rounded-2xl p-3.5 border border-gray-100 bg-white transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <Store size={20} />
        </div>
        {/* أيقونة المتجر تبقى خضراء كمؤشّر ثانوي */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 text-[15px] leading-tight">{pt.name}</h3>
          {pt.desc && (
            <div className="flex items-start gap-1 text-gray-500 text-[13px] mt-1">
              <MapPin size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{pt.desc}</span>
            </div>
          )}
          {(pt.map || pt.phone) && (
            <div className="flex gap-2 mt-2.5">
              {pt.map && (
                <a
                  href={pt.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-[13px] active:scale-95 transition-transform"
                >
                  <MapIcon size={15} />
                  عرض الموقع
                </a>
              )}
              {pt.phone && (
                <a
                  href={`tel:${pt.phone}`}
                  className="flex-1 bg-teal-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-[13px] active:scale-95 transition-transform"
                >
                  <Phone size={15} />
                  اتصال
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// منطقة قابلة للفتح/الإغلاق (أكورديون)
function RegionAccordion({ region, open, onToggle }) {
  const count = useMemo(() => countRegionPoints(region), [region])

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 active:bg-gray-50 transition-colors"
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
          <MapPin size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <h2 className="font-black text-gray-800 text-[15px] leading-tight">{region.name}</h2>
          <span className="text-[12px] text-emerald-600 font-bold">{count} نقطة بيع</span>
        </div>
        <ChevronDown
          size={22}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* محتوى متحرّك عند الفتح/الإغلاق */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
            {region.sections.map((sec, i) => (
              <div key={i} className="space-y-2">
                {sec.title && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-[13px] text-gray-600">{sec.title}</h4>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[11px] text-gray-400">{sec.points.length}</span>
                  </div>
                )}
                {sec.points.map((pt, j) => (
                  <PointCard key={j} pt={pt} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PointsOfSale() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(POS_REGIONS[0]?.id || null)

  const q = query.trim()
  const searching = q.length > 0

  // عند البحث: نصفّي النقاط داخل كل منطقة، ونبقي فقط المناطق التي بها نتائج
  const filtered = useMemo(() => {
    if (!searching) return POS_REGIONS
    const needle = q.toLowerCase()
    return POS_REGIONS.map((region) => {
      const sections = region.sections
        .map((sec) => ({
          ...sec,
          points: sec.points.filter((pt) => {
            const hay = `${pt.name} ${pt.desc || ''}`.toLowerCase()
            return hay.includes(needle)
          }),
        }))
        .filter((sec) => sec.points.length > 0)
      return { ...region, sections }
    }).filter((region) => region.sections.length > 0)
  }, [q, searching])

  const total = useMemo(() => totalPoints(), [])

  function toggle(id) {
    setOpenId((cur) => (cur === id ? null : id))
  }

  const waMsg = encodeURIComponent(
    'مرحباً، أرغب بالانضمام إلى شبكة موزّعي ستار نت كنقطة بيع معتمدة لكروت الشبكة. ✨'
  )
  const distributorLink = `https://wa.me/${SUPPORT_WA}?text=${waMsg}`

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Header فخم */}
      <div className="pos-hero relative pt-[calc(env(safe-area-inset-top,0px)+0.6rem)] pb-6 px-4 shadow-lg overflow-hidden">
        {/* زخرفة خلفية */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 right-0 w-44 h-44 rounded-full bg-blue-300/20 blur-2xl" />
        <div className="relative">
          <div className="flex items-center mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="رجوع"
            >
              <ArrowRight size={20} className="text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-sm">
              <Store size={25} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black text-white leading-tight">نقاط البيع</h1>
              <p className="text-white/85 text-xs mt-0.5 leading-snug">نقاط بيع كروت ستار نت موزّعة على مناطق التغطية</p>
            </div>
          </div>
          {/* عداد إجمالي */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-3.5 py-1.5">
            <Sparkles size={14} className="text-amber-200" />
            <span className="text-white text-[13px] font-bold">
              {total} نقطة بيع في {POS_REGIONS.length} مناطق
            </span>
          </div>
        </div>
      </div>

      {/* مربع البحث */}
      <div className="px-4 -mt-3 relative z-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 flex items-center px-4 py-1">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم البقالة أو نقطة البيع..."
            className="flex-1 bg-transparent px-3 py-3 text-gray-800 placeholder-gray-400 focus:outline-none text-[15px]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
              aria-label="مسح"
            >
              <X size={15} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* القائمة */}
      <div className="px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Search size={52} className="mb-3 opacity-30" />
            <p className="font-bold text-gray-500">لا توجد نتائج</p>
            <p className="text-xs mt-1 text-center px-8">
              لم نعثر على نقطة بيع باسم «{q}». جرّب اسماً آخر أو تأكد من الإملاء.
            </p>
          </div>
        ) : (
          filtered.map((region) => (
            <RegionAccordion
              key={region.id}
              region={region}
              // أثناء البحث نفتح كل المناطق التي بها نتائج
              open={searching || openId === region.id}
              onToggle={() => toggle(region.id)}
            />
          ))
        )}

        {/* قسم الانضمام كموزّع */}
        {!searching && (
          <div className="pos-cta mt-5 rounded-3xl overflow-hidden p-6 shadow-lg relative">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
            <div className="relative text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-3">
                <Handshake size={28} className="text-white" />
              </div>
              <h3 className="text-white font-black text-lg leading-tight">
                هل ترغب بالانضمام إلى شبكة موزّعي ستار نت؟ 🤝
              </h3>
              <p className="text-blue-50/90 text-[13px] mt-2.5 leading-relaxed">
                إذا كنت ترغب بأن تكون نقطة بيع معتمدة لكروت شبكة ستار نت، أو ترى أن منطقتك بحاجة إلى
                نقطة بيع جديدة، يسعدنا تواصلك معنا.
              </p>
              <a
                href={distributorLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full bg-white text-blue-700 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md"
              >
                <WhatsAppIcon size={20} className="text-green-600" />
                طلب الانضمام كموزّع
              </a>
            </div>
          </div>
        )}

        <div className="h-2" />
      </div>
    </div>
  )
}
