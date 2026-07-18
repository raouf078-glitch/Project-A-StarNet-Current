import { useState, useEffect } from 'react'
import { History, TrendingUp, TrendingDown, ListFilter as Filter } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getTransactions } from '../lib/wallet'

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'deposit', label: 'إيداع' },
  { key: 'purchase', label: 'شراء' },
  { key: 'points', label: 'نقاط' },
]

export default function WalletHistory() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const txs = await getTransactions(50)
        setTransactions(txs)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(tx => {
        if (filter === 'deposit') return tx.type === 'deposit' || tx.amount > 0
        if (filter === 'purchase') return tx.type === 'purchase'
        if (filter === 'points') return tx.category === 'points'
        return true
      })

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={History} title="سجل المعاملات" subtitle="جميع العمليات المالية" back />

      <div className="px-4 py-4 space-y-3 animate-sn-enter">
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <History size={48} className="mb-3 opacity-30" />
            <p className="font-semibold text-sm">لا توجد معاملات</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((tx, i) => (
              <div key={tx.id} className={`sn-card--premium p-3.5 flex items-center gap-3 animate-sn-card sn-stagger-${Math.min(i + 1, 5)}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.amount >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {tx.amount >= 0
                    ? <TrendingUp size={18} className="text-emerald-600" />
                    : <TrendingDown size={18} className="text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700 truncate">{tx.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString('ar')}</span>
                    {tx.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{tx.category}</span>}
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className={`text-sm font-black ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.amount >= 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                  </p>
                  <p className={`text-[10px] font-semibold ${tx.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {tx.status === 'completed' ? 'مكتمل' : 'معلّق'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
