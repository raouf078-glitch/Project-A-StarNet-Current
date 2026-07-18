import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Wifi, Camera, History, Info } from 'lucide-react'
import { loginToHotspot, getGateway, extractCardCode } from '../netConfig'
import PageHeader from '../components/PageHeader'
import ScanSheet from '../components/ScanSheet'
import CameraGuide from '../components/CameraGuide'
import { processImageBarcode, processImageOcr } from '../lib/barcode'

function useQueryParams() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  return { gw: params.get('gw') || params.get('gateway') || '' }
}

export default function Activate() {
  const navigate = useNavigate()
  const { gw } = useQueryParams()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [showScanSheet, setShowScanSheet] = useState(false)
  const [showGuide, setShowGuide] = useState(null)
  const inputRef = useRef(null)

  const connect = (rawCode) => {
    const c = extractCardCode(rawCode)
    if (!c || busy) return
    setBusy(true)
    loginToHotspot({ username: c, recordCode: true, gateway: gw })
  }

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={Wifi} title="الدخول بالبطاقة" subtitle="أدخل الكود أو استخدم الكاميرا" back onBack={() => navigate('/')} />

      <div className="px-4 py-5 space-y-4 pb-28">
        {/* Login card — matching StarNET Hotspot */}
        <div className="w-full bg-white dark:bg-[rgba(5,20,38,0.97)] rounded-[var(--sn-radius-lg,20px)] border border-[rgba(0,86,179,0.07)] dark:border-[rgba(0,180,216,0.22)] shadow-[var(--sn-glass-shadow)] p-[1.45rem_1.2rem_1.3rem]">
          <h2 className="text-center text-[1.05rem] font-[800] text-[#0077d4] dark:text-[#90e0ef] mb-[1.1rem]">أدخل رقم الكرت</h2>
          {/* Input row: camera | field | history */}
          <div className="flex items-center gap-[0.45rem] mb-[1.2rem]">
            <button
              type="button"
              onClick={() => setShowScanSheet(true)}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-[0.18rem] w-[3.2rem] h-[3.2rem] rounded-[0.8rem] border-[1.5px] border-[rgba(0,119,212,0.22)] dark:border-[rgba(0,180,216,0.28)] bg-white dark:bg-[rgba(0,16,32,0.72)] text-[#3d5a80] dark:text-[#94a8c4] shadow-[0_2px_10px_rgba(0,45,98,0.04)] dark:shadow-[0_0_18px_rgba(0,180,216,0.08)] transition-all active:scale-95"
            >
              <Camera size={18} />
              <span className="text-[0.54rem] font-bold leading-none">الكاميرا</span>
            </button>
            <div className="flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="أدخل رقم الكرت هنا"
                dir="ltr"
                className="w-full h-[3.2rem] rounded-[0.8rem] border-[1.5px] border-[rgba(0,119,212,0.14)] dark:border-[rgba(0,180,216,0.2)] bg-[#f4f9ff] dark:bg-[rgba(0,16,32,0.5)] px-3 text-center text-[0.95rem] font-bold tracking-widest text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#0077d4] dark:focus:border-[#48cae4] transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/my-cards')}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-[0.18rem] w-[3.2rem] h-[3.2rem] rounded-[0.8rem] border-[1.5px] border-[rgba(0,119,212,0.22)] dark:border-[rgba(0,180,216,0.28)] bg-white dark:bg-[rgba(0,16,32,0.72)] text-[#3d5a80] dark:text-[#94a8c4] shadow-[0_2px_10px_rgba(0,45,98,0.04)] dark:shadow-[0_0_18px_rgba(0,180,216,0.08)] transition-all active:scale-95"
            >
              <History size={18} />
              <span className="text-[0.54rem] font-bold leading-none">السجل</span>
            </button>
          </div>
          {/* Submit */}
          <button
            type="button"
            onClick={() => connect(code)}
            disabled={busy || !code.trim()}
            className="relative w-full h-[3.1rem] rounded-[0.85rem] bg-gradient-to-l from-[#0077d4] to-[#00b4d8] text-white font-[800] text-[0.95rem] flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(0,119,212,0.28)] disabled:opacity-50 active:scale-[0.98] transition-transform overflow-hidden"
          >
            <Wifi size={20} />
            <span>{busy ? 'جاري الاتصال...' : 'دخول الإنترنت'}</span>
          </button>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-[rgba(0,119,212,0.08)] border border-blue-100 dark:border-[rgba(0,180,216,0.15)] rounded-2xl p-3">
          <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            تأكّد من اتصالك بشبكة واي فاي <b>ستار نت</b>. بعد الدخول ستظهر صفحة الشبكة الأصلية مع رصيدك وبيانات اشتراكك.
            <br /><span className="text-blue-400">بوابة الشبكة: {getGateway()}</span>
          </p>
        </div>
      </div>

      {/* Scan sheet */}
      <ScanSheet
        open={showScanSheet}
        onClose={() => setShowScanSheet(false)}
        onChooseBarcode={() => setShowGuide('barcode')}
        onChooseOcr={() => setShowGuide('ocr')}
      />

      {/* Camera guide overlay */}
      <CameraGuide
        open={!!showGuide}
        mode={showGuide || 'ocr'}
        onClose={() => setShowGuide(null)}
        onCapture={async (file) => {
          try {
            let result = null
            if (showGuide === 'barcode') {
              result = await processImageBarcode(file)
            } else {
              result = await processImageOcr(file)
            }
            if (result) {
              setCode(result)
              if (inputRef.current) inputRef.current.focus()
            }
          } catch (e) {
            console.error('[Activate] capture error:', e)
          }
        }}
      />
    </div>
  )
}
