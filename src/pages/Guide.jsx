import {
  LogIn, Gauge, AlertCircle, RefreshCw, Gamepad2, Wallet, Heart, Lightbulb,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'

const SECTIONS = [
  {
    n: 1,
    icon: LogIn,
    title: 'طريقة تسجيل الدخول',
    color: 'bg-blue-50 text-blue-600',
    items: [
      'أدخل كود البطاقة يدوياً أو استخدم ميزة مسح الباركود.',
      'تأكد من اتصالك بشبكة ستار نت قبل تسجيل الدخول.',
    ],
  },
  {
    n: 2,
    icon: Gauge,
    title: 'للحصول على أفضل سرعة',
    color: 'bg-emerald-50 text-emerald-600',
    items: [
      'ضع الراوتر أو جهاز الاستقبال في مكان مرتفع ومفتوح.',
      'ابتعد عن العوائق المعدنية والجدران السميكة قدر الإمكان.',
    ],
  },
  {
    n: 3,
    icon: AlertCircle,
    title: 'في حال عدم فتح صفحة الدخول',
    color: 'bg-amber-50 text-amber-600',
    items: [
      'اضغط على زر كشف البوابة تلقائياً داخل التطبيق.',
      'أو افتح المتصفح واكتب: 3.3.3.1 أو s.net',
    ],
  },
  {
    n: 4,
    icon: RefreshCw,
    title: 'إذا انقطع الاتصال',
    color: 'bg-sky-50 text-sky-600',
    items: [
      'قم بتحديث الصفحة أو أعد الاتصال بالشبكة.',
      'إذا استمرت المشكلة يرجى التواصل مع الدعم الفني.',
    ],
  },
  {
    n: 5,
    icon: Gamepad2,
    title: 'نصائح للألعاب',
    color: 'bg-purple-50 text-purple-600',
    items: [
      'أغلق التحميلات والتحديثات أثناء اللعب للحصول على أفضل بينق وأداء.',
    ],
  },
  {
    n: 6,
    icon: Wallet,
    title: 'المحافظة على الرصيد',
    color: 'bg-teal-50 text-teal-600',
    items: [
      'تجنب تحديث التطبيقات أو تحميل الملفات الكبيرة أثناء استخدام الباقة إذا كنت ترغب في توفير الرصيد.',
    ],
  },
]

export default function Guide() {
  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Header */}
      <PageHeader icon={Lightbulb} title="الإرشادات" subtitle="نصائح لاستخدام أفضل للخدمة" back />

      <div className="px-4 py-4 space-y-3">
        {SECTIONS.map((s) => (
          <div key={s.n} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon size={22} />
              </div>
              <h2 className="font-black text-gray-800 text-[15px] leading-tight">
                <span className="text-gray-300 ml-1">{s.n}.</span>{s.title}
              </h2>
            </div>
            <ul className="space-y-2">
              {s.items.map((it, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Important reminder */}
        <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 text-center">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Heart size={26} className="text-emerald-500" />
          </div>
          <h2 className="font-black text-gray-800 text-base mb-2">🤍 تذكير مهم</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            اجعل استخدامك للإنترنت فيما ينفعك وينفع أسرتك، وتجنب مشاهدة ما حرّم الله، فالتقنية نعمة، وشكر النعمة يكون باستخدامها فيما يرضي الله.
          </p>
        </div>
      </div>
    </div>
  )
}
