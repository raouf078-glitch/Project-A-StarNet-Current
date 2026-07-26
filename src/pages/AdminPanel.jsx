import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useState as useReactState } from 'react'
import {
  ShieldCheck, Lock, Loader as Loader2, ShieldAlert, LogIn, Package, Boxes,
  Wallet, Bell, Tags, DollarSign, UserPlus, LogOut, KeyRound, Mail, Eye, EyeOff,
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
import AdminPasswordReset from '../components/admin/AdminPasswordReset'

const TABS = [
  { key: 'products', icon: Package, label: 'المنتجات' },
  { key: 'categories', icon: Tags, label: 'الأقسام' },
  { key: 'inventory', icon: Boxes, label: 'مخزون البطاقات' },
  { key: 'deposits', icon: DollarSign, label: 'الإيداعات' },
  { key: 'wallet', icon: Wallet, label: 'المحافظ' },
  { key: 'notifications', icon: Bell, label: 'الإشعارات' },
  { key: 'registrations', icon: UserPlus, label: 'طلبات التسجيل' },
  { key: 'passwords', icon: KeyRound, label: 'إعادة كلمات المرور' },
]

function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useReactState('')
  const [password, setPassword] = useReactState('')
  const [showPwd, setShowPwd] = useReactState(false)
  const [busy, setBusy] = useReactState(false)
  const [error, setError] = useReactState('')

  const login = async () => {
    if (busy) return
    setError('')
    if (!email.trim() || !password) { setError('أدخل البريد وكلمة المرور'); return }
    setBusy(true)
    try {
      await auth.signInWithAdmin(email.trim(), password)
      onSuccess?.()
    } catch (e) {
      setError(e.message || 'تعذّر تسجيل الدخول')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-6 py-10 flex flex-col items-center">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center shadow-sm"><Lock size={38} className="text-blue-500" /></div>
          <div className="text-center">
            <h2 className="text-lg font-black text-gray-800">دخول الإدارة</h2>
            <p className="text-sm text-gray-400 mt-1">سجّل الدخول بحساب المالك</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"><p className="text-xs text-red-600 text-center">{error}</p></div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">البريد الإلكتروني</label>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 transition-colors">
              <Mail size={18} className="text-gray-400 shrink-0" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" dir="ltr" className="flex-1 text-sm text-gray-700 outline-none bg-transparent text-left" onKeyDown={e => e.key === 'Enter' && login()} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">كلمة المرور</label>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 transition-colors">
              <Lock size={18} className="text-gray-400 shrink-0" />
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" dir="ltr" className="flex-1 text-sm text-gray-700 outline-none bg-transparent text-left" onKeyDown={e => e.key === 'Enter' && login()} />
              <button onClick={() => setShowPwd(!showPwd)} className="text-gray-400 shrink-0">{showPwd ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>

          <button onClick={login} disabled={busy} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-blue-200">
            {busy ? <><Loader2 size={18} className="animate-spin" /> جاري...</> : <><LogIn size={18} /> تسجيل الدخول</>}
          </button>
        </div>
      </div>
    </div>
  )
}

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
        <AdminLogin onSuccess={() => setSession(auth.getSession())} />
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
          {tab === 'passwords' && <AdminPasswordReset />}
        </div>
      </div>
    </AdminGate>
  )
}
