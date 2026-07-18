import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getCart, updateCartQty, removeFromCart, getCartTotal, getCartCount } from '../lib/store'

export default function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])

  useEffect(() => {
    setCart(getCart())
  }, [])

  const total = getCartTotal(cart)
  const count = getCartCount(cart)

  function handleQty(id, delta) {
    const item = cart.find(i => i.id === id)
    if (!item) return
    const newQty = item.quantity + delta
    const updated = updateCartQty(id, newQty)
    setCart(updated)
  }

  function handleRemove(id) {
    const updated = removeFromCart(id)
    setCart(updated)
  }

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={ShoppingCart} title="السلة" subtitle={`${count} منتج`} back />

      <div className="px-4 py-4 space-y-3 animate-sn-enter">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <ShoppingBag size={56} className="mb-3 opacity-30" />
            <p className="font-semibold">السلة فارغة</p>
            <button
              onClick={() => navigate('/store')}
              className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
            >
              تصفّح المتجر
            </button>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="space-y-2.5">
              {cart.map((item, i) => (
                <div key={item.id} className={`sn-card--premium p-3 flex items-center gap-3 animate-sn-card sn-stagger-${Math.min(i + 1, 5)}`}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 truncate">{item.title}</p>
                    <p className="text-xs font-black text-blue-600 mt-0.5">{Number(item.price).toLocaleString()} ريال</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Plus size={12} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center active:scale-90 transition-transform mr-1"
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="sn-card--premium p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">المجموع الفرعي</span>
                <span className="text-sm font-bold text-gray-700">{total.toLocaleString()} ريال</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">الإجمالي</span>
                <span className="text-lg font-black text-blue-600">{total.toLocaleString()} ريال</span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gradient-to-l from-blue-700 to-blue-500 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
              style={{ boxShadow: 'var(--sn-btn-shadow)' }}
            >
              <ShoppingCart size={20} />
              إتمام الطلب — {total.toLocaleString()} ريال
            </button>
          </>
        )}
      </div>
    </div>
  )
}
