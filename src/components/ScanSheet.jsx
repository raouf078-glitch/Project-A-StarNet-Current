import { useEffect, useRef } from 'react'
import { Camera, X, QrCode, CreditCard } from 'lucide-react'

/**
 * ScanSheet — bottom sheet chooser matching StarNET Hotspot's v3-scan-sheet.
 * Two options: QR/Barcode scan or OCR card number reading.
 */
export default function ScanSheet({ open, onClose, onChooseBarcode, onChooseOcr }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1100] grid place-items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(0,45,98,0.48)] dark:bg-[rgba(0,0,0,0.68)] backdrop-blur-[8px] animate-[sn-scan-backdrop-in_0.28s_ease]"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-[1] w-[min(100%,430px)] mx-3.5 mb-4 p-[1.1rem_1rem_0.95rem] rounded-[1.35rem_1.35rem_1.15rem_1.15rem] bg-white dark:bg-[#1d2430] border border-[rgba(0,119,212,0.1)] dark:border-[rgba(0,180,216,0.14)] shadow-[0_-12px_48px_rgba(0,45,98,0.14),0_0_0_1px_rgba(255,255,255,0.5)_inset] dark:shadow-[0_-12px_48px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,255,255,0.04)_inset] animate-[sn-scan-sheet-up_0.36s_cubic-bezier(0.22,1,0.36,1)]"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-[0.7rem] left-[0.75rem] w-[2.15rem] h-[2.15rem] rounded-[0.7rem] bg-[rgba(0,45,98,0.06)] dark:bg-[rgba(255,255,255,0.06)] text-gray-400 text-xl leading-none flex items-center justify-center active:scale-95 transition-transform"
        >
          <X size={18} />
        </button>

        {/* Hero */}
        <div className="flex items-center gap-3 mb-[0.9rem] pr-0 pl-[2.25rem] text-right">
          <div className="flex-shrink-0 w-[2.85rem] h-[2.85rem] grid place-items-center rounded-[0.85rem] bg-gradient-to-br from-[#0077d4] to-[#00b4d8] text-white shadow-[0_6px_18px_rgba(0,119,212,0.28)]">
            <Camera size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="m-0 mb-0.5 text-[1.05rem] font-[800] text-gray-800 dark:text-gray-100 leading-tight">قراءة الكرت</h2>
            <p className="m-0 text-[0.72rem] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">اختر طريقة القراءة المناسبة.</p>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-[0.65rem]">
          {/* QR / Barcode */}
          <button
            onClick={() => { onClose(); setTimeout(onChooseBarcode, 60) }}
            className="flex items-center gap-3 w-full p-[0.85rem_0.85rem_0.85rem_0.75rem] rounded-[1rem] border border-[rgba(0,119,212,0.1)] dark:border-[rgba(0,180,216,0.12)] bg-[#f8fbff] dark:bg-[rgba(255,255,255,0.04)] shadow-[0_4px_16px_rgba(15,23,42,0.045)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.22)] text-right active:scale-[0.985] transition-transform animate-[sn-scan-card-in_0.42s_cubic-bezier(0.22,1,0.36,1)_0.05s_backwards]"
          >
            <div className="flex-shrink-0 w-12 h-12 grid place-items-center rounded-[0.85rem] bg-[rgba(0,119,212,0.12)] dark:bg-[rgba(0,180,216,0.14)] text-[#0077d4] dark:text-[#48cae4]">
              <QrCode size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="m-0 mb-0.5 text-[0.85rem] font-[800] text-gray-800 dark:text-gray-100 leading-tight">قراءة QR / الباركود</h3>
              <p className="m-0 text-[0.62rem] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">افتح قارئ الرمز لقراءة QR أو الباركود.</p>
            </div>
            <svg className="flex-shrink-0 w-[1.15rem] h-[1.15rem] text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>

          {/* OCR */}
          <button
            onClick={() => { onClose(); setTimeout(onChooseOcr, 60) }}
            className="flex items-center gap-3 w-full p-[0.85rem_0.85rem_0.85rem_0.75rem] rounded-[1rem] border border-[rgba(0,119,212,0.1)] dark:border-[rgba(0,180,216,0.12)] bg-[#f8fbff] dark:bg-[rgba(255,255,255,0.04)] shadow-[0_4px_16px_rgba(15,23,42,0.045)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.22)] text-right active:scale-[0.985] transition-transform animate-[sn-scan-card-in_0.42s_cubic-bezier(0.22,1,0.36,1)_0.1s_backwards]"
          >
            <div className="flex-shrink-0 w-12 h-12 grid place-items-center rounded-[0.85rem] bg-[rgba(0,180,216,0.14)] dark:bg-[rgba(72,202,228,0.16)] text-[#0077d4] dark:text-[#48cae4]">
              <CreditCard size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="m-0 mb-0.5 text-[0.85rem] font-[800] text-gray-800 dark:text-gray-100 leading-tight">قراءة رقم الكرت</h3>
              <p className="m-0 text-[0.62rem] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">التقط صورة لرقم الكرت ليتم قراءته تلقائياً.</p>
            </div>
            <svg className="flex-shrink-0 w-[1.15rem] h-[1.15rem] text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
