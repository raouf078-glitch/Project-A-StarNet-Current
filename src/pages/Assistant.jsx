import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Send, Bot, Sparkles, Headphones, ExternalLink, ChevronLeft,
  ThumbsUp, ThumbsDown, Image as ImageIcon, FileText, Link2, Zap, Clock, Download,
  RotateCcw, Store,
} from 'lucide-react'
import { useLiveShared } from '../lib/useLive'
import {
  KB, ASSISTANT, SUPPORT_ACTIONS, pickSuggestedArticles,
  searchArticles, findDiagnosticRoot, diagnosticChildren,
  resolveRelated, resolveButtons, resolveMedia, isPackageQuery, isProblemQuery,
  isGreeting, isPresenceCheck, GREETING_REPLY, PRESENCE_REPLY,
  logEvent, logUnanswered, logRating,
} from '../assistantConfig'

let msgId = 0
const nextId = () => `m${Date.now()}_${msgId++}`

export default function Assistant() {
  const navigate = useNavigate()
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // قاعدة المعرفة وكل مصادرها (تُقرأ حيّة).
  const { data: articles } = useLiveShared(KB.articles, { limit: 1000 })
  const { data: synonyms } = useLiveShared(KB.synonyms, { limit: 1000 })
  const { data: diagnostics } = useLiveShared(KB.diagnostics, { limit: 1000 })
  const { data: buttonRows } = useLiveShared(KB.buttons, { limit: 1000 })
  const { data: mediaRows } = useLiveShared(KB.media, { limit: 1000 })
  const { data: relatedBundles } = useLiveShared(KB.related, { limit: 1000 })
  // Single Source of Truth: الباقات من مصدرها الأصلي، بلا تكرار.
  const { data: packages } = useLiveShared('packages', { order: 'sort' })

  const [messages, setMessages] = useState([{ id: nextId(), role: 'bot', text: ASSISTANT.welcome }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  // اقتراحات "جرّب أن تسأل" — مجموعة عشوائية متنوّعة تُبنى من قاعدة
  // المعرفة الحيّة، وتتجدّد عند أول تحميل وعند بدء محادثة جديدة.
  const [suggestions, setSuggestions] = useState([])
  useEffect(() => {
    if (articles.length && suggestions.length === 0) setSuggestions(pickSuggestedArticles(articles, 6))
  }, [articles]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToEnd = () => requestAnimationFrame(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  })
  useEffect(() => { scrollToEnd() }, [messages, typing])

  const push = (msg) => setMessages((prev) => [...prev, { id: nextId(), ...msg }])

  // بناء رسالة إجابة من سؤال في قاعدة المعرفة (مع أزرار/وسائط/مرتبطة/تقييم).
  // suggested=true تعني أن المطابقة ضعيفة (أقرب موضوع وليست مطابقة مؤكدة)
  // فتُعرض بمقدمة لطيفة توضّح ذلك بدل تقديمها كإجابة قاطعة.
  const answerFromArticle = (art, { suggested = false } = {}) => {
    const text = suggested ? `لعلّك تقصد: «${art.title || art.question || ''}»\n\n${art.answer || ''}` : (art.answer || art.title || '')
    push({
      role: 'bot',
      text,
      buttons: resolveButtons(art.buttons, buttonRows),
      media: resolveMedia(art.media, mediaRows),
      related: resolveRelated(art, articles, relatedBundles),
      support: art.needsSupport === true,
      ratingFor: art.id,
    })
    logEvent('answered', { articleId: art.id, title: art.title || '', suggested })
  }

  // عرض عقدة تشخيص: فرع (خيارات) أو ورقة (حل نهائي).
  const showNode = (node) => {
    const children = diagnosticChildren(diagnostics, node.tree, node.id)
    if (children.length > 0) {
      push({
        role: 'bot',
        text: node.prompt || 'اختر ما يناسب حالتك:',
        options: children.map((c) => ({ id: c.id, label: c.optionLabel || c.prompt || '...', node: c })),
      })
    } else {
      // ورقة: الحل النهائي
      push({
        role: 'bot',
        text: node.answer || node.prompt || '',
        buttons: resolveButtons(node.buttons, buttonRows),
        support: node.needsSupport === true,
      })
      logEvent('diagnostic', { tree: node.tree, node: node.id })
    }
  }

  const onDiagnosticOption = (opt) => {
    push({ role: 'user', text: opt.label })
    setTyping(true)
    setTimeout(() => { showNode(opt.node); setTyping(false) }, 350)
  }

  const onRate = (articleId, value) => {
    logRating(articleId, value)
    setMessages((prev) => prev.map((m) => (m.ratingFor === articleId ? { ...m, rated: value } : m)))
  }

  const handleSend = (raw) => {
    const text = (raw ?? input).trim()
    if (!text || typing) return
    setInput('')
    push({ role: 'user', text })
    setTyping(true)
    logEvent('ask', { text: text.slice(0, 300) })

    setTimeout(() => {
      // 0) رسائل ترحيب/حضور قصيرة ("السلام عليكم"، "الو موجود؟") — رد
      //    طبيعي مباشر دون المرور بمحرك البحث إطلاقاً.
      if (isGreeting(text)) { push({ role: 'bot', text: GREETING_REPLY }); setTyping(false); return }
      if (isPresenceCheck(text)) { push({ role: 'bot', text: PRESENCE_REPLY }); setTyping(false); return }

      // 1) مطابقة قوية في قاعدة المعرفة (عنوان السؤال / الكلمات المفتاحية /
      //    المرادفات / القسم) — لها الأولوية دائماً على شجرة التشخيص،
      //    حتى لو كان السؤال يحتوي كلمة تبدو "مشكلة" بالصدفة.
      const [hit] = searchArticles(text, articles, synonyms, { limit: 1 })
      if (hit && hit.score >= 2) { answerFromArticle(hit.article); setTyping(false); return }

      // 2) نيّة باقات/أسعار → عرض الباقات الحيّة من مصدرها (لا تُنسخ هنا)
      if (isPackageQuery(text)) {
        const active = packages.filter((p) => p.active !== false)
        if (active.length) {
          push({
            role: 'bot',
            text: 'هذه باقاتنا الحالية (الأسعار محدّثة مباشرة):',
            packages: active,
            buttons: [{ id: 'offers', label: 'عرض كل الباقات', kind: 'nav', target: '/offers' }],
          })
          logEvent('package', { text: text.slice(0, 120) })
          setTyping(false)
          return
        }
      }

      // 3) شجرة تشخيص — تُشغَّل فقط إذا كان السؤال فعلاً عن عطل/مشكلة
      //    صريحة (بطيء، يفصل، لا يعمل، انقطاع...). الأسئلة المعلوماتية
      //    (الباقات، التغطية، نقاط البيع...) لا تدخل هذا المسار أبداً.
      if (isProblemQuery(text)) {
        const root = findDiagnosticRoot(text, diagnostics, synonyms)
        if (root) { showNode(root); setTyping(false); return }
      }

      // 4) مطابقة ضعيفة موجودة؟ اعرضها كأقرب موضوع مقترح، وإلا حوّل للدعم
      //    فقط بعد التأكد أنه لا توجد أي إشارة مطابقة على الإطلاق.
      if (hit && hit.score >= 1) { answerFromArticle(hit.article, { suggested: true }); setTyping(false); return }

      push({ role: 'bot', text: ASSISTANT.fallback, support: true })
      logUnanswered(text)
      logEvent('transfer', { text: text.slice(0, 300) })
      setTyping(false)
    }, 450)
  }

  // نقر اقتراح جاهز: يُطرح كسؤال من المستخدم ثم تُعرض إجابته المؤكّدة
  // مباشرةً من القاعدة (لا يمرّ بالبحث) — فلا يظهر أبداً "لا أعرف".
  const askSuggestion = (art) => {
    if (typing) return
    push({ role: 'user', text: art.title || art.question || '' })
    setTyping(true)
    logEvent('ask', { text: String(art.title || '').slice(0, 300), suggested: true })
    setTimeout(() => { answerFromArticle(art); setTyping(false) }, 300)
  }

  const resetChat = () => {
    setMessages([{ id: nextId(), role: 'bot', text: ASSISTANT.welcome }])
    if (articles.length) setSuggestions(pickSuggestedArticles(articles, 6))
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-[rgb(var(--color-bg))]" style={{ height: 'var(--visual-height, 100dvh)' }} dir="rtl">
      {/* الترويسة */}
      <div className="shrink-0 page-hero pt-[calc(env(safe-area-inset-top,0px)+0.6rem)] pb-3.5 px-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition-transform shrink-0" aria-label="رجوع">
            <ArrowRight size={20} className="text-white" />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0"><Bot size={24} className="text-white" /></div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-white leading-tight flex items-center gap-1.5">{ASSISTANT.name} <Sparkles size={15} className="text-amber-200" /></h1>
            <p className="text-white/80 text-[11px] leading-tight">مساعد آلي للإجابة على استفساراتك</p>
          </div>
          <button onClick={resetChat} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition-transform shrink-0" aria-label="محادثة جديدة">
            <RotateCcw size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* المحادثة */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} onDiagnosticOption={onDiagnosticOption} onRate={onRate} onNav={(t) => navigate(t)} />
        ))}

        {typing && (
          <div className="flex justify-end">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm flex items-center gap-1">
              <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
            </div>
          </div>
        )}

        {messages.length === 1 && !typing && suggestions.length > 0 && (
          <div className="pt-1">
            <p className="text-[11px] text-gray-400 font-semibold mb-2 px-1">جرّب أن تسأل:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((art) => (
                <button key={art.id} onClick={() => askSuggestion(art)} className="bg-white border border-blue-100 text-blue-700 text-xs font-semibold px-3.5 py-2 rounded-full shadow-sm active:scale-95 transition-transform">{art.title || art.question}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* شريط الكتابة */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.6rem)]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            rows={1}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 max-h-28 leading-relaxed"
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || typing} aria-label="إرسال" className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 active:scale-90 transition-transform disabled:opacity-40 shadow-lg shadow-blue-200">
            <Send size={19} className="-scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, onDiagnosticOption, onRate, onNav }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] ${isUser ? '' : 'flex flex-col items-start w-full'}`}>
        <div className={`px-4 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words ${isUser ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl rounded-tr-md' : 'bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-tl-md'}`}>
          {msg.text}
        </div>

        {/* بطاقات الباقات (مصدر واحد) */}
        {Array.isArray(msg.packages) && msg.packages.length > 0 && (
          <div className="mt-2 w-full space-y-2">
            {msg.packages.map((p) => (
              <div key={p.id} className="bg-white border border-blue-100 rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-black text-gray-800 text-sm">{p.name}</p>
                  <p className="font-black text-blue-600">{p.price} <span className="text-[11px] font-semibold text-gray-400">ريال</span></p>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                  {p.speed && <span className="flex items-center gap-1"><Zap size={12} className="text-blue-500" />{p.speed}</span>}
                  {p.validity && <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" />{p.validity}</span>}
                  {p.quota && <span className="flex items-center gap-1"><Download size={12} className="text-blue-500" />{p.quota}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* الوسائط */}
        {Array.isArray(msg.media) && msg.media.length > 0 && (
          <div className="mt-2 w-full space-y-2">
            {msg.media.map((m) => <MediaItem key={m.id} media={m} />)}
          </div>
        )}

        {/* خيارات التشخيص */}
        {Array.isArray(msg.options) && msg.options.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 w-full">
            {msg.options.map((o) => (
              <button key={o.id} onClick={() => onDiagnosticOption(o)} className="w-full text-right bg-blue-50 border border-blue-100 text-blue-800 text-sm font-semibold px-4 py-2.5 rounded-xl active:scale-[0.98] transition-transform flex items-center justify-between">
                <span>{o.label}</span>
                <ChevronLeft size={16} className="text-blue-400" />
              </button>
            ))}
          </div>
        )}

        {/* أزرار الإجابة */}
        {Array.isArray(msg.buttons) && msg.buttons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.buttons.map((b, i) => <ActionButton key={b.id || i} button={b} onNav={onNav} />)}
          </div>
        )}

        {/* أزرار الدعم */}
        {msg.support && (
          <div className="mt-2 flex flex-wrap gap-2">
            {SUPPORT_ACTIONS.map((a) => (
              <a key={a.key} href={a.href} target={a.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-sm active:scale-95 transition-transform">
                <Headphones size={14} /> {a.label}
              </a>
            ))}
          </div>
        )}

        {/* المواضيع المرتبطة */}
        {Array.isArray(msg.related) && msg.related.length > 0 && (
          <div className="mt-2.5 w-full">
            <p className="text-[10px] text-gray-400 font-bold mb-1.5 px-1">قد يهمّك أيضاً:</p>
            <div className="flex flex-wrap gap-1.5">
              {msg.related.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-semibold px-2.5 py-1.5 rounded-full">
                  <Link2 size={11} className="text-sky-500" /> {r.title || r.id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* تقييم الإجابة */}
        {msg.ratingFor && (
          <div className="mt-2 flex items-center gap-2">
            {msg.rated ? (
              <span className="text-[11px] text-gray-400 font-semibold">شكراً لتقييمك 🌟</span>
            ) : (
              <>
                <span className="text-[11px] text-gray-400 font-semibold">هل أفادتك الإجابة؟</span>
                <button onClick={() => onRate(msg.ratingFor, 'up')} className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center active:scale-90 transition-transform"><ThumbsUp size={14} /></button>
                <button onClick={() => onRate(msg.ratingFor, 'down')} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center active:scale-90 transition-transform"><ThumbsDown size={14} /></button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// أسماء المسارات الفعلية في التطبيق — أي هدف زر "nav" يجب أن يطابق
// أحدها بعد التطبيع، وإلا (بيانات قديمة/خاطئة في لوحة الإدارة) نرجع
// للرئيسية بدل عرض صفحة غير موجودة (404).
const APP_ROUTES = new Set([
  '/', '/offers', '/tools', '/activate', '/deposit', '/coverage',
  '/pos', '/my-cards', '/calculator', '/feedback', '/guide', '/assistant', '/settings',
])
function normalizeNavTarget(raw) {
  const t = String(raw || '').trim()
  if (!t) return '/'
  const withSlash = t.startsWith('/') ? t : `/${t}`
  return APP_ROUTES.has(withSlash) ? withSlash : '/'
}

function ActionButton({ button, onNav }) {
  const b = button
  if (b.kind === 'nav') {
    return (
      <button onClick={() => onNav(normalizeNavTarget(b.target))} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-full active:scale-95 transition-transform shadow-sm">
        <Store size={13} /> {b.label}
      </button>
    )
  }
  if (b.kind === 'support') {
    return (
      <a href={SUPPORT_ACTIONS[0].href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-full active:scale-95 transition-transform shadow-sm">
        <Headphones size={13} /> {b.label}
      </a>
    )
  }
  // link
  return (
    <a href={b.target || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3.5 py-2 rounded-full active:scale-95 transition-transform">
      <ExternalLink size={13} /> {b.label}
    </a>
  )
}

function MediaItem({ media }) {
  const m = media
  const [err, setErr] = useState(false)
  if (m.kind === 'image' && !err) {
    return <img src={m.url} alt={m.title || ''} onError={() => setErr(true)} className="w-full rounded-xl border border-gray-100 shadow-sm" loading="lazy" />
  }
  const Icon = m.kind === 'pdf' ? FileText : m.kind === 'image' ? ImageIcon : Link2
  return (
    <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-semibold active:scale-[0.98] transition-transform">
      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Icon size={16} className="text-amber-600" /></div>
      <span className="truncate flex-1">{m.title || m.url}</span>
      <ExternalLink size={14} className="text-gray-400 shrink-0" />
    </a>
  )
}

function Dot({ delay = '0s' }) {
  return <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block animate-bounce" style={{ animationDelay: delay }} />
}
