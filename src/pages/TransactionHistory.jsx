import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, Gift, ShoppingBag, RotateCcw, ArrowLeftRight, ChevronDown, History } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import {
  getTransactions, TX_TYPES, TX_STATUS, fmtMoney, fmtDate, fmtTime, dateKey,
} from '../lib/walletApi'

const ICON_MAP = {
  ArrowDownCircle, ArrowUpCircle, Gift, ShoppingBag, RotateCcw, ArrowLeftRight,
}

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'deposit', label: 'إيداعات' },
  { key: 'purchase', label: 'مشتريات' },
  { key: 'refund', label: 'استرجاع' },
  { key: 'reward', label: 'مكافآت' },
]

export default function TransactionHistory() {
  const navigate = useNavigate()
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getTransactions(200)
    setTxs(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter)

  const groups = {}
  for (const tx of filtered) {
    const key = dateKey(tx.created_at)
    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  }
  const groupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  return (
    <div className="min-h-full">
      <PageHeader icon={History} title="سجل المعاملات" subtitle="جميع معاملاتك المالية" back onBack={() => navigate('/wallet')} />

      <div className="px-4 py-4 space-y-3 pb-28">
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                filter === f.key ? 'bg-blue-600 text-white shadow-md' : 'sn-card text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <History size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">لا توجد معاملات</p>
          </div>
        ) : (
          groupKeys.map(key => (
            <div key={key} className="space-y-1.5 animate-fadeIn">
              <p className="text-xs font-bold text-gray-400 px-2 py-1 sticky top-0 bg-[rgb(var(--color-bg))]/80 backdrop-blur z-10">
                {fmtDate(key)}
              </p>
              {groups[key].map(tx => {
                const t = TX_TYPES[tx.type] || TX_TYPES.purchase
                const s = TX_STATUS[tx.status] || TX_STATUS.completed
                const Icon = ICON_MAP[t.icon] || ShoppingBag
                const isCredit = tx.amount > 0
                const isOpen = expanded === tx.id
                return (
                  <div key={tx.id} className="sn-card rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpanded(isOpen ? null : tx.id)}
                      className="w-full flex items-center gap-3 p-3 active:bg-gray-50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-bold text-gray-700 truncate">{tx.title}</p>
                        <p className="text-[11px] text-gray-400">{fmtTime(tx.created_at)}</p>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-black ${isCredit ? 'text-green-600' : 'text-red-500'}`} dir="ltr">
                          {isCredit ? '+' : ''}{fmtMoney(tx.amount)}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                      </div>
                      <ChevronDown size={16} className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3 pt-1 space-y-1.5 border-t border-gray-50 animate-fadeIn">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">النوع</span>
                          <span className="font-bold text-gray-600">{t.label}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">التاريخ</span>
                          <span className="font-bold text-gray-600">{fmtDate(tx.created_at)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">الوقت</span>
                          <span className="font-bold text-gray-600">{fmtTime(tx.created_at)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">الحالة</span>
                          <span className={`font-bold ${s.color.split(' ')[0]}`}>{s.label}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
