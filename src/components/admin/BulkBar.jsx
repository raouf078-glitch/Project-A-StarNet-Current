import { X, Trash2, AlertTriangle } from 'lucide-react'

// ─── شريط الإجراءات الجماعية (يظهر عند تحديد عنصر أو أكثر) ───
// props: count, total, onDelete, onSelectAll, onClear
export function BulkBar({ count, total, onDelete, onSelectAll, onClear }) {
  if (count <= 0) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-2.5 flex items-center gap-2">
        <button onClick={onClear} className="shrink-0 w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition-transform" aria-label="إلغاء التحديد">
          <X size={18} />
        </button>
        <button onClick={onDelete} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm font-bold active:scale-95 transition-transform">
          <Trash2 size={16} /> حذف المحدد
        </button>
        <button onClick={onSelectAll} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform">
          تحديد الكل ({total})
        </button>
        <span className="shrink-0 text-[11px] text-gray-400 font-semibold px-1 leading-tight text-center">تم تحديد<br />{count} عنصر</span>
      </div>
    </div>
  )
}

// ─── نافذة تأكيد خطِرة (حذف جماعي / حذف كامل) مع شريط تقدّم ───
// props: title, message, confirmText, busy, progress {done,total}, onCancel, onConfirm
export function ConfirmDanger({ title, message, confirmText, busy, progress, onCancel, onConfirm, progressLabel = 'جاري الحذف' }) {
  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" style={{ height: 'var(--visual-height, 100dvh)' }}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-xs text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={24} className="text-rose-500" />
        </div>
        <p className="font-black text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{message}</p>

        {busy && progress ? (
          <div className="mt-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-2">{progressLabel} {progress.done} / {progress.total}</p>
          </div>
        ) : (
          <div className="flex gap-2 mt-4">
            <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm disabled:opacity-60">إلغاء</button>
            <button onClick={onConfirm} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm disabled:opacity-60">{confirmText}</button>
          </div>
        )}
      </div>
    </div>
  )
}
