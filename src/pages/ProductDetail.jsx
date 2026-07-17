import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ShoppingBag, Heart, Star, Minus, Plus, Check, ChevronLeft, Truck,
  Shield, RotateCcw, Tag, Store as StoreIcon,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import {
  getProduct, getProducts, addToCart, toggleFavorite, isFavorite,
  trackRecentlyViewed, fmtMoney, CATEGORIES,
} from '../lib/walletApi'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [fav, setFav] = useState(false)
  const [added, setAdded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [p, favStatus] = await Promise.all([getProduct(id), isFavorite(id)])
    setProduct(p)
    setFav(favStatus)
    if (p) {
      trackRecentlyViewed(p.id)
      const all = await getProducts({ category: p.category })
      setRelated(all.filter(r => r.id !== p.id).slice(0, 4))
      const gallery = p.gallery && p.gallery.length > 0 ? p.gallery : [p.image_url]
      setGalleryIdx(Math.min(0, gallery.length - 1))
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const handleAddToCart = async () => {
    if (!product) return
    await addToCart(product.id, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleFav = async () => {
    if (!product) return
    const newFav = await toggleFavorite(product.id)
    setFav(newFav)
  }

  if (loading) {
    return (
      <div className="min-h-full">
        <PageHeader icon={ShoppingBag} title="تفاصيل المنتج" back onBack={() => navigate('/store')} />
        <div className="py-12 text-center text-gray-400 text-sm">جاري التحميل...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-full">
        <PageHeader icon={ShoppingBag} title="تفاصيل المنتج" back onBack={() => navigate('/store')} />
        <div className="py-12 text-center">
          <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">المنتج غير موجود</p>
        </div>
      </div>
    )
  }

  const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image_url]
  const cat = CATEGORIES.find(c => c.key === product.category)
  const specs = product.specs || {}

  return (
    <div className="min-h-full">
      <PageHeader icon={ShoppingBag} title={product.title} back onBack={() => navigate('/store')} />

      <div className="pb-28">
        {/* Gallery */}
        <div className="relative bg-gray-100 h-72 overflow-hidden">
          {gallery[galleryIdx] ? (
            <img src={gallery[galleryIdx]} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag size={48} className="text-gray-300" />
            </div>
          )}
          <button
            onClick={handleFav}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center active:scale-90 transition-transform"
          >
            <Heart size={18} className={fav ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
          </button>
          {product.old_price > product.price && (
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
              خصم {Math.round((1 - product.price / product.old_price) * 100)}%
            </span>
          )}
        </div>
        {gallery.length > 1 && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto">
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setGalleryIdx(i)}
                className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === galleryIdx ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-4 space-y-4">
          {/* Title + price */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              {cat && <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{cat.label}</span>}
              {product.rating > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-gray-500">{product.rating}</span>
                </div>
              )}
            </div>
            <h1 className="text-lg font-black text-gray-800">{product.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-black text-blue-600" dir="ltr">{fmtMoney(product.price)}</p>
              {product.old_price > product.price && (
                <p className="text-sm text-gray-400 line-through" dir="ltr">{fmtMoney(product.old_price)}</p>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className={`flex items-center gap-2 text-sm font-bold ${product.availability ? 'text-green-600' : 'text-red-500'}`}>
            <span className={`w-2 h-2 rounded-full ${product.availability ? 'bg-green-500' : 'bg-red-500'}`} />
            {product.availability ? 'متوفر' : 'غير متوفر'}
          </div>

          {/* Description */}
          {product.description && (
            <div className="sn-card rounded-2xl p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-1.5">الوصف</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Specs */}
          {Object.keys(specs).length > 0 && (
            <div className="sn-card rounded-2xl p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-2">المواصفات</h3>
              <div className="space-y-2">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-bold text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Truck, label: 'توصيل سريع' },
              { icon: Shield, label: 'ضمان' },
              { icon: RotateCcw, label: 'استرجاع' },
            ].map(b => (
              <div key={b.label} className="sn-card rounded-xl p-2.5 flex flex-col items-center gap-1">
                <b.icon size={18} className="text-blue-600" />
                <span className="text-[10px] font-bold text-gray-500">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3">
            <div className="sn-card rounded-2xl flex items-center gap-1 p-1">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Minus size={16} className="text-gray-600" />
              </button>
              <span className="w-10 text-center font-black text-gray-800">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Plus size={16} className="text-blue-600" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!product.availability}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                added ? 'bg-green-500' : 'bg-blue-600'
              }`}
            >
              {added ? <><Check size={18} /> تمت الإضافة</> : <><ShoppingBag size={18} /> أضف للسلة</>}
            </button>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 text-sm mb-2 px-1">منتجات ذات صلة</h3>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                {related.map(r => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/store/product/${r.id}`)}
                    className="shrink-0 w-40 sn-card rounded-2xl overflow-hidden text-right active:scale-95 transition-transform"
                  >
                    <div className="h-24 bg-gray-100">
                      {r.image_url && <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" loading="lazy" />}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-bold text-gray-700 line-clamp-1">{r.title}</p>
                      <p className="text-xs font-black text-blue-600 mt-0.5" dir="ltr">{fmtMoney(r.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
