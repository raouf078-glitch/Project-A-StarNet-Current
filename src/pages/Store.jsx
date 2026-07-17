import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Store as StoreIcon, Search, Wifi, CalendarClock, Router, Cable,
  MonitorSmartphone, Tag, ChevronLeft, Star, Heart, ShoppingBag, TrendingUp, Sparkles, X,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import {
  getProducts, getRecentlyViewed, CATEGORIES, fmtMoney,
} from '../lib/walletApi'

const CAT_ICONS = { Wifi, CalendarClock, Router, Cable, MonitorSmartphone, Tag }

export default function Store() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState(params.get('category') || 'all')
  const [showSearch, setShowSearch] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [all, recent] = await Promise.all([getProducts(), getRecentlyViewed()])
    setProducts(all)
    setRecent(recent)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const cat = params.get('category')
    if (cat) setActiveCat(cat)
  }, [params])

  const filtered = useMemo(() => {
    let list = products
    if (activeCat !== 'all') list = list.filter(p => p.category === activeCat)
    if (search) list = list.filter(p => p.title.includes(search) || (p.description || '').includes(search))
    return list
  }, [products, activeCat, search])

  const featured = products.filter(p => p.featured)
  const popular = products.filter(p => p.popular)

  const selectCat = (cat) => {
    setActiveCat(cat)
    if (cat === 'all') setParams({})
    else setParams({ category: cat })
  }

  return (
    <div className="min-h-full">
      <PageHeader icon={StoreIcon} title="متجر ستار نت" subtitle="كروت واشتراكات وأجهزة" />

      <div className="px-4 py-4 space-y-4 pb-28">
        {/* Search bar */}
        <div className="relative">
          <div className="sn-card rounded-2xl flex items-center gap-2 px-4 py-3">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-300 active:scale-90">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            onClick={() => selectCat('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
              activeCat === 'all' ? 'bg-blue-600 text-white shadow-md' : 'sn-card text-gray-500'
            }`}
          >
            الكل
          </button>
          {CATEGORIES.map(c => {
            const Icon = CAT_ICONS[c.icon] || Tag
            return (
              <button
                key={c.key}
                onClick={() => selectCat(c.key)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  activeCat === c.key ? 'bg-blue-600 text-white shadow-md' : 'sn-card text-gray-500'
                }`}
              >
                <Icon size={13} /> {c.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">جاري التحميل...</div>
        ) : search || activeCat !== 'all' ? (
          /* Search/Filter results */
          <div className="grid grid-cols-2 gap-3 animate-fadeIn">
            {filtered.length === 0 ? (
              <div className="col-span-2 py-12 text-center">
                <Search size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">لا توجد منتجات مطابقة</p>
              </div>
            ) : (
              filtered.map(p => <ProductCard key={p.id} product={p} navigate={navigate} />)
            )}
          </div>
        ) : (
          <>
            {/* Featured banner */}
            {featured.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
                    <Sparkles size={16} className="text-amber-500" /> مميز
                  </h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                  {featured.map(p => (
                    <div key={p.id} className="shrink-0 w-64">
                      <ProductCard product={p} navigate={navigate} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular */}
            {popular.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-700 text-sm mb-2 px-1 flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-blue-500" /> الأكثر مبيعاً
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {popular.slice(0, 4).map(p => <ProductCard key={p.id} product={p} navigate={navigate} />)}
                </div>
              </div>
            )}

            {/* Recently viewed */}
            {recent.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-700 text-sm mb-2 px-1">شوهد مؤخراً</h3>
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                  {recent.slice(0, 6).map(p => (
                    <div key={p.id} className="shrink-0 w-40">
                      <ProductCard product={p} navigate={navigate} compact />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All products */}
            <div>
              <h3 className="font-bold text-gray-700 text-sm mb-2 px-1">جميع المنتجات</h3>
              <div className="grid grid-cols-2 gap-3">
                {products.map(p => <ProductCard key={p.id} product={p} navigate={navigate} />)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, navigate, compact }) {
  const [fav, setFav] = useState(false)
  return (
    <div className={`sn-card rounded-2xl overflow-hidden active:scale-95 transition-transform cursor-pointer ${compact ? '' : ''}`}
      onClick={() => navigate(`/store/product/${product.id}`)}
    >
      <div className="relative">
        <div className={`${compact ? 'h-24' : 'h-32'} bg-gray-100 overflow-hidden`}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag size={32} className="text-gray-300" />
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setFav(!fav) }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center active:scale-90 transition-transform"
        >
          <Heart size={15} className={fav ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
        </button>
        {product.old_price > product.price && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
            خصم
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className={`font-bold text-gray-700 leading-tight ${compact ? 'text-xs' : 'text-sm'} line-clamp-1`}>{product.title}</p>
        {!compact && <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{product.description}</p>}
        <div className="flex items-center justify-between mt-1.5">
          <p className={`font-black text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`} dir="ltr">{fmtMoney(product.price)}</p>
          {product.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold text-gray-500">{product.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
