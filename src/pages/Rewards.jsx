import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gift, Star, Trophy, Sparkles, ChevronLeft, Award, TrendingUp, Wifi, Tag, CalendarClock, Users, ShoppingBag } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getRewards, getRewardPoints, redeemReward, fmtDate } from '../lib/walletApi'

const REDEEM_OPTIONS = [
  { points: 500, label: 'كارت 5 جيجا مجاني', icon: Wifi, color: 'text-blue-600 bg-blue-50' },
  { points: 1000, label: 'خصم 10,000 د.ع', icon: Tag, color: 'text-green-600 bg-green-50' },
  { points: 2500, label: 'كارت 25 جيجا مجاني', icon: Wifi, color: 'text-sky-600 bg-sky-50' },
  { points: 5000, label: 'اشتراك شهري مجاني', icon: CalendarClock, color: 'text-amber-600 bg-amber-50' },
]

const CAMPAIGNS = [
  { title: 'مكافأة الصيف', desc: 'اربح 200 نقطة عند شراء أي اشتراك', icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
  { title: 'دعوة صديق', desc: '100 نقطة لكل صديق يدخل الشبكة', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { title: 'تسوق واربح', desc: 'نقطة عن كل 1,000 د.ع مشتريات', icon: ShoppingBag, color: 'text-green-600 bg-green-50' },
]

export default function Rewards() {
  const navigate = useNavigate()
  const [points, setPoints] = useState(0)
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [pts, rwds] = await Promise.all([getRewardPoints(), getRewards()])
    setPoints(pts)
    setRewards(rwds)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRedeem = async (opt) => {
    if (points < opt.points || redeeming) return
    setRedeeming(opt.points)
    await redeemReward(opt.points, `استبدال: ${opt.label}`)
    await load()
    setRedeeming(null)
  }

  const level = points >= 5000 ? { label: 'بلاتيني', icon: Trophy, color: 'text-amber-600' }
    : points >= 2500 ? { label: 'ذهبي', icon: Award, color: 'text-amber-500' }
    : points >= 500 ? { label: 'فضي', icon: Star, color: 'text-gray-500' }
    : { label: 'برونزي', icon: Star, color: 'text-amber-700' }

  return (
    <div className="min-h-full">
      <PageHeader icon={Gift} title="المكافآت" subtitle="نقاط ومكافآت ستار نت" back onBack={() => navigate('/wallet')} />

      <div className="px-4 py-4 space-y-4 pb-28">
        {/* Points card */}
        <div className="relative rounded-3xl overflow-hidden shadow-glow animate-fadeIn">
          <div className="absolute inset-0 page-hero" />
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-3xl animate-glow" />
          <div className="relative p-5 text-white text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-3">
              <level.icon size={28} />
            </div>
            <p className="text-white/70 text-xs font-semibold">رصيد النقاط</p>
            <p className="text-4xl font-black mt-1">{points.toLocaleString()}</p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur">
              <Star size={14} className="text-amber-300" />
              <span className="text-xs font-bold">عضوية {level.label}</span>
            </div>
          </div>
        </div>

        {/* Redeem options */}
        <div>
          <h3 className="font-bold text-gray-700 text-sm mb-2 px-1">استبدال النقاط</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {REDEEM_OPTIONS.map(opt => {
              const canRedeem = points >= opt.points
              return (
                <div key={opt.points} className="sn-card rounded-2xl p-3 flex flex-col items-center text-center">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 ${opt.color}`}>
                    <opt.icon size={20} />
                  </div>
                  <p className="text-xs font-bold text-gray-700 leading-tight mb-1">{opt.label}</p>
                  <p className="text-[11px] font-black text-blue-600 mb-2">{opt.points.toLocaleString()} نقطة</p>
                  <button
                    onClick={() => handleRedeem(opt)}
                    disabled={!canRedeem || redeeming === opt.points}
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40 bg-blue-600 text-white"
                  >
                    {redeeming === opt.points ? 'جاري...' : canRedeem ? 'استبدال' : 'نقاط غير كافية'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Campaigns */}
        <div>
          <h3 className="font-bold text-gray-700 text-sm mb-2 px-1">الحملات والمكافآت</h3>
          <div className="space-y-2">
            {CAMPAIGNS.map(c => (
              <div key={c.title} className="sn-card rounded-2xl p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                  <c.icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700">{c.title}</p>
                  <p className="text-[11px] text-gray-400">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div>
          <h3 className="font-bold text-gray-700 text-sm mb-2 px-1">سجل النقاط</h3>
          {loading ? (
            <div className="py-6 text-center text-gray-400 text-sm">جاري التحميل...</div>
          ) : rewards.length === 0 ? (
            <div className="sn-card rounded-2xl p-4 text-center">
              <Gift size={28} className="text-gray-300 mx-auto mb-1.5" />
              <p className="text-xs text-gray-400">لا توجد نقاط بعد</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {rewards.map(r => (
                <div key={r.id} className="sn-card rounded-2xl p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${r.type === 'earned' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                    {r.type === 'earned' ? <TrendingUp size={16} /> : <Gift size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 truncate">{r.description}</p>
                    <p className="text-[11px] text-gray-400">{fmtDate(r.created_at)}</p>
                  </div>
                  <p className={`text-sm font-black ${r.type === 'earned' ? 'text-green-600' : 'text-amber-600'}`}>
                    {r.type === 'earned' ? '+' : '-'}{r.points}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

