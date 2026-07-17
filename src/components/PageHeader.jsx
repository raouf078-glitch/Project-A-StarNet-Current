import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// ترويسة موحّدة احترافية لكل الصفحات الفرعية.
// تتكوّن من: سهم رجوع (اختياري)، أيقونة القسم، عنوان كبير، ووصف مختصر.
// خلفية بتدرّج متناسق مع هوية ستار نت، وتتكيّف تلقائياً مع الوضع الليلي.
//
// props:
// - icon: أيقونة lucide تعبّر عن القسم
// - title: عنوان الصفحة
// - subtitle: وصف مختصر أسفل العنوان
// - back: إظهار سهم الرجوع
// - onBack: معالج مخصّص للرجوع (افتراضياً navigate(-1))
// - action: عنصر اختياري يظهر أعلى يسار الترويسة (مثل زر إعادة)
// - accent: لون التدرّج (blue افتراضياً | emerald)
export default function PageHeader({
  icon: Icon = null,
  title,
  subtitle = null,
  back = false,
  onBack,
  action = null,
  accent = 'blue',
}) {
  const navigate = useNavigate()

  return (
    <div
      className={`page-hero page-hero--${accent} relative pt-[calc(env(safe-area-inset-top,0px)+0.7rem)] pb-6 px-4 shadow-lg overflow-hidden`}
    >
      {/* زخرفة خلفية ناعمة */}
      <div className="absolute -top-12 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-14 right-0 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative">
        {/* صف علوي: رجوع + إجراء */}
        {(back || action) && (
          <div className="flex items-center justify-between mb-3">
            {back ? (
              <button
                onClick={() => (onBack ? onBack() : navigate(-1))}
                className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
                aria-label="رجوع"
              >
                <ArrowRight size={20} className="text-white" />
              </button>
            ) : (
              <span className="w-10 h-10" />
            )}
            {action ? <div className="shrink-0">{action}</div> : <span />}
          </div>
        )}

        {/* العنوان + الأيقونة */}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-sm">
              <Icon size={25} className="text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-white leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-white/85 text-xs mt-0.5 leading-snug truncate">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
