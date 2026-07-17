// ───────────────────────────────────────────────────────────────
// إعدادات الاتصال المركزية لشبكة ستار نت (MikroTik Hotspot)
// كل منطق تسجيل الدخول وروابط التواصل والثوابت تمر من هنا.
// ───────────────────────────────────────────────────────────────

const GW_KEY = 'starnet_gateway'
const CODES_KEY = 'starnet_recent_codes'

// ─── الثوابت العامة ───
export const LOGO_URL =
  'https://api.whacka.app/storage/v1/object/public/app-images/ca79f49f-ce1e-43ca-93f5-1080afd86272/images/starnet_logo.png'

export const NETWORK_NAME = 'ستار نت'

// رقم الدعم والتواصل
export const SUPPORT_PHONE = '777175885'
export const SUPPORT_WA = '967777175885'

// المطوّر
export const DEV_NAME = 'رؤوف بن صيدة'
export const DEV_WA = '967777175885'

// روابط التواصل الاجتماعي (يمكن تعديلها لاحقاً بالروابط الرسمية)
export const SOCIAL = {
  whatsapp: `https://wa.me/${SUPPORT_WA}`,
  telegram: 'https://t.me/starnet_ye',
  facebook: 'https://www.facebook.com/StarNet.cafe/',
  website: 'http://s.net',
}

// ─── بيانات الإيداع البنكي لطلب الباقات ───
export const DEPOSIT_NAME = 'عبدالرؤوف رمضان بن صيدة'

export const DEPOSIT_ACCOUNTS = [
  { bank: 'بنك الأصغر الإسلامي', label: 'رقم حساب العمقي', number: '254109438' },
  { bank: 'بنك الكريمي للتمويل الأصغر الإسلامي', label: 'رقم حساب كريمي', number: '3011886239' },
  { bank: 'أم فلوس (خدمة حاسب)', label: 'رقم حساب أم فلوس', number: '1525539' },
]

// عنوان الـ Gateway الافتراضي لشبكتك — يمكن تغييره من الإعدادات.
export const DEFAULT_GATEWAY = '3.3.3.1'

// القائمة البيضاء — البوابات المسموح بها فقط. لمنع استخدام التطبيق مع شبكات أخرى.
// لإضافة بوابة مستقبلاً، أضف عنوانها هنا.
export const ALLOWED_GATEWAYS = ['3.3.3.1', 's.net', 'login.s.net']

// التحقق إن كان العنوان ضمن القائمة البيضاء
export function isAllowedGateway(ip) {
  const clean = normalizeGateway(ip).toLowerCase()
  return ALLOWED_GATEWAYS.some(g => g.toLowerCase() === clean)
}

// عناوين البوابات الشائعة لمحاولة الكشف التلقائي
export const GATEWAY_CANDIDATES = [
  '3.3.3.1',
  '10.5.50.1',
  '192.168.88.1',
  '192.168.10.1',
  '10.0.0.1',
  '172.16.0.1',
]

// تنظيف العنوان من أي بروتوكول أو مسار زائد
export function normalizeGateway(ip) {
  return String(ip || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/login.*$/i, '')
    .replace(/\/+$/, '')
}

export function getGateway() {
  try {
    return localStorage.getItem(GW_KEY) || DEFAULT_GATEWAY
  } catch {
    return DEFAULT_GATEWAY
  }
}

export function setGateway(ip) {
  const clean = normalizeGateway(ip)
  try {
    if (clean) localStorage.setItem(GW_KEY, clean)
  } catch {}
  return clean
}

export function isGatewaySet() {
  try {
    return !!localStorage.getItem(GW_KEY)
  } catch {
    return false
  }
}

// ─── محاولة الكشف التلقائي عن بوابة الشبكة ───
// تجرّب الوصول لعناوين البوابات الشائعة عبر تحميل مورد منها.
// ملاحظة: المتصفحات تمنع طلبات HTTP من تطبيق HTTPS (محتوى مختلط)،
// لذلك قد يفشل الكشف ويعتمد المستخدم على الإدخال اليدوي.
export function detectGateway(timeout = 1800) {
  return new Promise((resolve) => {
    let settled = false
    let pending = GATEWAY_CANDIDATES.length
    const finish = (ip) => {
      if (settled) return
      settled = true
      if (ip) setGateway(ip)
      resolve(ip)
    }
    GATEWAY_CANDIDATES.forEach((ip) => {
      const img = new Image()
      const t = setTimeout(() => {
        img.onload = img.onerror = null
        if (--pending === 0) finish(null)
      }, timeout)
      img.onload = () => {
        clearTimeout(t)
        finish(ip)
      }
      img.onerror = () => {
        clearTimeout(t)
        if (--pending === 0) finish(null)
      }
      // أي مورد على البوابة — نجاح التحميل يعني أنها تستجيب
      img.src = `http://${ip}/login?probe=${Date.now()}`
    })
  })
}

// ─── فحص الوصول الفعلي للإنترنت ───
// navigator.onLine يكشف فقط اتصال الواي‑فاي، وليس إن كان المستخدم
// مسجّلاً دخوله فعلياً عبر الهوتسبوت. هذه الدالة تحاول الوصول لمورد
// خارجي على الإنترنت: نجاحها يعني إنترنت حقيقي، وفشلها (بعد الخروج
// من الهوتسبوت أو حجب البوابة) يعني غير متصل.
export async function checkInternet(timeout = 5000) {
  // إن لم يكن هناك أي اتصال شبكة أصلاً فهو حتماً غير متصل
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false

  const endpoints = [
    'https://www.gstatic.com/generate_204',
    'https://www.cloudflare.com/cdn-cgi/trace',
    'https://www.google.com/favicon.ico',
  ]

  for (const url of endpoints) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), timeout)
    try {
      await fetch(`${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(t)
      // نجاح الطلب (دون خطأ شبكة) يعني أن الإنترنت متاح
      return true
    } catch {
      clearTimeout(t)
      // نجرّب المورد التالي
    }
  }
  return false
}

// استخراج رقم الكرت من قيمة الباركود.
// باركود البطاقة قد يكون رقماً مجرداً أو رابطاً كاملاً مثل:
//   http://3.3.3.1/login?username=12345678&password=...
//   http://s.net/login?u=12345678
// نرجّع رقم الكرت فقط (username/u أو آخر جزء من المسار) لا الرابط كاملاً.
export function extractCardCode(raw) {
  const v = String(raw || '').trim()
  if (!v) return ''
  // إن لم يكن رابطاً، نُعيده كما هو (رقم كرت مباشر)
  if (!/^https?:\/\//i.test(v) && !v.includes('?') && !v.includes('=')) return v
  try {
    // نحاول تحليله كرابط لاستخراج معامل اسم المستخدم
    const url = new URL(v, 'http://x')
    const p = url.searchParams
    const fromQuery = p.get('username') || p.get('user') || p.get('u') || p.get('code')
    if (fromQuery) return fromQuery.trim()
    // لا يوجد معامل: نأخذ آخر جزء من المسار
    const seg = url.pathname.split('/').filter(Boolean).pop()
    if (seg) return decodeURIComponent(seg).trim()
  } catch {
    // تحليل يدوي احتياطي: username=... داخل النص
    const m = v.match(/(?:username|user|\bu|code)=([^&\s]+)/i)
    if (m) return decodeURIComponent(m[1]).trim()
  }
  return v
}

// بناء رابط تسجيل الدخول لصفحة الهوتسبوت
//   http://GATEWAY/login?username=USERNAME
//   http://GATEWAY/login?username=USERNAME&password=PASSWORD
export function buildLoginUrl({ username, password, gateway }) {
  const gw = normalizeGateway(gateway) || getGateway()
  const u = encodeURIComponent(String(username || '').trim())
  let url = `http://${gw}/login?username=${u}`
  if (password) url += `&password=${encodeURIComponent(password)}`
  return url
}

// تنفيذ تسجيل الدخول: يوجّه المتصفح مباشرة لصفحة الهوتسبوت الأصلية
// (لا يمكن تضمين صفحة HTTP داخل التطبيق الآمن HTTPS بسبب منع المحتوى المختلط)
export function loginToHotspot({ username, password, recordCode = false, gateway }) {
  if (recordCode) addRecentCode(username)
  const url = buildLoginUrl({ username, password, gateway })
  window.location.href = url
  return url
}

// فتح صفحة حالة الهوتسبوت الأصلية (معلومات الكرت: الرصيد والصلاحية)
//   http://GATEWAY/status
export function openHotspotStatus() {
  const gw = getGateway()
  const url = `http://${gw}/status`
  window.location.href = url
  return url
}

// تسجيل الخروج من الهوتسبوت: يوجّه المتصفح لصفحة الخروج الأصلية
//   http://GATEWAY/logout
export function logoutFromHotspot() {
  const gw = getGateway()
  const url = `http://${gw}/logout`
  window.location.href = url
  return url
}

// ─── سجل الكروت المستخدمة على هذا الجهاز (محلي) ───
export function addRecentCode(code) {
  const c = String(code || '').trim()
  if (!c) return
  try {
    const list = getRecentCodes()
    const existing = list.find((x) => x.code === c)
    const rest = list.filter((x) => x.code !== c)
    const now = new Date().toISOString()
    const entry = existing
      ? { ...existing, date: now, uses: (existing.uses || 1) + 1 }
      : { code: c, date: now, firstDate: now, uses: 1, note: '' }
    rest.unshift(entry)
    localStorage.setItem(CODES_KEY, JSON.stringify(rest.slice(0, 30)))
  } catch {}
}

// تحديث ملاحظة/تسمية كرت معيّن (مثلاً: كرت المنزل، كرت العمل)
export function updateCodeNote(code, note) {
  try {
    const list = getRecentCodes().map((x) =>
      x.code === code ? { ...x, note: String(note || '').slice(0, 60) } : x
    )
    localStorage.setItem(CODES_KEY, JSON.stringify(list))
    return list
  } catch {
    return getRecentCodes()
  }
}

// تحديث بيانات صلاحية الكرت والتذكير (تاريخ الانتهاء + معرّف الإشعار المجدول)
export function updateCodeExpiry(code, { expiry, reminderId } = {}) {
  try {
    const list = getRecentCodes().map((x) =>
      x.code === code
        ? {
            ...x,
            expiry: expiry === undefined ? x.expiry : expiry,
            reminderId: reminderId === undefined ? x.reminderId : reminderId,
          }
        : x
    )
    localStorage.setItem(CODES_KEY, JSON.stringify(list))
    return list
  } catch {
    return getRecentCodes()
  }
}

export function getRecentCodes() {
  try {
    return JSON.parse(localStorage.getItem(CODES_KEY) || '[]')
  } catch {
    return []
  }
}

// آخر كرت مستخدم
export function getLastCode() {
  const list = getRecentCodes()
  return list.length ? list[0] : null
}

// حذف كرت واحد فقط
export function deleteRecentCode(code) {
  try {
    const list = getRecentCodes().filter((x) => x.code !== code)
    localStorage.setItem(CODES_KEY, JSON.stringify(list))
    return list
  } catch {
    return getRecentCodes()
  }
}

export function clearRecentCodes() {
  try {
    localStorage.removeItem(CODES_KEY)
  } catch {}
}
