import { useState, useEffect } from 'react'
import { ShoppingBag, Package, Clock, Check, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getOrders } from '../lib/store'

const STATUS_MAP = {
  pending: { label: 'قيد المعالجة', color: 'text-amber-600 bg-amber-50', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'text-blue-600 bg-blue-50', icon: Package },
  completed: { label: 'مكتمل', color: 'text-emerald-600 bg-emerald-50', icon: Check },
  cancelled: { label: 'ملغي', color: 'text-red-500 bg-red-50', icon: X },
}

export default function Purchases() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrders()
        setOrders(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={ShoppingBag} title="طلباتي" subtitle="سجل المشتريات والطلبات" back />

      <div className="px-4 py-4 space-y-3 animate-sn-enter">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <ShoppingBag size={56} className="mb-3 opacity-30" />
            <p className="font-semibold">لا توجد طلبات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending
              const StatusIcon = status.icon
              let items = []
              try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []) } catch {}

              return (
                <div key={order.id} className={`sn-card--premium p-4 animate-sn-card sn-stagger-${Math.min(i + 1, 5)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-gray-400">{order.order_number}</span>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                      <StatusIcon size={10} />
                      {status.label}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((item, j) => (
                      <p key={j} className="text-xs text-gray-600 truncate">
                        {item.title || item.name || 'منتج'} x{item.quantity || 1}
                      </p>
                    ))}
                    {items.length > 3 && <p className="text-[10px] text-gray-400">+{items.length - 3} منتجات أخرى</p>}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString('ar')}</span>
                    <span className="text-sm font-black text-blue-600">{Number(order.total).toLocaleString()} ريال</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
