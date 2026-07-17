import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, FolderTree, Copy, AlertTriangle, CheckCircle2,
  Layers, Trash2, Wand2,
} from 'lucide-react'
import { db } from '../../lib/db'
import { useLiveShared } from '../../lib/useLive'
import { KB, normalizeAr } from '../../assistantConfig'
import PageHeader from '../PageHeader'
import { runBatched, deleteIdsBatched } from '../../hooks/useBulkSelect'
import { ConfirmDanger } from './BulkBar'

// خريطة الأسماء النصية القديمة → معرّف القسم الصحيح (توافقية لمرة واحدة).
const LEGACY_CATEGORY_MAP = {
  'الباقات والمبيعات': '1',
  'مشاكل تسجيل الدخول': '2',
  'الدعم الفني والسرعة': '3',
  'التغطية والمواقع': '7',
  'العروض واستفسارات عامة': '5',
}

// بطاقة رقم في تقرير التدقيق.
function StatCard({ icon: Icon, value, label, tone }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}><Icon size={17} /></div>
      <div className="min-w-0">
        <p className="text-lg font-black text-gray-800 leading-none">{value}</p>
        <p className="text-[10px] text-gray-400 mt-1 truncate">{label}</p>
      </div>
    </div>
  )
}

export default function AuditView() {
  const navigate = useNavigate()
  const { data: articles, loading } = useLiveShared(KB.articles, { limit: 2000 })
  const { data: categories } = useLiveShared(KB.categories, { limit: 1000 })

  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [toast, setToast] = useState('')
  const [confirmCat, setConfirmCat] = useState(false)
  const [manualPick, setManualPick] = useState({}) // rawValue -> targetId
  const [dupConfirm, setDupConfirm] = useState(null) // {ids, keepId, key}
  const [dupKeep, setDupKeep] = useState({}) // key -> id to keep

  const validIds = useMemo(() => new Set(categories.map((c) => String(c.id))), [categories])
  const catName = useMemo(() => {
    const m = {}
    for (const c of categories) m[String(c.id)] = c.name || c.id
    return m
  }, [categories])

  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 2800) }

  // ─── تدقيق الأقسام ───
  // لكل سجل: هل قسمه معرّف صالح؟ إن لا، ما القسم المقترح (تلقائي/يدوي)؟
  const catAudit = useMemo(() => {
    const auto = []      // سجلات لها تحويل تلقائي معروف
    const manualMap = {} // rawValue -> [articles] تحتاج اختيار يدوي
    let okCount = 0
    for (const a of articles) {
      const raw = a.category == null ? '' : String(a.category)
      if (validIds.has(raw)) { okCount++; continue }
      let target = null
      if (raw in LEGACY_CATEGORY_MAP) target = LEGACY_CATEGORY_MAP[raw]
      else if (raw.trim() === '') target = '5'
      if (target && validIds.has(target)) auto.push({ article: a, target })
      else {
        if (!manualMap[raw]) manualMap[raw] = []
        manualMap[raw].push(a)
      }
    }
    return { auto, manualMap, okCount }
  }, [articles, validIds])

  // ─── تدقيق التكرار ───
  // تجميع السجلات حسب نص السؤال (أو العنوان) بعد التطبيع العربي.
  const dupGroups = useMemo(() => {
    const map = new Map()
    for (const a of articles) {
      const key = normalizeAr(a.question || a.title || '')
      if (!key || key.length < 4) continue
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(a)
    }
    return [...map.entries()]
      .filter(([, g]) => g.length > 1)
      .map(([key, g]) => ({ key, items: g }))
  }, [articles])

  const dupRowCount = dupGroups.reduce((s, g) => s + (g.items.length - 1), 0)

  // معرّف السجل المُبقى في كل مجموعة (افتراضياً الأعلى أولوية ثم الأقدم).
  const keepIdFor = (g) => {
    if (dupKeep[g.key]) return dupKeep[g.key]
    const sorted = [...g.items].sort(
      (a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0) || String(a.id).localeCompare(String(b.id)),
    )
    return sorted[0].id
  }

  // ─── تنفيذ توحيد الأقسام (تلقائي + الاختيارات اليدوية) ───
  const runUnify = async () => {
    setBusy(true)
    const tasks = [...catAudit.auto]
    for (const [raw, target] of Object.entries(manualPick)) {
      if (!target || !validIds.has(target)) continue
      for (const a of catAudit.manualMap[raw] || []) tasks.push({ article: a, target })
    }
    if (!tasks.length) { setBusy(false); setConfirmCat(false); flash('لا يوجد ما يحتاج توحيداً'); return }
    setProgress({ done: 0, total: tasks.length })
    const { ok, failed } = await runBatched(
      (t) => db.updateShared(KB.articles, t.article.id, { category: t.target, updatedAt: new Date().toISOString() }),
      tasks,
      (done) => setProgress({ done, total: tasks.length }),
    )
    setBusy(false)
    setProgress(null)
    setConfirmCat(false)
    setManualPick({})
    flash(failed ? `وُحّد ${ok}، وتعذّر ${failed} — أعد المحاولة` : `تم توحيد ${ok} سجلاً`)
  }

  // ─── حذف مكرّرات مجموعة (إبقاء واحد) ───
  const runDeleteDup = async () => {
    if (!dupConfirm) return
    setBusy(true)
    setProgress({ done: 0, total: dupConfirm.ids.length })
    const { ok, failed } = await deleteIdsBatched(
      (id) => db.deleteShared(KB.articles, id),
      dupConfirm.ids,
      (done) => setProgress({ done, total: dupConfirm.ids.length }),
    )
    setBusy(false)
    setProgress(null)
    setDupConfirm(null)
    flash(failed ? `حُذف ${ok}، وتعذّر ${failed}` : `حُذف ${ok} سجلاً مكرّراً`)
  }

  const catToFix = catAudit.auto.length + Object.values(catAudit.manualMap).reduce((s, a) => s + a.length, 0)

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={ShieldCheck} title="تدقيق ونظافة القاعدة" subtitle="توحيد الأقسام وإزالة التكرار" back onBack={() => navigate('/admin')} accent="emerald" />

      <div className="px-4 py-4 space-y-4">
        {/* تقرير */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard icon={Layers} value={loading ? '…' : articles.length} label="إجمالي السجلات" tone="text-blue-600 bg-blue-50" />
          <StatCard icon={CheckCircle2} value={loading ? '…' : catAudit.okCount} label="بقسم صحيح" tone="text-emerald-600 bg-emerald-50" />
          <StatCard icon={FolderTree} value={loading ? '…' : catToFix} label="تحتاج توحيد قسم" tone="text-amber-600 bg-amber-50" />
          <StatCard icon={Copy} value={loading ? '…' : dupRowCount} label="سجلات مكرّرة" tone="text-rose-600 bg-rose-50" />
        </div>

        {/* توحيد الأقسام */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderTree size={18} className="text-indigo-600" />
            <h3 className="font-black text-gray-800 text-sm">توحيد الأقسام</h3>
          </div>
          {catToFix === 0 ? (
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> كل السجلات مرتبطة بمعرّف قسم صحيح.
            </p>
          ) : (
            <>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                {catAudit.auto.length} سجلاً بأسماء أقسام قديمة سيُربط تلقائياً بالمعرّف الصحيح.
                {Object.keys(catAudit.manualMap).length > 0 && ' والأقسام غير المعروفة أدناه تحتاج اختياراً يدوياً.'}
              </p>

              {/* أقسام غير معروفة تحتاج اختياراً */}
              {Object.entries(catAudit.manualMap).map(([raw, items]) => (
                <div key={raw || '(فارغ)'} className="flex items-center gap-2 mb-2 bg-gray-50 rounded-lg p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-700 truncate">{raw.trim() === '' ? '(بدون قسم)' : raw}</p>
                    <p className="text-[10px] text-gray-400">{items.length} سجل</p>
                  </div>
                  <select
                    value={manualPick[raw] || ''}
                    onChange={(e) => setManualPick((p) => ({ ...p, [raw]: e.target.value }))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white max-w-[45%]"
                  >
                    <option value="">اختر القسم…</option>
                    {categories.filter((c) => c.active !== false).map((c) => (
                      <option key={c.id} value={c.id}>{c.name || c.id}</option>
                    ))}
                  </select>
                </div>
              ))}

              <button
                onClick={() => setConfirmCat(true)}
                disabled={busy}
                className="mt-1 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-sm py-2.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
              >
                <Wand2 size={16} /> توحيد الأقسام الآن
              </button>
            </>
          )}
        </div>

        {/* التكرار */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Copy size={18} className="text-rose-500" />
            <h3 className="font-black text-gray-800 text-sm">السجلات المكرّرة</h3>
          </div>
          {dupGroups.length === 0 ? (
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> لا توجد أسئلة مكرّرة (حسب تطابق نص السؤال).
            </p>
          ) : (
            <>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-3 flex items-start gap-1.5">
                <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                {dupGroups.length} مجموعة متطابقة. اختر السجل الذي تريد الإبقاء عليه في كل مجموعة، وسيُحذف الباقي.
              </p>
              <div className="space-y-3">
                {dupGroups.map((g) => {
                  const keep = keepIdFor(g)
                  const toDelete = g.items.filter((a) => a.id !== keep)
                  return (
                    <div key={g.key} className="border border-gray-100 rounded-xl p-2.5">
                      <div className="space-y-1.5 mb-2">
                        {g.items.map((a) => {
                          const isKeep = a.id === keep
                          return (
                            <button
                              key={a.id}
                              onClick={() => setDupKeep((p) => ({ ...p, [g.key]: a.id }))}
                              className={`w-full text-right flex items-start gap-2 rounded-lg p-2 border transition-colors ${isKeep ? 'border-emerald-300 bg-emerald-50/60' : 'border-gray-100 bg-white'}`}
                            >
                              <span className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isKeep ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                                {isKeep && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-bold text-gray-700 truncate">{a.title || '(بلا عنوان)'}</span>
                                <span className="block text-[10px] text-gray-400 truncate">{a.question || '—'}</span>
                                <span className="block text-[9px] text-gray-300 mt-0.5">القسم: {catName[String(a.category)] || a.category || '—'} · {a.id}</span>
                              </span>
                              {isKeep && <span className="shrink-0 text-[9px] font-bold text-emerald-600 bg-emerald-100 rounded px-1.5 py-0.5">إبقاء</span>}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => setDupConfirm({ ids: toDelete.map((a) => a.id), keepId: keep, key: g.key })}
                        disabled={busy}
                        className="w-full flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 font-bold text-xs py-2 rounded-lg active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <Trash2 size={13} /> حذف المكرّر ({toDelete.length})
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-4">
          الحذف نهائي. لتعديل أي سجل يدوياً (تصحيح القسم أو دمج المحتوى) استخدم شاشة «قاعدة المعرفة».
        </p>
      </div>

      {confirmCat && (
        <ConfirmDanger
          title="توحيد الأقسام؟"
          message={`سيتم ربط ${catAudit.auto.length + Object.entries(manualPick).filter(([r, t]) => t && validIds.has(t)).reduce((s, [r]) => s + (catAudit.manualMap[r]?.length || 0), 0)} سجلاً بمعرّفات الأقسام الصحيحة. عملية آمنة ولا تحذف أي محتوى.`}
          confirmText="نعم، وحّد الأقسام"
          busy={busy}
          progress={progress}
          progressLabel="جاري التوحيد"
          onCancel={() => !busy && setConfirmCat(false)}
          onConfirm={runUnify}
        />
      )}

      {dupConfirm && (
        <ConfirmDanger
          title={`حذف ${dupConfirm.ids.length} سجلاً مكرّراً؟`}
          message="سيتم حذف السجلات المكرّرة نهائياً مع الإبقاء على السجل المختار. لا يمكن التراجع."
          confirmText={`حذف ${dupConfirm.ids.length}`}
          busy={busy}
          progress={progress}
          onCancel={() => !busy && setDupConfirm(null)}
          onConfirm={runDeleteDup}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
