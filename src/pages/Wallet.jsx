import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet as WalletIcon, CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, Gift, ShoppingBag, RotateCcw, ArrowLeftRight, Clock, TrendingUp, TrendingDown, ChevronLeft, Plus, Tag, Headphones, History, Wifi } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import {
  getWalletBalance, getTransactions, TX_TYPES, TX_STATUS,
  fmtMoney, fmtDate, fmtTime,
} from '../lib/walletApi'

const QUICK_ACTIONS = [
  { icon: Plus, label: 'إيداع', path: '/deposit-wallet', color: 'text-green-600 bg-green-50' },
  { icon: ArrowLeftRight, label: 'تحويل', path: '/wallet/transfer', color: 'text-cyan-600 bg-cyan-50' },
  { icon: Wifi, label: 'كارت إنترنت', path: '/store?category=internet-cards', color: 'text-blue-600 bg-blue-50' },
  { icon: ShoppingBag, label: 'المنتجات', path: '/store', color: 'text-sky-600 bg-sky-50' },
  { icon: History, label: 'المعاملات', path: '/wallet/transactions', color: 'text-blue-600 bg-blue-50' },
  { icon: Gift, label: 'المكافآت', path: '/wallet/rewards', color: 'text-amber-600 bg-amber-50' },
  { icon: Headphones, label: 'الدعم', path: '/wallet/support', color: 'text-teal-600 bg-teal-50' },
  { icon: Tag, label: 'العروض', path: '/offers', color: 'text-rose-600 bg-rose-50' },
]

const ICON_MAP = {
  ArrowDownCircle, ArrowUpCircle, Gift, ShoppingBag, RotateCcw, ArrowLeftRight,
}

export default function Wallet() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ income: 0, expense: 0, count: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    const [bal, txs] = await Promise.all([
      getWalletBalance(),
      getTransactions(5),
    ])
    setBalance(bal)
    setTransactions(txs)
    const allTxs = await getTransactions(100)
    const income = allTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const expense = allTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    setStats({ income, expense, count: allTxs.length })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-full">
      <PageHeader icon={WalletIcon} title="المحفظة" subtitle="رصيدك ومعاملاتك المالية" />

      <div className="px-4 py-4 space-y-4 pb-28">
        {/* Premium wallet card */}
        <div className="relative rounded-3xl overflow-hidden shadow-glow animate-fadeIn">
          <div className="absolute inset-0 page-hero" />
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-3xl animate-glow" />
          <div className="absolute -bottom-12 -left-4 w-44 h-44 rounded-full bg-sky-300/15 blur-3xl" />
          <div className="relative p-5 text-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/70 text-xs font-semibold">الرصيد الحالي</p>
                <p className="text-3xl font-black mt-1 tracking-tight" dir="ltr">{fmtMoney(balance)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <WalletIcon size={24} />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-white/60">حساب</p>
                <p className="font-bold">ستار نت</p>
              </div>
              <div className="text-center">
                <p className="text-white/60">رقم الحساب</p>
                <p className="font-bold font-mono" dir="ltr">SN-{Math.abs(balance).toString().padStart(8, '0').slice(0, 8)}</p>
              </div>
              <div className="text-left">
                <p className="text-white/60">الحالة</p>
                <p className="font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> نشط
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="sn-card rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="sn-card rounded-2xl p-3 text-center">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-1.5">
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-semibold">دخل</p>
            <p className="text-sm font-black text-gray-800" dir="ltr">{fmtMoney(stats.income)}</p>
          </div>
          <div className="sn-card rounded-2xl p-3 text-center">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-1.5">
              <TrendingDown size={16} className="text-red-500" />
            </div>
            <p className="text-[10px] text-gray-400 font-semibold">مصروف</p>
            <p className="text-sm font-black text-gray-800" dir="ltr">{fmtMoney(stats.expense)}</p>
          </div>
          <div className="sn-card rounded-2xl p-3 text-center">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-1.5">
              <Clock size={16} className="text-blue-600" />
            </div>
            <p className="text-[10px] text-gray-400 font-semibold">معاملات</p>
            <p className="text-sm font-black text-gray-800">{stats.count}</p>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="sn-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
            <span className="font-bold text-gray-700 text-sm">أحدث المعاملات</span>
            <button onClick={() => navigate('/wallet/transactions')} className="text-xs font-bold text-blue-600 flex items-center gap-0.5 active:opacity-70">
              عرض الكل <ChevronLeft size={14} />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">جاري التحميل...</div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center">
                <WalletIcon size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">لا توجد معاملات بعد</p>
              </div>
            ) : (
              transactions.map((tx) => {
                const t = TX_TYPES[tx.type] || TX_TYPES.purchase
                const s = TX_STATUS[tx.status] || TX_STATUS.completed
                const Icon = ICON_MAP[t.icon] || ShoppingBag
                const isCredit = tx.amount > 0
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700 truncate">{tx.title}</p>
                      <p className="text-[11px] text-gray-400">{fmtDate(tx.created_at)} · {fmtTime(tx.created_at)}</p>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-black ${isCredit ? 'text-green-600' : 'text-red-500'}`} dir="ltr">
                        {isCredit ? '+' : ''}{fmtMoney(tx.amount)}
                      </p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
