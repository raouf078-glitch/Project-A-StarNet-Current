import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Wallet, Star, Check, ShoppingBag } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getCart, getCartTotal, clearCart, createOrder } from '../lib/store'
import { getOrCreateWallet, deductFunds, spendPoints, POINTS_PER_RIYAL } from '../lib/wallet'

const METHODS = [
  { key: 'wallet', label: 'المحفظة', icon: Wallet, desc: 'الدفع من رصيد المحفظة' },
  { key: 'points', label: 'النقاط', icon: Star, desc: 'الدفع بالنقاط المتوفرة' },
  { key: 'bank_deposit', label: 'إيداع بنكي', icon: CreditCard, desc: 'تحويل بنكي عبر واتساب' },
]

export default function Checkout() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [wallet, setWallet] = useState(null)
  const [method, setMethod] = useState('wallet')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setCart(getCart())
        const w = await getOrCreateWallet()
        setWallet(w)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const total = getCartTotal(cart)
  const pointsNeeded = total * POINTS_PER_RIYAL
  const canPayWallet = wallet && Number(wallet.balance) >= total
  const canPayPoints = wallet && wallet.points >= pointsNeeded

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    try {
      if (method === 'wallet') {
        await deductFunds(total, 'شراء من المتجر')
      } else if (method === 'points') {
        await spendPoints(pointsNeeded, 'شراء من المتجر بالنقاط')
      }

      await createOrder({
        items: cart,
        total,
        paymentMethod: method,
        pointsUsed: method === 'points' ? pointsNeeded : 0,
      })

      clearCart()
      setSuccess(true)
    } catch (e) {
      alert(e.message || 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-full bg-[rgb(var(--color-bg))] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4 animate-sn-enter">
          <Check size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-black text-gray-800 mb-2">تم الطلب بنجاح!</h2>
        <p className="text-sm text-gray-500 mb-6">سيتم معالجة طلبك في أقرب وقت.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/purchases')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform">
            طلباتي
          </button>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm active:scale-95 transition-transform">
            الرئيسية
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={CreditCard} title="إتمام الطلب" subtitle="اختر طريقة الدفع" back />

      <div className="px-4 py-4 space-y-4 animate-sn-enter">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Order summary */}
            <div className="sn-card--premium p-4">
              <h3 className="text-sm font-black text-gray-800 mb-2">ملخص الطلب</h3>
              <div className="space-y-1.5">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{item.title} x{item.quantity}</span>
                    <span className="font-bold text-gray-700">{(item.price * item.quantity).toLocaleString()} ريال</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-3 pt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">الإجمالي</span>
                <span className="text-lg font-black text-blue-600">{total.toLocaleString()} ريال</span>
              </div>
            </div>

            {/* Payment methods */}
            <div>
              <h3 className="text-sm font-black text-gray-800 mb-2.5 px-1">طريقة الدفع</h3>
              <div className="space-y-2">
                {METHODS.map(m => {
                  const disabled = (m.key === 'wallet' && !canPayWallet) || (m.key === 'points' && !canPayPoints)
                  return (
                    <button
                      key={m.key}
                      onClick={() => !disabled && setMethod(m.key)}
                      disabled={disabled}
                      className={`w-full sn-card--premium p-3.5 flex items-center gap-3 transition-all active:scale-[0.98] ${
                        method === m.key ? 'ring-2 ring-blue-500' : ''
                      } ${disabled ? 'opacity-50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method === m.key ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <m.icon size={20} className={method === m.key ? 'text-blue-600' : 'text-gray-500'} />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-bold text-gray-700">{m.label}</p>
                        <p className="text-[11px] text-gray-400">{m.desc}</p>
                        {m.key === 'wallet' && wallet && (
                          <p className="text-[10px] text-blue-600 font-semibold mt-0.5">رصيدك: {Number(wallet.balance).toLocaleString()} ريال</p>
                        )}
                        {m.key === 'points' && wallet && (
                          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">نقاطك: {wallet.points.toLocaleString()} (يلزم {pointsNeeded.toLocaleString()})</p>
                        )}
                      </div>
                      {method === m.key && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            {method === 'bank_deposit' ? (
              <button
                onClick={() => navigate('/deposit')}
                className="w-full bg-gradient-to-l from-emerald-600 to-emerald-500 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
              >
                <CreditCard size={20} />
                الانتقال لصفحة الإيداع
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || (method === 'wallet' && !canPayWallet) || (method === 'points' && !canPayPoints)}
                className="w-full bg-gradient-to-l from-blue-700 to-blue-500 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg disabled:opacity-50"
                style={{ boxShadow: 'var(--sn-btn-shadow)' }}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={20} />
                    تأكيد الطلب
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
