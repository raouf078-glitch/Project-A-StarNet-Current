import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck as CheckCircle2, Wallet, CreditCard, Landmark, ChevronLeft, ShoppingBag, Check } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getCart, createOrder, clearCart, fmtMoney } from '../lib/walletApi'

const PAYMENT_METHODS = [
  { id: 'wallet', label: 'محفظة ستار نت', icon: Wallet, color: 'text-blue-600 bg-blue-50' },
  { id: 'bank', label: 'تحويل بنكي', icon: Landmark, color: 'text-cyan-600 bg-cyan-50' },
  { id: 'card', label: 'بطاقة', icon: CreditCard, color: 'text-green-600 bg-green-50' },
]

export default function Checkout() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [method, setMethod] = useState('wallet')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getCart()
    setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const subtotal = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)
  const discount = 0
  const total = subtotal - discount

  const submit = async () => {
    setSubmitting(true)
    const orderItems = items.map(i => ({
      product_id: i.productId,
      title: i.product?.title,
      price: i.product?.price,
      quantity: i.quantity,
    }))
    const order = await createOrder({
      items: orderItems,
      subtotal,
      discount,
      total,
      paymentMethod: method,
    })
    setSubmitting(false)
    if (order) {
      await clearCart()
      setSuccess(order)
    }
  }

  if (success) {
    return (
      <div className="min-h-full flex flex-col">
        <PageHeader icon={CheckCircle2} title="تم الطلب" back onBack={() => navigate('/store')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-4 animate-fadeIn">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-1">تم إتمام الطلب بنجاح</h2>
          <p className="text-sm text-gray-400 mb-4">رقم الطلب: <span className="font-bold font-mono text-blue-600" dir="ltr">{success.order_number}</span></p>
          <div className="sn-card rounded-2xl p-4 w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">الإجمالي</span>
              <span className="font-bold text-gray-700" dir="ltr">{fmtMoney(success.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">طريقة الدفع</span>
              <span className="font-bold text-gray-700">{PAYMENT_METHODS.find(m => m.id === success.payment_method)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">الحالة</span>
              <span className="font-bold text-green-600">مكتمل</span>
            </div>
          </div>
          <div className="flex gap-2 mt-6 w-full max-w-xs">
            <button
              onClick={() => navigate('/wallet/orders')}
              className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition-transform"
            >
              سجل الطلبات
            </button>
            <button
              onClick={() => navigate('/store')}
              className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-transform"
            >
              متابعة التسوق
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <PageHeader icon={ShoppingBag} title="إتمام الشراء" back onBack={() => navigate('/store/cart')} />

      <div className="px-4 py-4 space-y-4 pb-28">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">السلة فارغة</p>
          </div>
        ) : (
          <>
            {/* Order items */}
            <div className="sn-card rounded-2xl p-4 space-y-2">
              <h3 className="font-bold text-gray-700 text-sm mb-1">مراجعة الطلب</h3>
              {items.map(item => (
                <div key={item.cartId} className="flex items-center gap-3 py-1.5">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {item.product?.image_url && <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 line-clamp-1">{item.product?.title}</p>
                    <p className="text-[11px] text-gray-400">الكمية: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-700" dir="ltr">{fmtMoney((item.product?.price || 0) * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Payment method */}
            <div className="sn-card rounded-2xl p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-3">طريقة الدفع</h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                      method === m.id ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                      <m.icon size={18} />
                    </div>
                    <span className="flex-1 text-right text-sm font-bold text-gray-700">{m.label}</span>
                    {method === m.id && <Check size={18} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="sn-card rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">المجموع الفرعي</span>
                <span className="font-bold text-gray-700" dir="ltr">{fmtMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">الخصم</span>
                <span className="font-bold text-green-600" dir="ltr">- {fmtMoney(discount)}</span>
              </div>
              <div className="border-t border-gray-50 pt-2 flex justify-between">
                <span className="font-bold text-gray-700">الإجمالي</span>
                <span className="font-black text-blue-600 text-lg" dir="ltr">{fmtMoney(total)}</span>
              </div>
            </div>

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري...</> : <><Check size={18} /> تأكيد الطلب</>}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
