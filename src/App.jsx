import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home as HomeIcon, MapPin, Wrench, Store, Settings, Wallet } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import HomePage from './pages/Home'
import OffersPage from './pages/Offers'
import ToolsPage from './pages/Tools'
import MyCardsPage from './pages/MyCards'
import SettingsPage from './pages/Settings'
import ActivatePage from './pages/Activate'
import DepositPage from './pages/Deposit'
import CoveragePage from './pages/Coverage'
import PointsOfSalePage from './pages/PointsOfSale'
import CalculatorPage from './pages/Calculator'
import FeedbackPage from './pages/Feedback'
import GuidePage from './pages/Guide'
import AssistantPage from './pages/Assistant'
import AdminAssistantPage from './pages/AdminAssistant'
import AdminPanelPage from './pages/AdminPanel'
import Splash from './components/Splash'
import AuthGate from './components/AuthGate'
import WalletPage from './pages/Wallet'
import WalletHistoryPage from './pages/WalletHistory'
import RewardsPage from './pages/Rewards'
import StorePage from './pages/Store'
import CartPage from './pages/Cart'
import CheckoutPage from './pages/Checkout'
import PurchasesPage from './pages/Purchases'
import './theme'

function Particles() {
  const items = Array.from({ length: 12 }, (_, i) => {
    const size = 3 + (i % 4) * 2
    const left = (i * 37) % 100
    const dur = 12 + (i % 5) * 3
    const delay = (i * 1.7) % 10
    return { size, left, dur, delay }
  })
  return (
    <div className="sn-particles" aria-hidden="true">
      {items.map((p, i) => (
        <span key={i} style={{
          width: p.size, height: p.size, left: `${p.left}%`,
          animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  )
}

function ScrollReset({ scrollRef }) {
  const { pathname } = useLocation()
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [pathname])
  return null
}

function TabBar() {
  const { pathname } = useLocation()
  // شاشة المساعد تعمل بملء الشاشة (تغطّي الشريط) — نخفيه لتفادي ظهوره خلفها
  if (pathname === '/assistant') return null
  const tabs = [
    { path: '/', icon: HomeIcon, label: 'الرئيسية' },
    { path: '/coverage', icon: MapPin, label: 'أماكن التغطية' },
    { path: '/pos', icon: Store, label: 'نقاط البيع' },
    { path: '/tools', icon: Wrench, label: 'الأدوات' },
    { path: '/wallet', icon: Wallet, label: 'المحفظة' },
    { path: '/settings', icon: Settings, label: 'الإعدادات' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 sn-nav z-20 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-stretch px-2 pt-1.5">
        {tabs.map(tab => {
          const active = tab.path === pathname
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center pt-2 pb-1.5 gap-0.5 transition-all duration-300 ${active ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div className={`p-1 rounded-xl transition-all duration-300 ${active ? 'bg-blue-50 shadow-sm scale-105' : ''}`}>
                <tab.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              </div>
              <span className={`text-[10px] font-semibold leading-none transition-colors duration-300 ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {active && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function App() {
  const scrollRef = useRef(null)
  const [splash, setSplash] = useState(true)

  if (splash) return <Splash onDone={() => setSplash(false)} />

  return (
    <HashRouter>
      <div className="h-full flex flex-col relative" dir="rtl">
        <Particles />
        <main ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] relative z-10">
          <ScrollReset scrollRef={scrollRef} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/activate" element={<ActivatePage />} />
            <Route path="/deposit" element={<AuthGate><DepositPage /></AuthGate>} />
            <Route path="/coverage" element={<CoveragePage />} />
            <Route path="/pos" element={<PointsOfSalePage />} />
            <Route path="/my-cards" element={<AuthGate><MyCardsPage /></AuthGate>} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/admin" element={<AdminPanelPage />} />
            <Route path="/admin/assistant" element={<AdminAssistantPage />} />
            <Route path="/admin/assistant/:section" element={<AdminAssistantPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/wallet" element={<AuthGate><WalletPage /></AuthGate>} />
            <Route path="/wallet/history" element={<AuthGate><WalletHistoryPage /></AuthGate>} />
            <Route path="/rewards" element={<AuthGate><RewardsPage /></AuthGate>} />
            <Route path="/store" element={<AuthGate><StorePage /></AuthGate>} />
            <Route path="/cart" element={<AuthGate><CartPage /></AuthGate>} />
            <Route path="/checkout" element={<AuthGate><CheckoutPage /></AuthGate>} />
            <Route path="/purchases" element={<AuthGate><PurchasesPage /></AuthGate>} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </HashRouter>
  )
}
