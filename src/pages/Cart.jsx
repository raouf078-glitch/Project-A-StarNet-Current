import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Minus, Plus, Trash2, Tag, ArrowLeft, ShoppingBag } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getCart, updateCartQty, removeFromCart, fmtMoney } from '../lib/walletApi'

export default function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getCart()
    setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleQty = async (cartId, qty) => {
    await updateCartQty(cartId, qty)
    load()
  }

  const handleRemove = async (cartId) => {
    await removeFromCart(cartId)
    load()
  }

  const subtotal = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)
  const discount = 0
  const total = subtotal - discount

  return (
    <div className="min-h-full">
      <PageHeader icon={ShoppingCart} title="سلة التسوق" back onBack={() => navigate('/store')} />

      <div className="px-4 py-4 space-y-3 pb-28">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCart size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">سلتك فارغة</p>
            <button
              onClick={() => navigate('/store')}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-transform"
            >
              تصفح المنتجات
            </button>
          </div>
        ) : (
          <>
            {items.map(item => (
              <div key={item.cartId} className="sn-card rounded-2xl p-3 flex gap-3 animate-fadeIn">
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {item.product?.image_url && (
                    <img src={item.product.image_url} alt={item.product.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700 line-clamp-1">{item.product?.title}</p>
                  <p className="text-sm font-black text-blue-600 mt-0.5" dir="ltr">{fmtMoney(item.product?.price || 0)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-0.5">
                      <button
                        onClick={() => handleQty(item.cartId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Minus size={14} className="text-gray-600" />
                      </button>
                      <span className="w-8 text-center text-sm font-black text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => handleQty(item.cartId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Plus size={14} className="text-blue-600" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.cartId)}
                      className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Trash2 size={15} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="sn-card rounded-2xl p-4 space-y-2 mt-2">
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
              onClick={() => navigate('/store/checkout')}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} /> إتمام الشراء
            </button>
          </>
        )}
      </div>
    </div>
  )
}
