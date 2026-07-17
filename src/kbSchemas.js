// ───────────────────────────────────────────────────────────────
// مساعد ستار نت 🤖 — مخططات كل أقسام قاعدة المعرفة + أدوات CSV
//
// هذا الملف يوسّع "مصدر الحقيقة الواحد" ليشمل مخطّطاً رسمياً لكل
// مجموعة يديرها صاحب التطبيق (الأقسام، المرادفات، الأزرار، الوسائط،
// المواضيع المرتبطة، شجرة التشخيص) — بالإضافة لقالب الأسئلة الموجود
// في assistantConfig. كل مخطّط يقود:
//   • محرّرات لوحة الإدارة (CRUD).
//   • استيراد/تصدير CSV بنفس ترتيب الأعمدة.
//   • التطبيع والتحديث بلا تكرار (idField = id).
//
// لا يحتوي هذا الملف على أي بيانات — تعريفات فقط.
// ───────────────────────────────────────────────────────────────

import { KB, ARTICLE_SCHEMA } from './assistantConfig'

// أنواع الحقول المدعومة في المحرّر والاستيراد:
//   string | text | number | boolean | list | ref | ref-list | date
const LIST_TYPES = ['list', 'ref-list']

// ─── مخطّط الأقسام (kb_categories) ───
export const CATEGORY_SCHEMA = [
  { key: 'id',          label: 'المعرّف',        type: 'string',  default: '', csv: true,  note: 'مفتاح ثابت (مثل: charging).' },
  { key: 'name',        label: 'اسم القسم',      type: 'string',  default: '', csv: true },
  { key: 'description', label: 'وصف مختصر',      type: 'text',    default: '', csv: true },
  { key: 'order',       label: 'الترتيب',        type: 'number',  default: 0,  csv: true },
  { key: 'active',      label: 'مفعّل',          type: 'boolean', default: true, csv: true },
  { key: 'createdAt',   label: 'تاريخ الإنشاء',  type: 'date',    default: null, csv: false },
  { key: 'updatedAt',   label: 'آخر تحديث',      type: 'date',    default: null, csv: false },
]

// ─── مخطّط المرادفات (kb_synonyms) ───
// كل سجل = مجموعة كلمات متشابهة يعامَلها المساعد كمعنى واحد.
export const SYNONYM_SCHEMA = [
  { key: 'id',        label: 'المعرّف',       type: 'string',  default: '', csv: true,  note: 'مفتاح ثابت (مثل: net).' },
  { key: 'label',     label: 'الكلمة الأساسية', type: 'string', default: '', csv: true, note: 'مثل: الإنترنت.' },
  { key: 'terms',     label: 'الكلمات المتشابهة', type: 'list', default: [], csv: true, note: 'مفصولة بـ | مثل: نت|انترنت|شبكه|نتي.' },
  { key: 'active',    label: 'مفعّل',         type: 'boolean', default: true, csv: true },
  { key: 'createdAt', label: 'تاريخ الإنشاء', type: 'date',    default: null, csv: false },
  { key: 'updatedAt', label: 'آخر تحديث',     type: 'date',    default: null, csv: false },
]

// ─── مخطّط الأزرار (kb_buttons) ───
// أزرار قابلة لإعادة الاستخدام تُربط بالإجابات. النوع يحدّد سلوكها:
//   nav = يفتح صفحة داخل التطبيق | link = رابط خارجي | support = تحويل للدعم
export const BUTTON_SCHEMA = [
  { key: 'id',        label: 'المعرّف',    type: 'string',  default: '', csv: true,  note: 'مفتاح ثابت (مثل: go-offers).' },
  { key: 'label',     label: 'نص الزر',    type: 'string',  default: '', csv: true },
  { key: 'kind',      label: 'النوع',      type: 'select',  default: 'nav', csv: true, options: [
      { value: 'nav', label: 'صفحة داخل التطبيق' },
      { value: 'link', label: 'رابط خارجي' },
      { value: 'support', label: 'تحويل للدعم' },
    ], note: 'nav / link / support' },
  { key: 'target',    label: 'الوجهة',     type: 'string',  default: '', csv: true, note: 'nav: مسار مثل /offers — link: رابط كامل — support: يُترك فارغاً.' },
  { key: 'active',    label: 'مفعّل',      type: 'boolean', default: true, csv: true },
  { key: 'createdAt', label: 'تاريخ الإنشاء', type: 'date', default: null, csv: false },
  { key: 'updatedAt', label: 'آخر تحديث',  type: 'date',    default: null, csv: false },
]

// ─── مخطّط الوسائط (kb_media) ───
export const MEDIA_SCHEMA = [
  { key: 'id',        label: 'المعرّف',   type: 'string',  default: '', csv: true,  note: 'مفتاح ثابت (مثل: charge-guide).' },
  { key: 'title',     label: 'العنوان',   type: 'string',  default: '', csv: true },
  { key: 'kind',      label: 'النوع',     type: 'select',  default: 'image', csv: true, options: [
      { value: 'image', label: 'صورة' },
      { value: 'pdf', label: 'ملف PDF' },
      { value: 'link', label: 'رابط' },
      { value: 'video', label: 'فيديو (رابط)' },
    ], note: 'image / pdf / link / video' },
  { key: 'url',       label: 'الرابط',    type: 'string',  default: '', csv: true },
  { key: 'active',    label: 'مفعّل',     type: 'boolean', default: true, csv: true },
  { key: 'createdAt', label: 'تاريخ الإنشاء', type: 'date', default: null, csv: false },
  { key: 'updatedAt', label: 'آخر تحديث', type: 'date',    default: null, csv: false },
]

// ─── مخطّط المواضيع المرتبطة (kb_related) ───
// حزمة "قد يهمك أيضاً" قابلة لإعادة الاستخدام: تجمع معرّفات أسئلة.
export const RELATED_SCHEMA = [
  { key: 'id',        label: 'المعرّف',   type: 'string',  default: '', csv: true,  note: 'مفتاح ثابت (مثل: after-charge).' },
  { key: 'label',     label: 'العنوان',   type: 'string',  default: '', csv: true },
  { key: 'targets',   label: 'معرّفات الأسئلة', type: 'list', default: [], csv: true, note: 'معرّفات أسئلة مفصولة بـ |.' },
  { key: 'active',    label: 'مفعّل',     type: 'boolean', default: true, csv: true },
  { key: 'createdAt', label: 'تاريخ الإنشاء', type: 'date', default: null, csv: false },
  { key: 'updatedAt', label: 'آخر تحديث', type: 'date',    default: null, csv: false },
]

// ─── مخطّط شجرة التشخيص (kb_diagnostics) ───
// كل سجل = عقدة في شجرة. الجذر (parent فارغ) يبدأ التشخيص عند مطابقة
// كلماته. العقدة ذات الأبناء تعرض خياراتها كأزرار؛ العقدة بلا أبناء
// (ورقة) تعرض إجابتها. optionLabel = نص الخيار المؤدي لهذه العقدة.
export const DIAGNOSTIC_SCHEMA = [
  { key: 'id',          label: 'معرّف العقدة',   type: 'string',  default: '', csv: true,  note: 'مفتاح ثابت فريد (مثل: slow-1).' },
  { key: 'tree',        label: 'الشجرة',         type: 'string',  default: '', csv: true,  note: 'معرّف الشجرة (مثل: slow-net). كل عقد الشجرة تشترك فيه.' },
  { key: 'parent',      label: 'العقدة الأم',    type: 'string',  default: '', csv: true,  note: 'معرّف العقدة الأم. فارغ = جذر الشجرة.' },
  { key: 'optionLabel', label: 'نص الخيار',      type: 'string',  default: '', csv: true,  note: 'الخيار المؤدي لهذه العقدة من الأم (يُترك فارغاً للجذر).' },
  { key: 'prompt',      label: 'السؤال/الرسالة', type: 'text',    default: '', csv: true,  note: 'ما يعرضه المساعد عند الوصول لهذه العقدة.' },
  { key: 'answer',      label: 'الإجابة النهائية', type: 'text',  default: '', csv: true,  note: 'تُملأ في العقدة الورقة (الحل النهائي).' },
  { key: 'keywords',    label: 'كلمات البدء',    type: 'list',    default: [], csv: true,  note: 'للجذر فقط: كلمات تُشغّل الشجرة. مفصولة بـ |.' },
  { key: 'buttons',     label: 'أزرار مرتبطة',   type: 'list',    default: [], csv: true,  note: 'معرّفات أزرار من جدول الأزرار.' },
  { key: 'needsSupport',label: 'تحويل للدعم؟',   type: 'boolean', default: false, csv: true },
  { key: 'order',       label: 'الترتيب',        type: 'number',  default: 0,  csv: true, note: 'ترتيب ظهور الخيارات تحت نفس الأم.' },
  { key: 'active',      label: 'مفعّل',          type: 'boolean', default: true, csv: true },
  { key: 'createdAt',   label: 'تاريخ الإنشاء',  type: 'date',    default: null, csv: false },
  { key: 'updatedAt',   label: 'آخر تحديث',      type: 'date',    default: null, csv: false },
]

// ─── فهرس المجموعات القابلة للإدارة ───
// كل مدخل: { key, coll, title, sub, schema, titleField, subField }
export const MANAGED = {
  kb: {
    key: 'kb', coll: KB.articles, title: 'قاعدة المعرفة', sub: 'الأسئلة والأجوبة',
    schema: ARTICLE_SCHEMA, titleField: 'title', subField: 'question',
  },
  categories: {
    key: 'categories', coll: KB.categories, title: 'الأقسام', sub: 'تصنيف المحتوى',
    schema: CATEGORY_SCHEMA, titleField: 'name', subField: 'description',
  },
  synonyms: {
    key: 'synonyms', coll: KB.synonyms, title: 'المرادفات', sub: 'الكلمات المتشابهة',
    schema: SYNONYM_SCHEMA, titleField: 'label', subField: 'terms',
  },
  diagnostics: {
    key: 'diagnostics', coll: KB.diagnostics, title: 'شجرة التشخيص', sub: 'عقد الأسئلة المتتابعة',
    schema: DIAGNOSTIC_SCHEMA, titleField: 'prompt', subField: 'tree',
  },
  buttons: {
    key: 'buttons', coll: KB.buttons, title: 'الأزرار', sub: 'أزرار الردود',
    schema: BUTTON_SCHEMA, titleField: 'label', subField: 'target',
  },
  media: {
    key: 'media', coll: KB.media, title: 'الوسائط', sub: 'صور وروابط وملفات',
    schema: MEDIA_SCHEMA, titleField: 'title', subField: 'url',
  },
  related: {
    key: 'related', coll: KB.related, title: 'المواضيع المرتبطة', sub: 'حزم «قد يهمك أيضاً»',
    schema: RELATED_SCHEMA, titleField: 'label', subField: 'targets',
  },
}

// ─── أدوات عامة على أي مخطّط ───

// أعمدة CSV (بالترتيب) للحقول التي csv:true.
export function csvColumns(schema) {
  return schema.filter((f) => f.csv).map((f) => f.key)
}

function listFieldsOf(schema) {
  return schema.filter((f) => LIST_TYPES.includes(f.type)).map((f) => f.key)
}

// إنشاء سجل جديد بقيم المخطّط الافتراضية.
export function newRecord(schema, overrides = {}) {
  const now = new Date().toISOString()
  const rec = {}
  for (const f of schema) rec[f.key] = Array.isArray(f.default) ? [...f.default] : f.default
  if (schema.some((f) => f.key === 'createdAt')) rec.createdAt = now
  if (schema.some((f) => f.key === 'updatedAt')) rec.updatedAt = now
  return { ...rec, ...overrides }
}

// تطبيع سجل (من محرّر أو استيراد) ليطابق أنواع المخطّط.
export function normalizeRecord(schema, raw = {}) {
  const listFields = listFieldsOf(schema)
  const rec = newRecord(schema)
  for (const f of schema) {
    if (!(f.key in raw)) continue
    let v = raw[f.key]
    if (listFields.includes(f.key)) {
      if (Array.isArray(v)) rec[f.key] = v.map((s) => String(s).trim()).filter(Boolean)
      else rec[f.key] = String(v ?? '').split('|').map((s) => s.trim()).filter(Boolean)
    } else if (f.type === 'boolean') {
      if (v === true || v === false) { rec[f.key] = v }
      else {
        const s = String(v ?? '').trim().toLowerCase()
        // خلية فارغة → القيمة الافتراضية للمخطّط (active الافتراضي = مفعّل)
        if (s === '') rec[f.key] = f.default
        else rec[f.key] = ['true', '1', 'yes', 'y', 'on', 'نعم', 'مفعل', 'مفعّل'].includes(s)
      }
    } else if (f.type === 'number') {
      rec[f.key] = Number(v) || 0
    } else {
      rec[f.key] = v == null ? '' : v
    }
  }
  if (schema.some((f) => f.key === 'updatedAt')) rec.updatedAt = new Date().toISOString()
  return rec
}

// ─── CSV: تحليل نص → صفوف كائنية (مفاتيحها صف العناوين) ───
// محلّل بسيط يدعم علامات الاقتباس والفواصل والأسطر داخل الخلايا.
export function parseCsv(text) {
  const src = String(text || '').replace(/^\uFEFF/, '') // إزالة BOM
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else if (c === '\r') {
      // تجاهل — يُعالَج مع \n
    } else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  // صف العناوين
  const nonEmpty = rows.filter((r) => r.some((c) => String(c).trim() !== ''))
  if (!nonEmpty.length) return []
  const headers = nonEmpty[0].map((h) => String(h).trim())
  return nonEmpty.slice(1).map((r) => {
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? '' })
    return obj
  })
}

// CSV: صفوف → نص، بترتيب أعمدة المخطّط. القيم متعددة القيم تُدمج بـ |.
export function toCsv(rows, schema) {
  const cols = csvColumns(schema)
  const listFields = listFieldsOf(schema)
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const head = cols.join(',')
  const body = rows.map((r) =>
    cols.map((k) => {
      let v = r[k]
      if (listFields.includes(k)) v = Array.isArray(v) ? v.join('|') : v
      if (typeof v === 'boolean') v = v ? 'true' : 'false'
      return esc(v)
    }).join(',')
  )
  return [head, ...body].join('\n')
}
