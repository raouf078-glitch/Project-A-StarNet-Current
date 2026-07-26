import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Lock, LogIn, Package, Boxes, Wallet, Bell, Tags, DollarSign, Users, Loader as Loader2, ShieldAlert } from 'lucide-react'
import { auth } from '../lib/auth'
import PageHeader from '../components/PageHeader'
import AdminProducts from '../components/admin/AdminProducts'
import AdminCategories from '../components/admin/AdminCategories'
import AdminInventory from '../components/admin/AdminInventory'
import AdminDeposits from '../components/admin/AdminDeposits'
import AdminNotifications from '../components/admin/AdminNotifications'
import AdminWalletAdjust from '../components/admin/AdminWalletAdjust'

const TABS = [
  { key: 'products', icon: Package, label: 'المنتجات', color: 'bg-blue-50 text-blue-600' },
  { key: 'categories', icon: Tags, label: 'الأقسام', color: 'bg-indigo-50 text-indigo-600' },
  { key: 'inventory', icon: Boxes, label: 'مخزون البطاقات', color: 'bg-teal-50 text-teal-600' },
  { key: 'deposits', icon: DollarSign, label: 'طلبات الإيداع', color: 'bg-amber-50 text-amber-600' },
  { key: 'wallet', icon: Wallet, label: 'تعديل الأرصدة', color: 'bg-emerald-50 text-emerald-600' },
  { key: 'notifications', icon: Bell, label: 'الإشعارات', color: 'bg-rose-50 text-rose-600' },
]

function AdminGate({ children }) {
  const navigate = useNavigate()
  const [, setSession] = useState(auth.getSession())
  const [checking, setChecking] = useState(true)

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
          <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">سجّل الدخول بحساب إداري للوصول إلى لوحة الإدارة.</p>
          <button onClick={() => navigate('/wallet')} className="mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-blue-200">
            <LogIn size={18} /> تسجيل الدخول
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
          <h2 className="text-lg font-black text-gray-800">لا تملك صلاحية الإدارة</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">هذا الحساب ليس له دور إداري. تواصل مع المسؤول لمنحك صلاحية admin أو manager.</p>
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
        </div>
      </div>
    </AdminGate>
  )
}
