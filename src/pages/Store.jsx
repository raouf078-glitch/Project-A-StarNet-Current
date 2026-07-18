import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ShoppingCart, Star, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getProducts, addToCart, getCart } from '../lib/store'

export default function Store() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [addedId, setAddedId] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const items = await getProducts()
        setProducts(items)
        setCartCount(getCart().reduce((s, i) => s + i.quantity, 0))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categories = ['all', ...new Set(products.map(p => p.category))]
  const filtered = products.filter(p => {
    const matchCat = category === 'all' || p.category === category
    const matchSearch = !search || p.title.includes(search) || (p.description || '').includes(search)
    return matchCat && matchSearch
  })

  function handleAdd(product) {
    addToCart(product)
    setCartCount(prev => prev + 1)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1000)
  }

  const catLabels = { all: 'الكل', subscriptions: 'اشتراكات', accessories: 'إكسسوارات', cards: 'بطاقات', services: 'خدمات', general: 'عام' }

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader
        icon={ShoppingBag}
        title="المتجر"
        subtitle="منتجات وخدمات ستار نت"
        back
        action={
          <button
            onClick={() => navigate('/cart')}
            className="relative w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ShoppingCart size={20} className="text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        }
      />

      <div className="px-4 py-4 space-y-3 animate-sn-enter">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث في المتجر..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {catLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <ShoppingBag size={48} className="mb-3 opacity-30" />
            <p className="font-semibold text-sm">لا توجد منتجات</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product, i) => (
              <div key={product.id} className={`sn-card--premium overflow-hidden animate-sn-card sn-stagger-${Math.min(i + 1, 5)}`}>
                {product.image_url && (
                  <div className="w-full h-28 bg-gray-100 overflow-hidden">
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2">{product.title}</p>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-0.5 mt-1">
                      <Star size={10} className="text-amber-400" fill="currentColor" />
                      <span className="text-[10px] text-gray-500">{product.rating}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-sm font-black text-blue-600">{Number(product.price).toLocaleString()} <span className="text-[10px] font-medium">ريال</span></p>
                      {product.old_price > 0 && product.old_price > product.price && (
                        <p className="text-[10px] text-gray-400 line-through">{Number(product.old_price).toLocaleString()}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(product)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                        addedId === product.id ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {addedId === product.id ? '✓' : <ShoppingCart size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
