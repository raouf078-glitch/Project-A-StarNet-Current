// إدارة الوضع الليلي / النهاري — مركزية مع حفظ الاختيار
// مفتاح جديد (v2): يتجاهل أي قيمة "ليلي" قديمة محفوظة من نسخة كانت تتبع نظام الهاتف،
// حتى يبدأ كل جهاز نهارياً افتراضياً، ولا يُحفظ إلا اختيار المستخدم اليدوي الجديد.
const KEY = 'starnet_theme_v2'

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {}
  // الافتراضي دائماً: الوضع النهاري عند أول تشغيل (بغض النظر عن إعداد النظام)
  return 'light'
}

// حقن وسوم meta لإخبار WebView بنظام الألوان المدعوم (إشارة أقوى ضد التعتيم التلقائي)
function setColorSchemeMeta(t) {
  try {
    ;['color-scheme', 'supported-color-schemes'].forEach((name) => {
      let m = document.querySelector(`meta[name="${name}"]`)
      if (!m) {
        m = document.createElement('meta')
        m.setAttribute('name', name)
        document.head.appendChild(m)
      }
      m.setAttribute('content', t)
    })
  } catch {}
}

export function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light'
  const root = document.documentElement
  if (t === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  // فرض نظام الألوان مباشرةً على عنصر الجذر (أقوى من CSS) + الوسوم
  try { root.style.colorScheme = t } catch {}
  setColorSchemeMeta(t)
  return t
}

export function setTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light'
  try { localStorage.setItem(KEY, t) } catch {}
  applyTheme(t)
  return t
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  return setTheme(next)
}

// تطبيق فوري عند تحميل التطبيق (قبل الرسم)
applyTheme(getTheme())
