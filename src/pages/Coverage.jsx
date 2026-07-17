import { MapPin, Signal, CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const PLACES = [
  { name: 'سيئون السحيل', desc: 'تغطية كاملة داخل المدينة والأحياء المجاورة.' },
  { name: 'شحوح', desc: 'تغطية كاملة داخل المدينة والأحياء المجاورة.' },
  { name: 'تريس', desc: 'تغطية كاملة داخل المدينة والأحياء المجاورة.' },
  { name: 'سوم بن همام', desc: '' },
  { name: 'شارع المطار الغربي والشرقي', desc: 'والأحياء المجاورة.' },
  { name: 'سوق الخضار المركزي', desc: '' },
  { name: 'سوق القات', desc: '' },
  { name: 'مدوده', desc: '' },
  { name: 'الحصن', desc: '' },
]

export default function Coverage() {
  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Header */}
      <PageHeader icon={Signal} title="أماكن التغطية" subtitle="نغطي العديد من المناطق بكفاءة عالية" back />

      <div className="px-4 py-4 space-y-3">
        {PLACES.map((p, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 flex items-start gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <MapPin size={22} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-gray-800 text-[15px]">{p.name}</h3>
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              </div>
              {p.desc && <p className="text-sm text-gray-500 mt-0.5 leading-snug">{p.desc}</p>}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 pt-2">
          تتوسع تغطيتنا باستمرار — تواصل معنا لمعرفة توفّر الخدمة في منطقتك.
        </p>
      </div>
    </div>
  )
}
