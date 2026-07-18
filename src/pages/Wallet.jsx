import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet as WalletIcon, TrendingUp, TrendingDown, ArrowLeft, Trophy, ShoppingBag, History, Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getOrCreateWallet, getTransactions, getTier } from '../lib/wallet'

export default function Wallet() {
  const navigate = useNavigate()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const w = await getOrCreateWallet()
        const txs = await getTransactions(5)
        setWallet(w)
        setTransactions(txs)
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
      <PageHeader icon={WalletIcon} title="المحفظة" subtitle="رصيدك ونقاطك ومعاملاتك" back />

      <div className="px-4 py-4 space-y-4 animate-sn-enter">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Balance Card */}
            <div className="sn-card--premium p-5 relative overflow-hidden">
              <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-blue-400/10 blur-2xl" />
              <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-cyan-400/10 blur-xl" />
              <div className="relative">
                <p className="text-sm text-gray-500 mb-1">الرصيد الحالي</p>
                <p className="text-3xl font-black text-gray-800">{Number(wallet.balance).toLocaleString()} <span className="text-base font-semibold text-gray-500">ريال</span></p>
                <div className="flex items-center gap-4 mt-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tier.bg}`}>
                    <Trophy size={14} className={tier.color} />
                    <span className={`text-xs font-bold ${tier.color}`}>{tier.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">النقاط:</span>
                    <span className="text-sm font-black text-blue-600">{wallet.points.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/rewards')}
                className="sn-card--premium p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Trophy size={20} className="text-amber-600" />
                </div>
                <span className="text-xs font-bold text-gray-700">المكافآت</span>
              </button>
              <button
                onClick={() => navigate('/store')}
                className="sn-card--premium p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <ShoppingBag size={20} className="text-blue-600" />
                </div>
                <span className="text-xs font-bold text-gray-700">المتجر</span>
              </button>
              <button
                onClick={() => navigate('/wallet/history')}
                className="sn-card--premium p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <History size={20} className="text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-gray-700">السجل</span>
              </button>
            </div>

            {/* Tier progress */}
            {tier.next && (
              <div className="sn-card--premium p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600">تقدّم المستوى</span>
                  <span className="text-xs text-gray-400">{wallet.points} / {tier.next}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${tier.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recent transactions */}
            <div className="sn-card--premium p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-gray-800">آخر المعاملات</h3>
                <button onClick={() => navigate('/wallet/history')} className="text-xs font-bold text-blue-600">عرض الكل</button>
              </div>
              {transactions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">لا توجد معاملات بعد</p>
              ) : (
                <div className="space-y-2.5">
                  {transactions.map((tx, i) => (
                    <div key={tx.id} className={`flex items-center gap-3 animate-sn-card sn-stagger-${i + 1}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.amount >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {tx.amount >= 0
                          ? <TrendingUp size={16} className="text-emerald-600" />
                          : <TrendingDown size={16} className="text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{tx.title}</p>
                        <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString('ar')}</p>
                      </div>
                      <span className={`text-sm font-black ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
