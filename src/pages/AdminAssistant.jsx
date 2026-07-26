import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck, Lock, LogIn, BookOpen, FolderTree, Repeat, GitBranch, MousePointerClick, Image, ChartBar as BarChart3, Circle as HelpCircle, Wrench, Link2, MessageSquare, CircleCheck as CheckCircle2, ArrowUpRight, ThumbsUp, ThumbsDown, Trash2, Check, SquareCheck as CheckSquare, Square, Trash, Sparkles, ShieldAlert, Loader as Loader2 } from 'lucide-react'
import { auth } from '../lib/auth'
import { db } from '../lib/db'
import { useLiveShared } from '../lib/useLive'
import PageHeader from '../components/PageHeader'
import Chart from '../components/Chart'
import { KB } from '../assistantConfig'
import { MANAGED } from '../kbSchemas'
import CrudManager from '../components/admin/CrudManager'
import AuditView from '../components/admin/AuditView'
import { useBulkSelect, deleteIdsBatched } from '../hooks/useBulkSelect'
import { BulkBar, ConfirmDanger } from '../components/admin/BulkBar'

// ─── تعريف أقسام اللوحة (أيقونة/لون + مصدر البيانات) ───
const SECTIONS = [
  { key: 'kb', icon: BookOpen, color: 'bg-blue-50 text-blue-600', coll: KB.articles, title: 'قاعدة المعرفة', sub: 'الأسئلة والأجوبة' },
  { key: 'categories', icon: FolderTree, color: 'bg-indigo-50 text-indigo-600', coll: KB.categories, title: 'الأقسام', sub: 'تصنيف المحتوى' },
  { key: 'synonyms', icon: Repeat, color: 'bg-teal-50 text-teal-600', coll: KB.synonyms, title: 'المرادفات', sub: 'الكلمات المتشابهة' },
  { key: 'diagnostics', icon: GitBranch, color: 'bg-purple-50 text-purple-600', coll: KB.diagnostics, title: 'شجرة التشخيص', sub: 'أسئلة متتابعة للحلول' },
  { key: 'buttons', icon: MousePointerClick, color: 'bg-cyan-50 text-cyan-600', coll: KB.buttons, title: 'الأزرار', sub: 'أزرار الردود' },
  { key: 'media', icon: Image, color: 'bg-amber-50 text-amber-600', coll: KB.media, title: 'الوسائط', sub: 'صور وروابط وملفات' },
  { key: 'related', icon: Link2, color: 'bg-sky-50 text-sky-600', coll: KB.related, title: 'المواضيع المرتبطة', sub: 'حزم «قد يهمك أيضاً»' },
  { key: 'stats', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600', coll: KB.events, title: 'الإحصائيات', sub: 'الأسئلة والتحويلات' },
  { key: 'unanswered', icon: HelpCircle, color: 'bg-rose-50 text-rose-600', coll: KB.unanswered, title: 'الأسئلة غير المفهومة', sub: 'طوّر المساعد مع الوقت' },
  { key: 'audit', icon: Sparkles, color: 'bg-fuchsia-50 text-fuchsia-600', coll: KB.articles, title: 'تدقيق ونظافة', sub: 'توحيد الأقسام وإزالة التكرار' },
]

// ─── حارس الوصول: صاحب التطبيق فقط ───
function OwnerGate({ children }) {
  const navigate = useNavigate()
  const [, setSession] = useState(auth.getSession())
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const unsub = auth.onAuthChange((s) => { setSession(s); setChecking(false) })
    return unsub
  }, [])

  if (checking) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[rgb(var(--color-bg))]">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (auth.isOwner()) return children

  const signIn = async () => {
    setBusy(true)
    try { await auth.signInWithGoogle() } finally { setBusy(false) }
  }

  if (!auth.getSession()) {
    return (
      <div className="min-h-full bg-[rgb(var(--color-bg))]">
        <PageHeader icon={ShieldCheck} title="لوحة إدارة المساعد" subtitle="منطقة خاصة بصاحب التطبيق" back onBack={() => navigate('/settings')} />
        <div className="px-6 py-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-5"><Lock size={38} className="text-blue-500" /></div>
          <h2 className="text-lg font-black text-gray-800">يجب تسجيل الدخول</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">سجّل الدخول بحساب المالك للوصول إلى إدارة مساعد ستار نت.</p>
          <button onClick={signIn} disabled={busy} className="mt-6 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform disabled:opacity-60 shadow-lg shadow-blue-200">
            {busy ? <><Loader2 size={18} className="animate-spin" /> جاري...</> : <><LogIn size={18} /> تسجيل الدخول بـ Google</>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={ShieldCheck} title="لوحة إدارة المساعد" subtitle="منطقة خاصة بصاحب التطبيق" back onBack={() => navigate('/settings')} />
      <div className="px-6 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mb-5"><ShieldAlert size={38} className="text-rose-500" /></div>
        <h2 className="text-lg font-black text-gray-800">غير مصرّح لك بالدخول</h2>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">هذه اللوحة خاصة بالمالك فقط. البريد المسموح: raouf078@gmail.com</p>
      </div>
    </div>
  )
}

// ─── الهب ───
function AdminHub() {
  const navigate = useNavigate()
  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={ShieldCheck} title="لوحة إدارة المساعد" subtitle="مساعد ستار نت 🤖 — إدارة المحتوى" back onBack={() => navigate('/settings')} accent="emerald" />
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Wrench size={18} className="text-blue-600" /></div>
          <p className="text-xs text-gray-500 leading-relaxed">
            إضافة وتعديل وحذف واستيراد وتصدير لكل قسم. الباقات والعروض ونقاط البيع تبقى في مصادرها الأصلية
            ويقرأ منها المساعد مباشرة — مصدر واحد للمعلومة، بلا تكرار.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SECTIONS.map((s) => <SectionCard key={s.key} section={s} onClick={() => navigate(`/admin/${s.key}`)} />)}
        </div>
      </div>
    </div>
  )
}

function SectionCard({ section, onClick }) {
  const { data } = useLiveShared(section.coll, { limit: 1000 })
  const Icon = section.icon
  return (
    <button onClick={onClick} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 text-right active:scale-95 transition-transform">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${section.color}`}><Icon size={21} /></div>
      <div className="min-w-0 w-full">
        <p className="font-black text-gray-800 text-sm leading-tight">{section.title}</p>
        <p className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">{section.sub}</p>
      </div>
      <span className="text-[11px] font-bold text-gray-500 bg-gray-50 rounded-lg px-2 py-0.5">{data.length} عنصر</span>
    </button>
  )
}

// ─── قسم إدارة عبر المدير العام ───
function ManagedSection({ section }) {
  const navigate = useNavigate()
  const managed = MANAGED[section.key]
  const { data: categories } = useLiveShared(KB.categories, { limit: 1000 })
  // خيارات القسم للأسئلة (Single Source of Truth: من جدول الأقسام)
  const refOptions =
    section.key === 'kb'
      ? { category: categories.filter((c) => c.active !== false).map((c) => ({ value: c.id, label: c.name || c.id })) }
      : {}

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={section.icon} title={section.title} subtitle={section.sub} back onBack={() => navigate('/admin')} />
      <CrudManager managed={managed} refOptions={refOptions} />
    </div>
  )
}

// ─── الإحصائيات ───
function StatsView({ section }) {
  const navigate = useNavigate()
  const [kpi, setKpi] = useState(null)
  const [topAnswered, setTopAnswered] = useState([])
  const [eventDist, setEventDist] = useState([])
  const { data: unanswered } = useLiveShared(KB.unanswered, { limit: 1000 })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [asks, answered, transfers, up, down, byType, byArticle] = await Promise.all([
          db.countShared(KB.events, { type: 'ask' }),
          db.countShared(KB.events, { type: 'answered' }),
          db.countShared(KB.events, { type: 'transfer' }),
          db.countShared(KB.events, { type: 'rating', value: 'up' }),
          db.countShared(KB.events, { type: 'rating', value: 'down' }),
          db.groupByShared(KB.events, 'type', { order: '-count', limit: 8 }),
          db.groupByShared(KB.events, 'title', { filters: { type: 'answered' }, order: '-count', limit: 6 }),
        ])
        if (!alive) return
        setKpi({ asks, answered, transfers, up, down })
        setEventDist(byType.filter((g) => g.key))
        setTopAnswered(byArticle.filter((g) => g.key))
      } catch { /* تجاهل */ }
    })()
    return () => { alive = false }
  }, [])

  const unresolved = unanswered.filter((u) => !u.resolved).length

  const cards = [
    { label: 'إجمالي الأسئلة', value: kpi?.asks, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
    { label: 'أسئلة أُجيبت', value: kpi?.answered, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'تحويل للدعم', value: kpi?.transfers, icon: ArrowUpRight, color: 'text-rose-600 bg-rose-50' },
    { label: 'غير مفهومة', value: unresolved, icon: HelpCircle, color: 'text-amber-600 bg-amber-50' },
    { label: '👍 أفادت', value: kpi?.up, icon: ThumbsUp, color: 'text-teal-600 bg-teal-50' },
    { label: '👎 لم تُفد', value: kpi?.down, icon: ThumbsDown, color: 'text-gray-500 bg-gray-100' },
  ]

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={section.icon} title={section.title} subtitle={section.sub} back onBack={() => navigate('/admin')} />
      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.color}`}><c.icon size={17} /></div>
              <div className="min-w-0">
                <p className="text-lg font-black text-gray-800 leading-none">{c.value ?? '—'}</p>
                <p className="text-[10px] text-gray-400 mt-1 truncate">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {eventDist.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-600 mb-2">توزيع الأحداث</p>
            <Chart spec={{
              kind: 'hbar',
              labels: eventDist.map((g) => AR_EVENT[g.key] || g.key),
              series: [{ name: 'العدد', data: eventDist.map((g) => g.count) }],
            }} />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-600 mb-2">أكثر الأسئلة إجابةً</p>
          {topAnswered.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">لا توجد بيانات كافية بعد.</p>
          ) : (
            <div className="space-y-1.5">
              {topAnswered.map((g, i) => (
                <div key={g.key} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-center text-[11px] font-bold text-gray-400">{i + 1}</span>
                  <span className="flex-1 truncate text-gray-700">{g.key}</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-lg px-2 py-0.5">{g.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-4">
          تُسجَّل الإحصائيات تلقائياً عند استخدام العملاء للمساعد. الباقات الأكثر استفساراً تظهر ضمن سجل الأحداث مع نموّ الاستخدام.
        </p>
      </div>
    </div>
  )
}

const AR_EVENT = { ask: 'أسئلة', answered: 'أُجيبت', transfer: 'تحويل للدعم', rating: 'تقييمات', diagnostic: 'تشخيص', package: 'استفسار باقات' }

// ─── الأسئلة غير المفهومة ───
function UnansweredView({ section }) {
  const navigate = useNavigate()
  const { data, loading } = useLiveShared(KB.unanswered, { order: '-at', limit: 1000 })
  const [filter, setFilter] = useState('open') // open | all
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [toast, setToast] = useState('')
  const list = data.filter((u) => (filter === 'open' ? !u.resolved : true))
  const bulk = useBulkSelect(list)

  const resolve = async (u) => { try { await db.updateShared(KB.unanswered, u.id, { resolved: !u.resolved }) } catch {} }
  const remove = async (u) => { try { await db.deleteShared(KB.unanswered, u.id) } catch {} }

  const runDelete = async (ids, onDone) => {
    if (!ids.length) { onDone?.(); return }
    setBusy(true)
    setProgress({ done: 0, total: ids.length })
    try {
      const { failed } = await deleteIdsBatched((id) => db.deleteShared(KB.unanswered, id), ids, (done) => setProgress({ done, total: ids.length }))
      bulk.clear()
      onDone?.()
      if (failed) { setToast(`تعذّر حذف ${failed} — أعد المحاولة`); setTimeout(() => setToast(''), 2600) }
    } catch {} finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const doBulkDelete = () => runDelete(bulk.selectedIds, () => setConfirmBulk(false))
  const doDeleteAll = () => runDelete(data.map((u) => u.id), () => setConfirmAll(false))

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      <PageHeader icon={section.icon} title={section.title} subtitle={section.sub} back onBack={() => navigate('/admin')} />
      <div className="px-4 py-4 space-y-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0"><HelpCircle size={17} className="text-rose-500" /></div>
          <p className="text-[11px] text-gray-500 leading-relaxed">هذه أسئلة لم يجد المساعد إجابة لها. أضف لها كلمات مفتاحية أو مرادفات أو سؤالاً جديداً في قاعدة المعرفة، ثم علّمها كمعالَجة.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 w-fit">
            {[{ k: 'open', t: 'غير معالَجة' }, { k: 'all', t: 'الكل' }].map((o) => (
              <button key={o.k} onClick={() => setFilter(o.k)} className={`text-[11px] font-bold px-3 py-1 rounded-md ${filter === o.k ? 'bg-rose-500 text-white' : 'text-gray-500'}`}>{o.t}</button>
            ))}
          </div>
          <div className="flex-1" />
          <button onClick={() => setConfirmAll(true)} disabled={data.length === 0} className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1 disabled:opacity-40">
            <Trash size={13} /> حذف الكل
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-14"><div className="w-7 h-7 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <CheckCircle2 size={26} className="text-emerald-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-500">لا توجد أسئلة غير معالَجة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* رأس: تحديد الكل + العدّاد */}
            <div className="flex items-center justify-between px-1">
              <button onClick={bulk.toggleAll} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 active:scale-95 transition-transform">
                {bulk.allSelected ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-gray-400" />}
                تحديد الكل
              </button>
              <p className="text-[11px] text-gray-400">{list.length} سؤال</p>
            </div>

            {list.map((u) => {
              const isSel = bulk.isSelected(u.id)
              return (
                <div key={u.id} className={`bg-white rounded-xl border shadow-sm p-3 flex items-start gap-2 transition-colors ${isSel ? 'border-blue-300 ring-1 ring-blue-200 bg-blue-50/40' : 'border-gray-100'}`}>
                  <button onClick={() => bulk.toggle(u.id)} className="shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center active:scale-90 transition-transform" aria-label="تحديد">
                    {isSel ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} className="text-gray-300" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${u.resolved ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{u.question}</p>
                    {u.at && <p className="text-[10px] text-gray-300 mt-1">{new Date(u.at).toLocaleString('ar')}</p>}
                  </div>
                  <button onClick={() => resolve(u)} title="تعليم كمعالَجة" className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${u.resolved ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}><Check size={15} /></button>
                  <button onClick={() => remove(u)} className="shrink-0 w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><Trash2 size={14} /></button>
                </div>
              )
            })}
            {bulk.count > 0 && <div className="h-24" />}
          </div>
        )}
      </div>

      <BulkBar
        count={bulk.count}
        total={list.length}
        onDelete={() => setConfirmBulk(true)}
        onSelectAll={bulk.selectAll}
        onClear={bulk.clear}
      />

      {confirmBulk && (
        <ConfirmDanger
          title={`حذف ${bulk.count} سؤال محدد؟`}
          message="سيتم حذف الأسئلة المحددة نهائياً. لا يمكن التراجع عن هذه العملية."
          confirmText={`حذف ${bulk.count} سؤال`}
          busy={busy}
          progress={progress}
          onCancel={() => !busy && setConfirmBulk(false)}
          onConfirm={doBulkDelete}
        />
      )}

      {confirmAll && (
        <ConfirmDanger
          title="حذف جميع الأسئلة؟"
          message={`هل أنت متأكد من حذف جميع الأسئلة غير المفهومة (${data.length})؟ لا يمكن التراجع عن هذه العملية.`}
          confirmText="نعم، احذف الكل"
          busy={busy}
          progress={progress}
          onCancel={() => !busy && setConfirmAll(false)}
          onConfirm={doDeleteAll}
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

// ─── نقطة الدخول ───
export default function AdminAssistant() {
  const { section: key } = useParams()
  const section = key ? SECTIONS.find((s) => s.key === key) : null

  let content
  if (!section) content = <AdminHub />
  else if (section.key === 'stats') content = <StatsView section={section} />
  else if (section.key === 'unanswered') content = <UnansweredView section={section} />
  else if (section.key === 'audit') content = <AuditView />
  else content = <ManagedSection section={section} />

  return <OwnerGate>{content}</OwnerGate>
}
