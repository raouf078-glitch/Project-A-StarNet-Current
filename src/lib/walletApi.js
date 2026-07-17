import { supabase } from './supabaseClient'

export { fmtMoney, fmtDate, fmtTime, dateKey } from './supabaseClient'

export const TX_TYPES = {
  deposit: { label: 'إيداع', icon: 'ArrowDownCircle', color: 'text-green-600 bg-green-50' },
  purchase: { label: 'شراء', icon: 'ShoppingBag', color: 'text-blue-600 bg-blue-50' },
  refund: { label: 'استرجاع', icon: 'RotateCcw', color: 'text-amber-600 bg-amber-50' },
  reward: { label: 'مكافأة', icon: 'Gift', color: 'text-sky-600 bg-sky-50' },
  transfer: { label: 'تحويل', icon: 'ArrowLeftRight', color: 'text-cyan-600 bg-cyan-50' },
}

export const TX_STATUS = {
  completed: { label: 'مكتمل', color: 'text-green-600 bg-green-100' },
  pending: { label: 'قيد المعالجة', color: 'text-amber-600 bg-amber-100' },
  failed: { label: 'فشل', color: 'text-red-500 bg-red-100' },
}

export const DEPOSIT_STATUS = {
  pending: { label: 'قيد المراجعة', color: 'text-amber-600 bg-amber-100' },
  approved: { label: 'تمت الموافقة', color: 'text-green-600 bg-green-100' },
  rejected: { label: 'مرفوض', color: 'text-red-500 bg-red-100' },
  cancelled: { label: 'ملغى', color: 'text-gray-500 bg-gray-100' },
}

export const ORDER_STATUS = {
  completed: { label: 'مكتمل', color: 'text-green-600 bg-green-100' },
  pending: { label: 'قيد المعالجة', color: 'text-amber-600 bg-amber-100' },
  cancelled: { label: 'ملغى', color: 'text-red-500 bg-red-100' },
}

export const CATEGORIES = [
  { key: 'internet-cards', label: 'كروت الإنترنت', icon: 'Wifi' },
  { key: 'subscriptions', label: 'الاشتراكات', icon: 'CalendarClock' },
  { key: 'devices', label: 'الأجهزة', icon: 'Router' },
  { key: 'accessories', label: 'الملحقات', icon: 'Cable' },
  { key: 'digital-services', label: 'الخدمات الرقمية', icon: 'MonitorSmartphone' },
  { key: 'offers', label: 'العروض', icon: 'Tag' },
]

export async function getWalletBalance() {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('amount')
  if (error) return 0
  return (data || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
}

export async function getTransactions(limit = 50) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data || []
}

export async function addTransaction(tx) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert({
      type: tx.type || 'purchase',
      title: tx.title,
      amount: tx.amount,
      status: tx.status || 'completed',
      category: tx.category || '',
      metadata: tx.metadata || {},
    })
    .select()
    .single()
  if (error) return null
  return data
}

export async function getDeposits() {
  const { data, error } = await supabase
    .from('deposits')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function createDeposit(d) {
  const { data, error } = await supabase
    .from('deposits')
    .insert({
      account_name: d.accountName,
      account_number: d.accountNumber,
      amount: d.amount,
      proof_url: d.proofUrl || '',
      notes: d.notes || '',
      status: 'pending',
    })
    .select()
    .single()
  if (error) return null
  await addTransaction({
    type: 'deposit',
    title: `إيداع - ${d.accountName}`,
    amount: d.amount,
    status: 'pending',
    category: 'deposit',
    metadata: { deposit_id: data?.id },
  })
  return data
}

export async function cancelDeposit(id) {
  const { data, error } = await supabase
    .from('deposits')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) return null
  return data
}

export async function getProducts(filters = {}) {
  let q = supabase.from('products').select('*')
  if (filters.category) q = q.eq('category', filters.category)
  if (filters.featured) q = q.eq('featured', true)
  if (filters.popular) q = q.eq('popular', true)
  if (filters.search) q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  q = q.order('created_at', { ascending: false })
  const { data, error } = await q
  if (error) return []
  return data || []
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) return null
  return data
}

export async function getCart() {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, product_id, quantity, created_at, products(*)')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data || []).map((r) => ({
    cartId: r.id,
    productId: r.product_id,
    quantity: r.quantity,
    product: r.products,
  }))
}

export async function addToCart(productId, quantity = 1) {
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('product_id', productId)
    .maybeSingle()
  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
    return !error
  }
  const { error } = await supabase
    .from('cart_items')
    .insert({ product_id: productId, quantity })
  return !error
}

export async function updateCartQty(cartId, quantity) {
  if (quantity <= 0) {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartId)
    return !error
  }
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartId)
  return !error
}

export async function removeFromCart(cartId) {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartId)
  return !error
}

export async function clearCart() {
  const { error } = await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  return !error
}

export async function getFavorites() {
  const { data, error } = await supabase
    .from('favorites')
    .select('id, product_id, created_at, products(*)')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data || []).map((r) => ({
    favId: r.id,
    productId: r.product_id,
    product: r.products,
  }))
}

export async function toggleFavorite(productId) {
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle()
  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id)
    return false
  }
  await supabase.from('favorites').insert({ product_id: productId })
  return true
}

export async function isFavorite(productId) {
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle()
  return !!data
}

export async function createOrder(order) {
  const orderNumber = 'SN-' + Date.now().toString(36).toUpperCase()
  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      total: order.total,
      status: 'completed',
      payment_method: order.paymentMethod || 'wallet',
    })
    .select()
    .single()
  if (error) return null
  await addTransaction({
    type: 'purchase',
    title: `طلب ${orderNumber}`,
    amount: -order.total,
    status: 'completed',
    category: 'purchase',
    metadata: { order_id: data?.id, order_number: orderNumber },
  })
  await addReward({ points: Math.floor(order.total / 1000), description: `نقاط من طلب ${orderNumber}`, type: 'earned' })
  return data
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function getRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function getRewardPoints() {
  const { data, error } = await supabase.from('rewards').select('points, type')
  if (error) return 0
  return (data || []).reduce((sum, r) => sum + (r.type === 'earned' ? r.points : -r.points), 0)
}

export async function addReward(r) {
  const { data, error } = await supabase
    .from('rewards')
    .insert({
      points: r.points,
      description: r.description,
      type: r.type || 'earned',
      campaign: r.campaign || '',
    })
    .select()
    .single()
  if (error) return null
  if (r.type !== 'redeemed') {
    await addTransaction({
      type: 'reward',
      title: r.description,
      amount: 0,
      status: 'completed',
      category: 'reward',
      metadata: { reward_id: data?.id, points: r.points },
    })
  }
  return data
}

export async function redeemReward(points, description) {
  return addReward({ points, description, type: 'redeemed' })
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
  return !error
}

export async function getRecentlyViewed() {
  try {
    const ids = JSON.parse(localStorage.getItem('sn_recently_viewed') || '[]')
    if (!ids.length) return []
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
    if (error) return []
    return ids.map((id) => data.find((p) => p.id === id)).filter(Boolean)
  } catch {
    return []
  }
}

export function trackRecentlyViewed(productId) {
  try {
    let ids = JSON.parse(localStorage.getItem('sn_recently_viewed') || '[]')
    ids = ids.filter((id) => id !== productId)
    ids.unshift(productId)
    ids = ids.slice(0, 10)
    localStorage.setItem('sn_recently_viewed', JSON.stringify(ids))
  } catch {}
}
