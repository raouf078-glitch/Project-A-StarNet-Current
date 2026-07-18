import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

/**
 * CameraGuide — fullscreen camera capture overlay matching StarNET Hotspot.
 * mode: "ocr" | "barcode"
 * Uses native file capture (phone camera) → returns the captured File.
 */

const HINTS = {
  ocr: {
    label: 'قراءة رقم الكرت',
    top: 'ضع رقم الكرت داخل الإطار',
    bottom: 'اضغط الزر لفتح الكاميرا والتقاط صورة واضحة',
  },
  barcode: {
    label: 'قراءة QR / الباركود',
    top: 'ضع الباركود أو رمز QR داخل الإطار',
    bottom: 'اضغط الزر لفتح الكاميرا والتقاط صورة واضحة',
  },
}

export default function CameraGuide({ open, mode = 'ocr', onCapture, onClose }) {
  const fileRef = useRef(null)
  const [captured, setCaptured] = useState(false)

  const hints = HINTS[mode] || HINTS.ocr

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleShutter() {
    if (fileRef.current) {
      fileRef.current.value = ''
      fileRef.current.click()
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCaptured(true)
    if (onCapture) onCapture(file)
    setTimeout(() => {
      setCaptured(false)
      onClose()
    }, 300)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1300] bg-black text-white font-[Cairo,Tajawal,sans-serif]" dir="rtl">
      {/* Background gradient (file mode — no live video) */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 120% 70% at 50% 42%, rgba(0,90,160,0.35) 0%, transparent 55%), #000814',
      }} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[calc(0.85rem+env(safe-area-inset-top,0px))] left-[0.85rem] w-[2.35rem] h-[2.35rem] rounded-[0.75rem] bg-[rgba(0,20,45,0.45)] text-white text-lg flex items-center justify-center z-[2] active:scale-95 transition-transform"
      >
        <X size={20} />
      </button>

      {/* Stage with frame */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pointer-events-none" style={{
        paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
      }}>
        {/* Top hint */}
        <p className="mb-3.5 text-center text-[1rem] font-[800] text-[#f8fbff] max-w-[20rem] leading-[1.45]" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}>
          {hints.top}
        </p>

        {/* Frame */}
        <div
          className={`border-2 border-[rgba(72,202,228,0.95)] bg-transparent rounded-[1rem] ${
            mode === 'barcode' ? 'w-[min(78vw,21.5rem)]' : 'w-[min(96vw,26.5rem)]'
          }`}
          style={{
            aspectRatio: mode === 'barcode' ? '1.15 / 1' : '2.85 / 1',
            boxShadow: '0 0 0 9999px rgba(0,20,45,0.58), 0 0 16px rgba(0,180,216,0.28), inset 0 0 0 1px rgba(255,255,255,0.12)',
          }}
        />

        {/* Bottom hint */}
        <p className="mt-3.5 text-center text-[0.78rem] font-medium text-[rgba(248,251,255,0.88)] max-w-[20rem] leading-[1.45]" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}>
          {hints.bottom}
        </p>
      </div>

      {/* Bottom bar with shutter */}
      <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center gap-7 px-4 pointer-events-auto" style={{
        paddingTop: '1rem',
        paddingBottom: 'calc(1.15rem + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,20,45,0.45) 55%, rgba(0,20,45,0.72) 100%)',
      }}>
        <button
          onClick={handleShutter}
          className="w-[4.25rem] h-[4.25rem] rounded-full border-[3px] border-[rgba(255,255,255,0.92)] p-0 active:scale-95 transition-transform"
          style={{
            background: 'radial-gradient(circle at 50% 45%, #ffffff 0%, #e8f6ff 62%, #c5e4fb 100%)',
            boxShadow: '0 0 0 3px rgba(0,119,212,0.22), 0 8px 22px rgba(0,0,0,0.35)',
          }}
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
