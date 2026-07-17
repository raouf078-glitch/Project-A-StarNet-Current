import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home, MapPin, Wrench, Store, Settings } from 'lucide-react'
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
import Splash from './components/Splash'
import './theme'

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
    { path: '/', icon: Home, label: 'الرئيسية' },
    { path: '/coverage', icon: MapPin, label: 'أماكن التغطية' },
    { path: '/pos', icon: Store, label: 'نقاط البيع' },
    { path: '/tools', icon: Wrench, label: 'الأدوات' },
    { path: '/settings', icon: Settings, label: 'الإعدادات' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 z-20 shadow-xl pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-stretch">
        {tabs.map(tab => {
          const active = tab.path === pathname
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center pt-2 pb-1.5 gap-0.5 transition-all ${active ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div className={`p-1 rounded-xl transition-all ${active ? 'bg-blue-50' : ''}`}>
                <tab.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                {tab.label}
              </span>
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
      <div className="h-full flex flex-col" dir="rtl">
        <main ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
          <ScrollReset scrollRef={scrollRef} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/activate" element={<ActivatePage />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/coverage" element={<CoveragePage />} />
            <Route path="/pos" element={<PointsOfSalePage />} />
            <Route path="/my-cards" element={<MyCardsPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/admin" element={<AdminAssistantPage />} />
            <Route path="/admin/:section" element={<AdminAssistantPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </HashRouter>
  )
}
