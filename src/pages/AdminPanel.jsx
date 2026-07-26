import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Lock, Loader as Loader2, ShieldAlert, LogIn, Package, Boxes,
  Wallet, Bell, Tags, DollarSign, UserPlus, LogOut,
} from 'lucide-react'
import { auth } from '../lib/auth'
import PageHeader from '../components/PageHeader'
import AdminProducts from '../components/admin/AdminProducts'
import AdminCategories from '../components/admin/AdminCategories'
import AdminInventory from '../components/admin/AdminInventory'
import AdminDeposits from '../components/admin/AdminDeposits'
import AdminNotifications from '../components/admin/AdminNotifications'
import AdminWalletAdjust from '../components/admin/AdminWalletAdjust'
import AdminRegistrations from '../components/admin/AdminRegistrations'

const TABS = [
  { key: 'products', icon: Package, label: 'المنتجات' },
  { key: 'categories', icon: Tags, label: 'الأقسام' },
  { key: 'inventory', icon: Boxes, label: 'مخزون البطاقات' },
  { key: 'deposits', icon: DollarSign, label: 'الإيداعات' },
  { key: 'wallet', icon: Wallet, label: 'المحافظ' },
  { key: 'notifications', icon: Bell, label: 'الإشعارات' },
  { key: 'registrations', icon: UserPlus, label: 'طلبات التسجيل' },
]

function AdminGate({ children }) {
  const navigate = useNavigate()
  const [, setSession] = useState(auth.getSession())
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsub = auth.onAuthChange((sess) => {
      setSession(sess)
      setChecking(false)
    })
    return unsub
  }, [])

  if (checking) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[rgb(var(--color-bg))]">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (!auth.getSession()) {
    return (
      <div className="min-h-full bg-[rgb(var(--color-bg))]">
        <PageHeader icon={ShieldCheck} title="لوحة الإدارة" subtitle="منطقة خاصة بالإدارة" back onBack={() => navigate('/settings')} />
        <div className="px-6 py-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-5"><Lock size={38} className="text-blue-500" /></div>
          <h2 className="text-lg font-black text-gray-800">يجب تسجيل الدخول</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">سجّل الدخول بحساب الإدارة للوصول إلى لوحة التحكم.</p>
          <button
            onClick={async () => { setBusy(true); try { await auth.signInWithGoogle() } catch { setBusy(false) } }}
            disabled={busy}
            className="mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform disabled:opacity-60 shadow-lg shadow-blue-200"
          >
            {busy ? <><Loader2 size={18} className="animate-spin" /> جاري...</> : <><LogIn size={18} /> تسجيل الدخول بـ Google</>}
          </button>
        </div>
      </div>
    )
  }

  if (!auth.isAdmin()) {
    return (
      <div className="min-h-full bg-[rgb(var(--color-bg))]">
        <PageHeader icon={ShieldCheck} title="لوحة الإدارة" subtitle="منطقة خاصة بالإدارة" back onBack={() => navigate('/settings')} />
        <div className="px-6 py-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mb-5"><ShieldAlert size={38} className="text-rose-500" /></div>
          <h2 className="text-lg font-black text-gray-800">غير مصرّح لك بالدخول</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">هذه اللوحة خاصة بالمالك فقط. البريد المسموح: raouf078@gmail.com</p>
          <button
            onClick={async () => { await auth.signOut(); navigate('/settings') }}
            className="mt-6 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform"
          >
            <LogOut size={18} /> تسجيل الخروج
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('products')

  return (
    <AdminGate>
      <div className="min-h-full bg-[rgb(var(--color-bg))]">
        <PageHeader icon={ShieldCheck} title="لوحة الإدارة" subtitle="إدارة المنتجات والمخزون والمعاملات المالية" back onBack={() => navigate('/settings')} accent="emerald" />

        {/* Tab bar */}
        <div className="sticky top-0 z-20 bg-[rgb(var(--color-bg))]/95 backdrop-blur px-4 py-2.5 border-b border-gray-100">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${active ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-white text-gray-500 border border-gray-100'}`}
                >
                  <Icon size={15} /> {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-4 py-4">
          {tab === 'products' && <AdminProducts />}
          {tab === 'categories' && <AdminCategories />}
          {tab === 'inventory' && <AdminInventory />}
          {tab === 'deposits' && <AdminDeposits />}
          {tab === 'wallet' && <AdminWalletAdjust />}
          {tab === 'notifications' && <AdminNotifications />}
          {tab === 'registrations' && <AdminRegistrations />}
        </div>
      </div>
    </AdminGate>
  )
}
