import { supabase } from './supabase'
import { getUserId } from './wallet'

const CART_KEY = 'starnet_cart'

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
  } catch { return [] }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function getCart() {
  return readCart()
}

export function addToCart(product, qty = 1) {
  const cart = readCart()
  const existing = cart.find(i => i.id === product.id)
  if (existing) {
    existing.quantity += qty
  } else {
    cart.push({ id: product.id, title: product.title, price: Number(product.price), image_url: product.image_url, quantity: qty })
  }
  writeCart(cart)
  return cart
}

export function updateCartQty(productId, qty) {
  let cart = readCart()
  if (qty <= 0) {
    cart = cart.filter(i => i.id !== productId)
  } else {
    const item = cart.find(i => i.id === productId)
    if (item) item.quantity = qty
  }
  writeCart(cart)
  return cart
}

export function removeFromCart(productId) {
  const cart = readCart().filter(i => i.id !== productId)
  writeCart(cart)
  return cart
}

export function clearCart() {
  writeCart([])
}

export function getCartTotal(cart) {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function getCartCount(cart) {
  return cart.reduce((sum, i) => sum + i.quantity, 0)
}

// Fetch active products, ordered by display/creation
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('availability', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

// Available stock = count of unused inventory items for a card
export async function getCardStock(cardId) {
  const { count, error } = await supabase
    .from('card_inventory')
    .select('id', { count: 'exact', head: true })
    .eq('card_id', cardId)
    .eq('is_used', false)

  if (error) throw error
  return count || 0
}

// Atomic purchase via RPC — wallet balance payment
export async function purchaseCardWithWallet(cardId) {
  const userId = getUserId()
  const { data, error } = await supabase.rpc('purchase_card_v2', {
    p_card_id: cardId,
    p_user_id: userId,
  })

  if (error) throw error
  return data
}

// Atomic purchase via RPC — gems payment
export async function purchaseCardWithGems(cardId) {
  const userId = getUserId()
  const { data, error } = await supabase.rpc('purchase_card_with_gems', {
    p_card_id: cardId,
    p_user_id: userId,
  })

  if (error) throw error
  return data
}

// Purchase history — card sales with product details
export async function getCardSales() {
  const userId = getUserId()
  const { data, error } = await supabase
    .from('card_sales')
    .select(`
      *,
      card:products(id, title, description, image_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getSaleDetails(saleId) {
  const { data, error } = await supabase
    .from('card_sales')
    .select(`
      *,
      card:products(id, title, description, image_url)
    `)
    .eq('id', saleId)
    .maybeSingle()

  if (error) throw error
  return data
}

// Legacy order creation (kept for backward compat with Checkout page)
export async function createOrder({ items, total, paymentMethod, pointsUsed = 0 }) {
  const orderNumber = 'SN-' + Date.now().toString(36).toUpperCase()
  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      items: JSON.stringify(items),
      subtotal: total,
      total,
      discount: 0,
      status: 'completed',
      payment_method: paymentMethod,
    })
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
