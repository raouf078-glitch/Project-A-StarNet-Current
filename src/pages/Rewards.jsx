import { useState, useEffect } from 'react'
import { Trophy, Star, Gift, Zap, Award, ArrowUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getOrCreateWallet, getTier, getRewardsHistory } from '../lib/wallet'

const EARN_METHODS = [
  { icon: Zap, label: 'شراء باقة', desc: '10 نقاط لكل ريال', color: 'bg-blue-50 text-blue-600' },
  { icon: Star, label: 'تقييم الخدمة', desc: '50 نقطة عند التقييم', color: 'bg-amber-50 text-amber-600' },
  { icon: Gift, label: 'دعوة صديق', desc: '100 نقطة لكل دعوة', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Award, label: 'الولاء الشهري', desc: 'مكافأة شهرية للعملاء الدائمين', color: 'bg-sky-50 text-sky-600' },
]

const REDEEM_OPTIONS = [
  { title: 'خصم 50 ريال', points: 500, icon: '🎫' },
  { title: 'باقة يوم مجانية', points: 1000, icon: '📶' },
  { title: 'باقة أسبوع مجانية', points: 3000, icon: '🌟' },
  { title: 'ترقية السرعة', points: 2000, icon: '⚡' },
]

export default function Rewards() {
  const [wallet, setWallet] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const w = await getOrCreateWallet()
        const h = await getRewardsHistory()
        setWallet(w)
        setHistory(h)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tier = wallet ? getTier(wallet.points) : null

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={Trophy} title="المكافآت والنقاط" subtitle="اجمع النقاط واستبدلها بمزايا" back />

      <div className="px-4 py-4 space-y-4 animate-sn-enter">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Points balance */}
            <div className="sn-card--premium p-5 text-center relative overflow-hidden">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-amber-300/10 blur-2xl" />
              <div className="relative">
                <Trophy size={36} className="text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">نقاطك الحالية</p>
                <p className="text-4xl font-black text-gray-800 mt-1">{wallet.points.toLocaleString()}</p>
                <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${tier.bg}`}>
                  <span className={`text-xs font-bold ${tier.color}`}>مستوى {tier.name}</span>
                </div>
              </div>
            </div>

            {/* Tier progress */}
            {tier.next && (
              <div className="sn-card--premium p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ArrowUp size={14} className="text-blue-600" />
                    <span className="text-xs font-bold text-gray-700">المستوى التالي</span>
                  </div>
                  <span className="text-xs text-gray-400">{tier.next - wallet.points} نقطة متبقية</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-amber-400 to-amber-300 rounded-full transition-all duration-700"
                    style={{ width: `${tier.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* How to earn */}
            <div>
              <h3 className="text-sm font-black text-gray-800 mb-2.5 px-1">كيف تجمع النقاط</h3>
              <div className="space-y-2">
                {EARN_METHODS.map((m, i) => (
                  <div key={i} className={`sn-card--premium p-3.5 flex items-center gap-3 animate-sn-card sn-stagger-${i + 1}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                      <m.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-700">{m.label}</p>
                      <p className="text-[11px] text-gray-400">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Redeem options */}
            <div>
              <h3 className="text-sm font-black text-gray-800 mb-2.5 px-1">استبدل نقاطك</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {REDEEM_OPTIONS.map((opt, i) => (
                  <div key={i} className="sn-card--premium p-4 text-center">
                    <span className="text-2xl">{opt.icon}</span>
                    <p className="text-xs font-bold text-gray-700 mt-2">{opt.title}</p>
                    <p className="text-[11px] text-blue-600 font-bold mt-1">{opt.points} نقطة</p>
                    <button
                      disabled={wallet.points < opt.points}
                      className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white"
                    >
                      {wallet.points >= opt.points ? 'استبدال' : 'نقاط غير كافية'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards history */}
            {history.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-gray-800 mb-2.5 px-1">سجل المكافآت</h3>
                <div className="space-y-2">
                  {history.slice(0, 10).map(r => (
                    <div key={r.id} className="sn-card--premium p-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${r.type === 'earned' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        {r.type === 'earned' ? <Star size={16} className="text-emerald-600" /> : <Gift size={16} className="text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{r.description}</p>
                        <p className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString('ar')}</p>
                      </div>
                      <span className={`text-xs font-black ${r.type === 'earned' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {r.type === 'earned' ? '+' : '-'}{r.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
