import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ChevronLeft, Receipt, Headphones, Package } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getOrders, ORDER_STATUS, fmtMoney, fmtDate, fmtTime } from '../lib/walletApi'

export default function PurchaseHistory() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getOrders()
    setOrders(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-full">
      <PageHeader icon={Package} title="سجل الطلبات" subtitle="مشترياتك السابقة" back onBack={() => navigate('/wallet')} />

      <div className="px-4 py-4 space-y-3 pb-28">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">لا توجد طلبات بعد</p>
            <button
              onClick={() => navigate('/store')}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-transform"
            >
              تصفح المنتجات
            </button>
          </div>
        ) : (
          orders.map(order => {
            const s = ORDER_STATUS[order.status] || ORDER_STATUS.completed
            const isOpen = expanded === order.id
            return (
              <div key={order.id} className="sn-card rounded-2xl overflow-hidden animate-fadeIn">
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full flex items-center gap-3 p-3 active:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Package size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-bold text-gray-700 font-mono" dir="ltr">{order.order_number}</p>
                    <p className="text-[11px] text-gray-400">{fmtDate(order.created_at)} · {fmtTime(order.created_at)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-blue-600" dir="ltr">{fmtMoney(order.total)}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                  </div>
                  <ChevronLeft size={16} className={`text-gray-300 transition-transform ${isOpen ? '-rotate-90' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 pt-1 space-y-2 border-t border-gray-50 animate-fadeIn">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <ShoppingBag size={14} className="text-gray-300 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 line-clamp-1">{item.title}</p>
                          <p className="text-[10px] text-gray-400">{item.quantity} × {fmtMoney(item.price)}</p>
                        </div>
                        <p className="text-xs font-bold text-gray-600" dir="ltr">{fmtMoney(item.price * item.quantity)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-50">
                      <span className="text-gray-400">الإجمالي</span>
                      <span className="font-black text-blue-600" dir="ltr">{fmtMoney(order.total)}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold active:scale-95 transition-transform">
                        <Receipt size={14} /> الإيصال
                      </button>
                      <button
                        onClick={() => navigate('/wallet/support')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold active:scale-95 transition-transform"
                      >
                        <Headphones size={14} /> دعم
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
