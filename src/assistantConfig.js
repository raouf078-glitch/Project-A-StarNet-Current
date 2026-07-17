// ───────────────────────────────────────────────────────────────
// مساعد ستار نت 🤖 — الإعدادات المركزية (المرحلة الأولى: البنية فقط)
//
// هذا الملف هو "مصدر الحقيقة الواحد" لكل ما يخص المساعد:
//   • أسماء جداول قاعدة البيانات (تُقرأ في شاشة المحادثة ولوحة الإدارة معاً).
//   • شخصية المساعد ورسالة الترحيب.
//   • محرّك المطابقة (تطبيع النص العربي + المرادفات + التسجيل).
//
// مبدأ Single Source of Truth:
//   الباقات (packages) والعروض ونقاط البيع تبقى في جداولها الأصلية،
//   ولا تُنسخ داخل قاعدة معرفة المساعد. المساعد يقرأ منها مباشرة.
//
// المرحلة الأولى لا تحتوي على أي بيانات (أسئلة/أجوبة/مرادفات/شجرة).
// البنية جاهزة لاستقبال المحتوى في المرحلة الثانية.
// ───────────────────────────────────────────────────────────────

import { db } from './lib/db'
import { SUPPORT_WA, SUPPORT_PHONE, SOCIAL } from './netConfig'

// ─── أسماء جداول قاعدة البيانات (بادئة kb_ لتجميعها وتمييزها) ───
export const KB = {
  articles: 'kb_articles', // الأسئلة والأجوبة (قاعدة المعرفة)
  categories: 'kb_categories', // الأقسام
  synonyms: 'kb_synonyms', // المرادفات والكلمات المتشابهة
  diagnostics: 'kb_diagnostics', // شجرة التشخيص التفاعلية
  buttons: 'kb_buttons', // الأزرار القابلة لإعادة الاستخدام
  media: 'kb_media', // مكتبة الوسائط (صور / روابط / PDF)
  related: 'kb_related', // المواضيع المرتبطة
  unanswered: 'kb_unanswered', // الأسئلة التي لم يفهمها المساعد
  events: 'kb_stats_events', // سجل الأحداث (للإحصائيات)
}

// ───────────────────────────────────────────────────────────────
// القالب الرسمي لسجل قاعدة المعرفة (ARTICLE_SCHEMA)
// ───────────────────────────────────────────────────────────────
// هذا هو النموذج الموحّد الذي يعتمد عليه النظام بالكامل. كل سجل في
// قاعدة المعرفة (kb_articles) يلتزم بهذه الحقول. القالب قابل للتوسّع:
// قاعدة البيانات بلا مخطّط ثابت، فإضافة حقل جديد مستقبلاً لا يتطلب
// تغيير هذا القالب ولا هجرة البيانات — تُضاف الحقول الجديدة هنا فقط.
//
// كل حقل معرّف بـ:
//   key      : اسم الحقل في القاعدة وفي أعمدة ملف الاستيراد (CSV).
//   label    : الاسم العربي (يُعرض في لوحة الإدارة لاحقاً).
//   type     : النوع — string | text | number | boolean | list | ref-list.
//   list     : القيم متعددة، تُفصل في CSV بالرمز | (pipe).
//   default  : القيمة الافتراضية عند إنشاء سجل جديد.
//   csv      : هل يظهر كعمود في قالب الاستيراد؟ (id/التواريخ تُدار تلقائياً).
export const ARTICLE_SCHEMA = [
  { key: 'id',         label: 'المعرّف الفريد',      type: 'string',  default: '',    csv: true,  note: 'مفتاح ثابت فريد (مثل: chg-001). يُستخدم للتحديث دون تكرار.' },
  { key: 'category',   label: 'القسم',               type: 'ref',     default: '',    csv: true,  note: 'معرّف قسم من جدول الأقسام (kb_categories).' },
  { key: 'title',      label: 'عنوان السؤال',        type: 'string',  default: '',    csv: true,  note: 'عنوان مختصر يظهر في القوائم والاقتراحات.' },
  { key: 'question',   label: 'نص السؤال',           type: 'text',    default: '',    csv: true,  note: 'صياغة السؤال كما قد يكتبه العميل.' },
  { key: 'answer',     label: 'الإجابة',             type: 'text',    default: '',    csv: true,  note: 'نص الإجابة. لا تُكتب فيه أسعار الباقات — تُقرأ من مصدرها.' },
  { key: 'keywords',   label: 'الكلمات المفتاحية',   type: 'list',    default: [],    csv: true,  note: 'كلمات المطابقة، مفصولة بـ | في CSV.' },
  { key: 'synonyms',   label: 'المرادفات',           type: 'list',    default: [],    csv: true,  note: 'كلمات متشابهة إضافية خاصة بهذا السؤال.' },
  { key: 'related',    label: 'المواضيع المرتبطة',   type: 'ref-list',default: [],    csv: true,  note: 'معرّفات أسئلة مرتبطة (قد يهمك أيضاً).' },
  { key: 'buttons',    label: 'الأزرار المرتبطة',    type: 'ref-list',default: [],    csv: true,  note: 'معرّفات أزرار من جدول الأزرار (kb_buttons).' },
  { key: 'media',      label: 'الوسائط',             type: 'ref-list',default: [],    csv: true,  note: 'معرّفات وسائط من جدول الوسائط (kb_media).' },
  { key: 'needsSupport',label: 'تحويل للدعم؟',       type: 'boolean', default: false, csv: true,  note: 'إذا true يُقترح التحويل للدعم مع الإجابة.' },
  { key: 'priority',   label: 'أولوية الظهور',       type: 'number',  default: 0,     csv: true,  note: 'الأعلى يظهر أولاً عند تساوي المطابقة.' },
  { key: 'active',     label: 'حالة التفعيل',        type: 'boolean', default: true,  csv: true,  note: 'نشط / غير نشط. غير النشط لا يظهر للعملاء.' },
  { key: 'createdAt',  label: 'تاريخ الإنشاء',       type: 'date',    default: null,  csv: false, note: 'يُضبط تلقائياً عند الإنشاء.' },
  { key: 'updatedAt',  label: 'آخر تحديث',           type: 'date',    default: null,  csv: false, note: 'يُضبط تلقائياً عند كل تعديل.' },
]

// قالب أعمدة CSV للاستيراد (بالترتيب) — الحقول التي csv:true فقط.
// القيم المتعددة (list / ref-list) تُفصل داخل الخلية بالرمز | (pipe).
export const ARTICLE_CSV_COLUMNS = ARTICLE_SCHEMA.filter((f) => f.csv).map((f) => f.key)

// الحقول متعددة القيم — تُطبّع من نص CSV إلى مصفوفة والعكس.
const ARTICLE_LIST_FIELDS = ARTICLE_SCHEMA
  .filter((f) => f.type === 'list' || f.type === 'ref-list')
  .map((f) => f.key)

// إنشاء سجل جديد مطابق للقالب بقيمه الافتراضية.
// يُستخدم في محرّرات لوحة الإدارة (المرحلة الثالثة) وفي الاستيراد.
export function newArticle(overrides = {}) {
  const now = new Date().toISOString()
  const rec = {}
  for (const f of ARTICLE_SCHEMA) {
    rec[f.key] = Array.isArray(f.default) ? [...f.default] : f.default
  }
  rec.createdAt = now
  rec.updatedAt = now
  return { ...rec, ...overrides }
}

// تطبيع سجل قادم من الاستيراد ليطابق القالب:
// يحوّل حقول القوائم من "a|b|c" إلى ['a','b','c']، ويضبط الأنواع.
export function normalizeArticle(raw = {}) {
  const rec = newArticle()
  for (const f of ARTICLE_SCHEMA) {
    if (!(f.key in raw)) continue
    let v = raw[f.key]
    if (ARTICLE_LIST_FIELDS.includes(f.key)) {
      if (Array.isArray(v)) rec[f.key] = v.filter(Boolean)
      else rec[f.key] = String(v || '').split('|').map((s) => s.trim()).filter(Boolean)
    } else if (f.type === 'boolean') {
      rec[f.key] = v === true || v === 'true' || v === '1' || v === 'نعم'
    } else if (f.type === 'number') {
      rec[f.key] = Number(v) || 0
    } else {
      rec[f.key] = v
    }
  }
  rec.updatedAt = new Date().toISOString()
  return rec
}

// ─── شخصية المساعد ───
// رسمي لكن ودود • لا يخمّن • يجيب فقط من قاعدة المعرفة •
// عند عدم وجود إجابة يوجّه للدعم الفني • لا يقرأ بيانات المستخدمين
// (User Manager) ولا الرصيد ولا الاشتراك ولا ينفّذ أي عملية على الحسابات.
export const ASSISTANT = {
  name: 'مساعد ستار نت',
  emoji: '🤖',
  welcome:
    'أهلاً بك في مساعد ستار نت 🤖\nأنا هنا لمساعدتك في الاستفسارات المتعلقة بالشبكة: الباقات، الشحن، نظام النقاط، نقاط البيع، والأعطال الشائعة.\nاكتب سؤالك وسأساعدك، وإن احتجت تدخّلاً بشرياً سأوجّهك للدعم الفني مباشرة.',
  // رسالة التوجيه للدعم عند عدم وجود إجابة في قاعدة المعرفة.
  fallback:
    'عذراً، لم أجد إجابة دقيقة لسؤالك ضمن معلوماتي حالياً. لتفادي إعطائك معلومة غير مؤكدة، سأوجّهك مباشرة إلى فريق الدعم الفني ليساعدك.',
}

// أزرار الدعم الجاهزة (تُستخدم في رسالة التوجيه).
export const SUPPORT_ACTIONS = [
  { key: 'whatsapp', label: 'واتساب الدعم', href: SOCIAL.whatsapp },
  { key: 'call', label: 'اتصال مباشر', href: `tel:+${SUPPORT_WA}` },
]

// ─── ردود التحية والحضور (لا تدخل محرك البحث إطلاقاً) ───
// رسائل قصيرة مثل "السلام عليكم" أو "الو موجود؟" يجب أن يُرد عليها
// بأسلوب طبيعي مباشرة، دون محاولة البحث عنها في قاعدة المعرفة
// (وإلا ستظهر كـ"سؤال غير مفهوم" رغم أنها ليست سؤالاً أصلاً).
export const GREETING_REPLY = 'وعليكم السلام ورحمة الله وبركاته 🌹\nأهلاً وسهلاً بك في مساعد ستار نت.\nكيف أقدر أساعدك اليوم؟'
export const PRESENCE_REPLY = 'نعم، أنا موجود معك 😊\nتفضل، كيف أقدر أخدمك؟'

const GREETING_PHRASES = [
  'السلام عليكم ورحمة الله وبركاته', 'السلام عليكم ورحمة الله', 'السلام عليكم', 'سلام عليكم', 'وعليكم السلام',
  'سلام', 'مرحبا', 'مرحباً', 'مرحبتين', 'يا مرحبا', 'اهلا', 'اهلا وسهلا', 'أهلا', 'هلا', 'هلا والله', 'هلا بك',
  'هاي', 'هلو', 'hi', 'hello', 'صباح الخير', 'صباح النور', 'مساء الخير', 'مساء النور', 'تحية طيبة',
]
const PRESENCE_PHRASES = [
  'الو', 'ألو', 'الو الو', 'موجود', 'انت موجود', 'حد موجود', 'احد موجود', 'في احد', 'فيه احد', 'يوجد احد',
  'هل يوجد احد', 'تسمعني', 'تسمعوني', 'في حد', 'حد في الخدمة', 'رد', 'حد يرد',
]

// رسالة قصيرة (لا تتجاوز 6 كلمات) وتُطابق إحدى عبارات القائمة تماماً
// أو تبدأ بها — لتفادي تفعيل هذا المسار خطأً على سؤال حقيقي طويل يبدأ
// بمجاملة (مثل "مرحبا، عندي مشكلة في النت").
function matchesShortPhrase(query, phrases) {
  const q = normalizeAr(query)
  if (!q) return false
  if (q.split(' ').filter(Boolean).length > 6) return false
  return phrases.some((p) => {
    const np = normalizeAr(p)
    return q === np || q.startsWith(np + ' ') || (np.length > 2 && q.startsWith(np))
  })
}
export function isGreeting(query) {
  return matchesShortPhrase(query, GREETING_PHRASES)
}
export function isPresenceCheck(query) {
  return matchesShortPhrase(query, PRESENCE_PHRASES)
}

// اقتراحات سريعة تظهر أسفل شاشة الترحيب (نصوص إرشادية فقط — لا أجوبة).
export const QUICK_PROMPTS = [
  'كيف أشحن الكرت؟',
  'ما هي الباقات والأسعار؟',
  'الإنترنت بطيء',
  'نظام النقاط',
  'أقرب نقطة بيع',
]

// ─── اقتراحات "جرّب أن تسأل" المتجدّدة ───
// تُبنى مباشرةً من قاعدة المعرفة الحيّة، فكل اقتراح مضمون أن له إجابة
// (لا يظهر أبداً اقتراح ينتهي بـ«لا أعرف»). تختار مجموعة عشوائية متنوّعة
// عبر الأقسام في كل فتح/تحديث للمحادثة، فلا تتكرّر نفس المجموعة دائماً.
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
export function pickSuggestedArticles(articles = [], n = 6) {
  const active = articles.filter((a) => a && a.active !== false && (a.title || a.question))
  if (!active.length) return []
  // تجميع حسب القسم لضمان التنوّع (باقات/شحن/تغطية/أعطال/دعم/تطبيق...).
  const byCat = new Map()
  for (const a of active) {
    const c = a.category || '_'
    if (!byCat.has(c)) byCat.set(c, [])
    byCat.get(c).push(a)
  }
  const cats = shuffleInPlace([...byCat.keys()])
  const used = new Set()
  const picked = []
  // خطوة أولى: سؤال واحد من كل قسم (أقصى تنوّع).
  for (const c of cats) {
    if (picked.length >= n) break
    const pool = byCat.get(c)
    const a = pool[Math.floor(Math.random() * pool.length)]
    if (a && !used.has(a.id)) { used.add(a.id); picked.push(a) }
  }
  // إكمال الباقي عشوائياً إن بقي مكان.
  if (picked.length < n) {
    const rest = shuffleInPlace(active.filter((a) => !used.has(a.id)))
    for (const a of rest) {
      if (picked.length >= n) break
      used.add(a.id); picked.push(a)
    }
  }
  return shuffleInPlace(picked).slice(0, n)
}

// ─── تطبيع النص العربي ───
// يوحّد الهمزات والألف والياء والتاء المربوطة، ويزيل التشكيل والتطويل،
// ليتسامح مع الأخطاء الإملائية البسيطة ويحسّن المطابقة.
export function normalizeAr(input = '') {
  return String(input)
    .replace(/[\u064B-\u0652\u0670\u0653-\u0655]/g, '') // التشكيل
    .replace(/\u0640/g, '') // التطويل (ـــ)
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0600-\u06FF0-9a-zA-Z ]/g, ' ') // الرموز
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// كلمات وظيفية عامة (أدوات استفهام/ربط) — تُستبعد من المطابقة لأنها
// لا تحمل معنى مميّزاً، ووجودها في أي عبارة كان يسبّب تفعيل شجرة
// التشخيص خطأً لمجرّد اشتراك كلمة عامة مثل "ما" مع عبارة مثل "ما يشتغل".
const STOPWORDS = new Set([
  'ما', 'ماذا', 'هل', 'هي', 'هو', 'من', 'في', 'علي', 'عن', 'كيف', 'اين',
  'متي', 'لماذا', 'ليش', 'ايش', 'اي', 'الي', 'مع', 'او', 'ثم', 'قد', 'كل',
  'كم', 'لا', 'لم', 'لن', 'ان', 'انا', 'انت', 'انتم', 'هذا', 'هذه', 'ذلك',
  'التي', 'الذي', 'عند', 'بعد', 'قبل', 'يا', 'يعني', 'بس', 'فقط', 'يا ريت',
  'ابغي', 'ابي', 'اريد', 'ودي', 'لو', 'سمحت',
])

// تقسيم النص إلى كلمات مُطبّعة (مع تجاهل الكلمات القصيرة جداً والوظيفية).
export function tokenize(input = '') {
  return normalizeAr(input)
    .split(' ')
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
}

// توسيع كلمات السؤال بالمرادفات (kb_synonyms).
// كل مجموعة مرادفات: { terms: ['نت','انترنت','شبكه', ...] }.
function expandWithSynonyms(tokens, synonymGroups = []) {
  const set = new Set(tokens)
  for (const g of synonymGroups) {
    const terms = (g.terms || []).map(normalizeAr)
    if (terms.some((t) => set.has(t))) {
      terms.forEach((t) => set.add(t))
    }
  }
  return [...set]
}

// ─── محرّك البحث ───
// يبحث في قاعدة المعرفة (kb_articles) ويرجع النتائج مرتّبة تنازلياً
// حسب قوة المطابقة ثم الأولوية (priority). الكلمات المفتاحية والعنوان
// لها وزن أعلى. يتسامح مع الأخطاء البسيطة عبر تطبيع النص + المرادفات.
// ترتيب أولوية الإشارات: 1) نص السؤال الكامل (question) 2) الكلمات
// المفتاحية (keywords) 3) المرادفات الخاصة بالسؤال (synonyms) 4) عنوان
// السؤال (title، إشارة أضعف/عامة).
export function searchArticles(query, articles = [], synonymGroups = [], { limit = 5 } = {}) {
  const baseTokens = tokenize(query)
  if (!baseTokens.length || !articles.length) return []

  const qset = new Set(expandWithSynonyms(baseTokens, synonymGroups))

  const scored = []
  for (const art of articles) {
    if (art.active === false) continue
    const questionTokens = new Set(tokenize(art.question || ''))
    const keyTokens = new Set(
      tokenize((Array.isArray(art.keywords) ? art.keywords : String(art.keywords || '').split(',')).join(' ')),
    )
    const synTokens = new Set(
      tokenize((Array.isArray(art.synonyms) ? art.synonyms : String(art.synonyms || '').split(',')).join(' ')),
    )
    const titleTokens = new Set(tokenize(art.title || ''))

    let score = 0
    for (const t of qset) {
      if (questionTokens.has(t)) score += 4 // مطابقة نص السؤال — أقوى إشارة
      if (keyTokens.has(t)) score += 3 // الكلمات المفتاحية
      if (synTokens.has(t)) score += 2 // مرادفات خاصة بالسؤال
      if (titleTokens.has(t)) score += 1 // عنوان عام — إشارة أضعف
    }
    if (score > 0) scored.push({ article: art, score, priority: Number(art.priority) || 0 })
  }

  scored.sort((a, b) => b.score - a.score || b.priority - a.priority)
  return scored.slice(0, limit)
}

// أقرب سؤال واحد (توافقية للاستخدامات القديمة).
export function matchArticle(query, articles = [], synonymGroups = []) {
  const [best] = searchArticles(query, articles, synonymGroups, { limit: 1 })
  return best || null
}

// ─── هل السؤال يصف عطلاً/مشكلة فعلياً؟ ───
// شجرة التشخيص لا تُشغَّل إلا لأسئلة المشاكل الصريحة (بطيء، يفصل، لا
// يعمل...). الأسئلة المعلوماتية (الباقات، الأسعار، نقاط البيع...) يجب
// أن تُجاب مباشرة من قاعدة المعرفة أو مصدرها الحي دون المرور بالتشخيص.
const PROBLEM_INDICATORS = [
  'بطيء', 'بطي', 'بطئ', 'بطيئ', 'ثقيل', 'تقيل',
  'يفصل', 'ينقطع', 'مقطوع', 'منقطع', 'انقطاع', 'قطع', 'فاصل', 'قاطع',
  'متقطع', 'واقف', 'متوقف', 'ما يشتغل', 'ماي شتغل', 'لا يعمل', 'ما يعمل',
  'لا يوجد اتصال', 'ما فيه نت', 'بدون نت', 'ما فيه اتصال', 'مايدخل',
  'ما يدخل', 'لا يدخل', 'لاق', 'لق', 'خطا', 'مشكله', 'مشكل', 'عطل',
  'عطلان', 'خربان', 'ما اقدر', 'ما استطيع', 'لا استطيع', 'ما يفتح',
  'لا يفتح', 'ضعيف', 'ضعيفه', 'اشاره ضعيفه',
]
export function isProblemQuery(query) {
  const q = normalizeAr(query)
  return PROBLEM_INDICATORS.some((w) => q.includes(normalizeAr(w)))
}

// ─── محرّك شجرة التشخيص ───
// العقد مخزّنة مسطّحة في kb_diagnostics. الجذر: parent فارغ + كلمات بدء.
// العقدة ذات الأبناء = فرع (تعرض خياراتها)؛ بلا أبناء = ورقة (تعرض الحل).

// إيجاد جذر شجرة يطابق كلمات البدء في استعلام المستخدم.
export function findDiagnosticRoot(query, nodes = [], synonymGroups = []) {
  const qset = new Set(expandWithSynonyms(tokenize(query), synonymGroups))
  if (!qset.size) return null
  let best = null
  for (const n of nodes) {
    if (n.active === false) continue
    if (n.parent) continue // الجذور فقط
    const kw = Array.isArray(n.keywords) ? n.keywords : String(n.keywords || '').split('|')
    const kwTokens = new Set(tokenize(kw.join(' ')))
    let score = 0
    for (const t of qset) if (kwTokens.has(t)) score++
    if (score > 0 && (!best || score > best.score)) best = { node: n, score }
  }
  return best ? best.node : null
}

// أبناء عقدة معيّنة داخل نفس الشجرة، مرتّبين.
export function diagnosticChildren(nodes = [], tree, parentId) {
  return nodes
    .filter((n) => n.active !== false && n.tree === tree && (n.parent || '') === (parentId || ''))
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
}

// هل العقدة ورقة (لا أبناء لها)؟
export function isLeafNode(nodes = [], node) {
  if (!node) return true
  return diagnosticChildren(nodes, node.tree, node.id).length === 0
}

// ─── المواضيع المرتبطة ───
// يرجع أسئلة مرتبطة: من حقل related في السؤال (معرّفات)، فإن لم توجد
// يقترح من نفس القسم. حزم kb_related تُوسّع المعرّفات أيضاً.
export function resolveRelated(article, articles = [], relatedBundles = [], { limit = 4 } = {}) {
  if (!article) return []
  const ids = new Set()
  const raw = Array.isArray(article.related) ? article.related : []
  for (const r of raw) {
    // قد يكون معرّف سؤال مباشر أو معرّف حزمة مواضيع مرتبطة.
    ids.add(r)
    const bundle = relatedBundles.find((b) => b.id === r && b.active !== false)
    if (bundle) (bundle.targets || []).forEach((t) => ids.add(t))
  }
  let out = articles.filter((a) => a.active !== false && ids.has(a.id) && a.id !== article.id)
  if (!out.length && article.category) {
    out = articles
      .filter((a) => a.active !== false && a.category === article.category && a.id !== article.id)
      .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0))
  }
  return out.slice(0, limit)
}

// ─── حلّ الأزرار والوسائط (من معرّفات إلى كائنات جاهزة للعرض) ───
export function resolveButtons(ids = [], buttonRows = []) {
  const arr = Array.isArray(ids) ? ids : []
  return arr
    .map((id) => buttonRows.find((b) => b.id === id && b.active !== false))
    .filter(Boolean)
}

export function resolveMedia(ids = [], mediaRows = []) {
  const arr = Array.isArray(ids) ? ids : []
  return arr
    .map((id) => mediaRows.find((m) => m.id === id && m.active !== false))
    .filter(Boolean)
}

// ─── التسجيل (للإحصائيات وتطوير المساعد) ───
// يُستدعى فقط عند تفاعل المستخدم (إرسال رسالة) — لا يعمل تلقائياً.

export async function logEvent(type, payload = {}) {
  try {
    await db.insertShared(KB.events, { type, ...payload, at: new Date().toISOString() })
  } catch {
    /* التسجيل اختياري — لا يعطّل المحادثة عند الفشل */
  }
}

export async function logUnanswered(question) {
  try {
    await db.insertShared(KB.unanswered, {
      question: String(question || '').slice(0, 500),
      resolved: false,
      at: new Date().toISOString(),
    })
  } catch {
    /* اختياري */
  }
}

// تسجيل تقييم الإجابة (👍/👎) — يُستدعى بضغط المستخدم فقط.
export async function logRating(articleId, value) {
  return logEvent('rating', { articleId, value }) // value: 'up' | 'down'
}

// ─── Single Source of Truth: نية الباقات ───
// المساعد لا يخزّن أسعار الباقات. عند اكتشاف نيّة تخص الباقات، تقرأ
// شاشة المحادثة الباقات الحيّة من مجموعتها الأصلية (packages) وتعرضها.
const PACKAGE_INTENT = [
  'باقه', 'باقات', 'سعر', 'اسعار', 'كم سعر', 'اشتراك', 'جيجا', 'جيقا',
  'عرض', 'عروض', 'الباقه', 'الاسعار', 'حزمه',
]
export function isPackageQuery(query) {
  const q = normalizeAr(query)
  return PACKAGE_INTENT.some((w) => q.includes(normalizeAr(w)))
}

export { SUPPORT_WA, SUPPORT_PHONE, SOCIAL }
