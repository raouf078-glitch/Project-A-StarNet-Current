import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { QrCode, Keyboard, IdCard, Info } from 'lucide-react'
import { loginToHotspot, getGateway, extractCardCode } from '../netConfig'
import PageHeader from '../components/PageHeader'
import BarcodeScanner from '../components/BarcodeScanner'
import CardReader from '../components/CardReader'

function useQueryParams() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const tabParam = params.get('tab')
  const validTabs = ['enter', 'scan', 'read']
  return {
    tab: validTabs.includes(tabParam) ? tabParam : 'enter',
    gw: params.get('gw') || params.get('gateway') || '',
  }
}

export default function Activate() {
  const navigate = useNavigate()
  const { tab: initialTab, gw } = useQueryParams()
  const [tab, setTab] = useState(initialTab)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { setTab(initialTab) }, [initialTab])

  const connect = (rawCode) => {
    const c = extractCardCode(rawCode)
    if (!c || busy) return
    setBusy(true)
    loginToHotspot({ username: c, recordCode: true, gateway: gw })
  }

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Header */}
      <div className="sticky top-0 z-20">
        <PageHeader icon={QrCode} title="الدخول بالبطاقة" subtitle="أدخل الكود أو امسح الباركود أو اقرأ البطاقة" back onBack={() => navigate('/')} />
        {/* Tabs */}
        <div className="bg-white px-4 pb-3 pt-1 border-b border-gray-100 flex gap-2">
          <button
            onClick={() => setTab('enter')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === 'enter' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
          >
            <Keyboard size={14} /> إدخال يدوي
          </button>
          <button
            onClick={() => setTab('scan')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === 'scan' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
          >
            <QrCode size={14} /> مسح الباركود
          </button>
          <button
            onClick={() => setTab('read')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === 'read' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
          >
            <IdCard size={14} /> قراءة البطاقة
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 pb-28">
        {tab === 'enter' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <label className="text-sm font-bold text-gray-600 block mb-2 text-center">أدخل كود البطاقة للاتصال بالشبكة</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="...أدخل الكود هنا"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-center text-lg font-bold tracking-widest focus:outline-none focus:border-blue-400"
                dir="ltr"
              />
              <button
                onClick={() => connect(code)}
                disabled={busy || !code.trim()}
                className="w-full mt-4 bg-blue-600 text-white font-bold py-3.5 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform"
              >
                {busy ? 'جاري الاتصال...' : 'تسجيل الدخول'}
              </button>
            </div>

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-2xl p-3">
              <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                تأكّد من اتصالك بشبكة واي فاي <b>ستار نت</b>. بعد الدخول ستظهر صفحة الشبكة الأصلية مع رصيدك وبيانات اشتراكك.
                <br /><span className="text-blue-400">بوابة الشبكة: {getGateway()}</span>
              </p>
            </div>
          </>
        )}

        {tab === 'scan' && (
          <>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 overflow-hidden">
              <p className="text-sm font-bold text-gray-600 text-center mb-3">وجّه الكاميرا نحو باركود البطاقة</p>
              <div className="rounded-2xl overflow-hidden">
                <BarcodeScanner
                  onScan={({ value }) => { if (!busy) connect(value) }}
                  className="w-full"
                  style={{ height: 280 }}
                />
              </div>
            </div>
            {busy && (
              <div className="flex items-center justify-center gap-2 text-blue-500 text-sm font-semibold">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> جاري الاتصال...
              </div>
            )}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-2xl p-3">
              <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                بمجرد قراءة الكود سيتم تسجيل دخولك تلقائياً وعرض صفحة الشبكة الأصلية.
              </p>
            </div>
          </>
        )}

        {tab === 'read' && (
          <>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 overflow-hidden">
              <p className="text-sm font-bold text-gray-600 text-center mb-3">وجّه الكاميرا نحو الرقم المطبوع على البطاقة</p>
              <div className="rounded-2xl overflow-hidden">
                <CardReader
                  onRead={({ value }) => {
                    if (!busy) {
                      setCode(value)
                      setTab('enter')
                    }
                  }}
                  className="w-full"
                  style={{ height: 280 }}
                />
              </div>
            </div>
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
              <Info size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 leading-relaxed">
                وجّه الكاميرا للرقم المطبوع على البطاقة أو الفاتورة. سيتم قراءته تلقائياً ووضعه في حقل الإدخال.
                <br />تأكّد من وضوح الأرقام وإضاءة كافية.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
