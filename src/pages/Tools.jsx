import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wifi, WifiOff, Download, Upload, Activity, RotateCcw, CheckCircle, Globe, Router, Network, RefreshCw, ExternalLink, Info, Wrench, Calculator } from 'lucide-react'
import { getGateway, NETWORK_NAME, LOGO_URL } from '../netConfig'
import PageHeader from '../components/PageHeader'

function NetworkInfo() {
  const [online, setOnline] = useState(navigator.onLine)
  const [ip, setIp] = useState(null)
  const [loadingIp, setLoadingIp] = useState(false)
  const gateway = getGateway()

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const fetchIp = async () => {
    setLoadingIp(true)
    setIp(null)
    try {
      const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
      const data = await res.json()
      setIp(data.ip || 'غير معروف')
    } catch {
      setIp('تعذّر الجلب')
    } finally {
      setLoadingIp(false)
    }
  }

  const rows = [
    { icon: Wifi, label: 'اسم الشبكة', value: NETWORK_NAME, color: 'text-blue-500 bg-blue-50' },
    { icon: Router, label: 'بوابة الشبكة', value: gateway, ltr: true, color: 'text-cyan-600 bg-cyan-50' },
    {
      icon: online ? Network : WifiOff,
      label: 'حالة الاتصال',
      value: online ? 'متصل' : 'غير متصل',
      color: online ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50',
      valueColor: online ? 'text-green-600' : 'text-red-500',
    },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <span className="font-bold text-gray-700 flex items-center gap-2"><Network size={16} className="text-blue-500" /> معلومات الشبكة</span>
      </div>
      <div className="p-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${r.color}`}><r.icon size={17} /></div>
            <span className="text-sm text-gray-500 flex-1">{r.label}</span>
            <span className={`text-sm font-bold ${r.valueColor || 'text-gray-700'}`} dir={r.ltr ? 'ltr' : undefined}>{r.value}</span>
          </div>
        ))}
        {/* IP row */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-indigo-600 bg-indigo-50"><Globe size={17} /></div>
          <span className="text-sm text-gray-500 flex-1">عنوان IP العام (الإنترنت)</span>
          {ip ? (
            <span className="text-sm font-bold text-gray-700" dir="ltr">{ip}</span>
          ) : (
            <button onClick={fetchIp} disabled={loadingIp} className="flex items-center gap-1 text-xs font-bold text-blue-600 active:opacity-70">
              {loadingIp ? <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <RefreshCw size={13} />}
              {loadingIp ? 'جاري...' : 'عرض'}
            </button>
          )}
        </div>
        {ip && (
          <button onClick={fetchIp} className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 py-1 active:text-blue-500">
            <RefreshCw size={12} /> تحديث عنوان IP
          </button>
        )}
        <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-2.5 mt-1">
          <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 leading-relaxed">هذا هو عنوان IP العام للإنترنت. عنوان IP المحلي داخل الشبكة (مثل 192.168.x.x) لا يمكن للتطبيقات قراءته لأسباب خصوصية في المتصفح.</p>
        </div>
      </div>
    </div>
  )
}

const STAGES = ['ping', 'download', 'upload']

function SpeedGauge({ value, max, unit, color }) {
  const pct = Math.min(value / max, 1)
  const angle = -135 + pct * 270
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 80" className="w-40">
        {/* Track arc */}
        <path d="M10,75 A55,55 0 1,1 110,75" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
        {/* Active arc */}
        <path
          d="M10,75 A55,55 0 1,1 110,75"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${pct * 172.7} 172.7`}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        {/* Needle */}
        <g transform={`translate(60,75) rotate(${angle})`}>
          <line x1="0" y1="0" x2="0" y2="-38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="4" fill={color} />
        </g>
      </svg>
      <div className="text-center -mt-6">
        <span className="text-3xl font-black text-gray-800">{value.toFixed(value < 10 ? 1 : 0)}</span>
        <span className="text-sm text-gray-400 ml-1">{unit}</span>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, unit, color, active, done }) {
  return (
    <div className={`flex-1 rounded-2xl p-3 border-2 transition-all ${active ? 'border-blue-400 bg-blue-50 shadow-md' : done ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} className={active ? 'text-blue-500' : done ? 'text-green-500' : 'text-gray-400'} />
        <span className="text-xs font-semibold text-gray-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-lg font-black ${active ? 'text-blue-700' : done ? 'text-green-700' : 'text-gray-400'}`}>
          {value !== null ? (typeof value === 'number' ? (value < 10 ? value.toFixed(1) : value.toFixed(0)) : value) : '—'}
        </span>
        {value !== null && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  )
}

async function measurePing() {
  const times = []
  for (let i = 0; i < 4; i++) {
    const t0 = performance.now()
    try {
      await fetch(`https://speed.cloudflare.com/cdn-cgi/trace?_=${Date.now()}`, { cache: 'no-store', mode: 'cors' })
    } catch (_) {}
    times.push(performance.now() - t0)
  }
  times.sort((a, b) => a - b)
  return Math.round(times[1] || times[0] || 20)
}

async function measureDownload(onProgress) {
  // Parallel streams give a far more accurate result on fast links
  const streams = 5
  const bytesPer = 20 * 1024 * 1024 // 20 MB per stream
  const t0 = performance.now()
  let loaded = 0
  const tick = () => {
    const elapsed = (performance.now() - t0) / 1000
    if (elapsed > 0.05) onProgress((loaded * 8) / (elapsed * 1e6))
  }
  await Promise.all(
    Array.from({ length: streams }, async () => {
      try {
        const res = await fetch(
          `https://speed.cloudflare.com/__down?bytes=${bytesPer}&_=${Date.now()}-${Math.random()}`,
          { cache: 'no-store', mode: 'cors' }
        )
        const reader = res.body.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          loaded += value.byteLength
          tick()
        }
      } catch (_) {}
    })
  )
  const elapsed = (performance.now() - t0) / 1000
  return elapsed > 0 ? (loaded * 8) / (elapsed * 1e6) : 0
}

// Upload measurement: browsers buffer the whole payload into the socket almost
// instantly, so upload.onprogress is unreliable (jumps to 100% in ms). Instead we
// time the FULL round-trip (request sent -> server response received) of a fixed
// payload and compute bytes/time. Running it repeatedly for a fixed window across
// parallel streams gives a stable, browser-agnostic result.
function uploadOnce(bytes, signal) {
  // NOTE: crypto.getRandomValues throws (QuotaExceededError) for buffers larger
  // than 65536 bytes, which silently aborted the whole upload test. We fill a
  // small random seed block once and reuse the buffer — the bytes-on-the-wire
  // count is what matters for the measurement, not their randomness.
  const data = new Uint8Array(bytes)
  const seed = new Uint8Array(65536)
  crypto.getRandomValues(seed)
  for (let off = 0; off < bytes; off += seed.length) {
    data.set(seed.subarray(0, Math.min(seed.length, bytes - off)), off)
  }
  const start = performance.now()
  return fetch(`https://speed.cloudflare.com/__up?_=${Date.now()}-${Math.random()}`, {
    method: 'POST',
    body: data,
    cache: 'no-store',
    signal,
  })
    .then(() => ({ bytes, ms: performance.now() - start }))
    .catch(() => ({ bytes: 0, ms: performance.now() - start }))
}

async function measureUpload(onProgress) {
  const streams = 3
  const chunkBytes = 2 * 1024 * 1024 // 2MB per request
  const testMs = 8000               // run for ~8s
  const t0 = performance.now()
  let totalBytes = 0

  const runStream = async () => {
    while (performance.now() - t0 < testMs) {
      const res = await uploadOnce(chunkBytes)
      totalBytes += res.bytes
      const elapsed = (performance.now() - t0) / 1000
      if (elapsed > 0.2) onProgress((totalBytes * 8) / (elapsed * 1e6))
    }
  }

  await Promise.all(Array.from({ length: streams }, () => runStream()))
  const elapsed = (performance.now() - t0) / 1000
  return elapsed > 0 ? (totalBytes * 8) / (elapsed * 1e6) : 0
}

function getRating(dl) {
  if (dl >= 50) return { label: 'ممتازة', color: '#22c55e' }
  if (dl >= 20) return { label: 'جيدة جداً', color: '#3b82f6' }
  if (dl >= 5) return { label: 'مقبولة', color: '#f59e0b' }
  return { label: 'ضعيفة', color: '#ef4444' }
}

export default function Tools() {
  const navigate = useNavigate()
  const [stage, setStage] = useState(null) // null | 'ping' | 'download' | 'upload' | 'done'
  const [ping, setPing] = useState(null)
  const [download, setDownload] = useState(null)
  const [upload, setUpload] = useState(null)
  const [liveVal, setLiveVal] = useState(0)
  const abortRef = useRef(false)

  const reset = () => {
    abortRef.current = true
    setTimeout(() => { abortRef.current = false }, 100)
    setStage(null)
    setPing(null)
    setDownload(null)
    setUpload(null)
    setLiveVal(0)
  }

  const runTest = async () => {
    reset()
    await new Promise(r => setTimeout(r, 120))
    abortRef.current = false

    // Ping
    setStage('ping')
    setLiveVal(0)
    const p = await measurePing()
    setPing(p)
    setLiveVal(p)

    // Download
    setStage('download')
    setLiveVal(0)
    const dl = await measureDownload(v => setLiveVal(parseFloat(v.toFixed(1))))
    setDownload(parseFloat(dl.toFixed(1)))
    setLiveVal(parseFloat(dl.toFixed(1)))

    // Upload
    setStage('upload')
    setLiveVal(0)
    const ul = await measureUpload(v => setLiveVal(parseFloat(v.toFixed(1))))
    setUpload(parseFloat(ul.toFixed(1)))
    setLiveVal(parseFloat(ul.toFixed(1)))

    setStage('done')
  }

  const isDone = stage === 'done'
  const rating = isDone && download !== null ? getRating(download) : null

  const gaugeColor =
    stage === 'ping' ? '#8b5cf6' :
    stage === 'download' ? '#3b82f6' :
    stage === 'upload' ? '#10b981' :
    '#3b82f6'

  const gaugeMax =
    stage === 'ping' ? 200 :
    stage === 'upload' ? 100 :
    200

  const gaugeUnit =
    stage === 'ping' ? 'ms' : 'Mbps'

  return (
    <div className="h-full overflow-y-auto bg-[rgb(var(--color-bg))]">
      {/* Header */}
      <PageHeader
        icon={Wrench}
        title="أدوات الشبكة"
        subtitle="فحص السرعة ومعلومات الشبكة"
        back
        action={stage !== null ? (
          <button onClick={reset} className="flex items-center gap-1 text-xs font-bold text-white/90 bg-white/15 px-3 py-1.5 rounded-lg active:scale-90 transition-transform shrink-0">
            <RotateCcw size={14} /> إعادة
          </button>
        ) : null}
      />

      <div className="px-4 py-5 space-y-4 pb-28">

        {/* الأدوات — قياس السرعة وحاسبة الباقة جنباً إلى جنب */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => document.getElementById('speed-test-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5 text-center active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Activity size={22} className="text-blue-600" />
            </div>
            <p className="text-xs font-bold text-gray-700 leading-tight">قياس السرعة</p>
            <p className="text-[10px] text-gray-400 leading-tight">اختبر سرعة الإنترنت</p>
          </button>
          <button
            onClick={() => navigate('/calculator')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5 text-center active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
              <Calculator size={22} className="text-teal-600" />
            </div>
            <p className="text-xs font-bold text-gray-700 leading-tight">حاسبة الباقة</p>
            <p className="text-[10px] text-gray-400 leading-tight">اختر الأنسب لك</p>
          </button>
        </div>

        {/* Network info */}
        <NetworkInfo />

        {/* Main card */}
        <div id="speed-test-card" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col items-center">

          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <Activity size={18} className="text-blue-600" />
            </div>
            <span className="font-bold text-gray-700 text-base">فحص سرعة الإنترنت</span>
          </div>

          {/* Gauge */}
          {stage && stage !== 'done' ? (
            <>
              <SpeedGauge
                value={liveVal}
                max={gaugeMax}
                unit={gaugeUnit}
                color={gaugeColor}
              />
              <p className="text-sm font-semibold text-gray-400 mt-1 animate-pulse">
                {stage === 'ping' ? 'قياس التأخير...' : stage === 'download' ? 'قياس التنزيل...' : 'قياس الرفع...'}
              </p>
            </>
          ) : isDone ? (
            <div className="flex flex-col items-center py-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: rating.color + '20' }}>
                <CheckCircle size={36} style={{ color: rating.color }} />
              </div>
              <p className="text-xl font-black" style={{ color: rating.color }}>{rating.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">سرعة التنزيل {download} Mbps</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center mb-3">
                <Wifi size={36} className="text-blue-400" />
              </div>
              <p className="text-sm text-gray-400">اضغط ابدأ الفحص</p>
            </div>
          )}

          {/* Stats row */}
          <div className="flex gap-2 w-full mt-4">
            <StatCard icon={Activity} label="التأخير" value={ping} unit="ms" color="#8b5cf6"
              active={stage === 'ping'} done={ping !== null} />
            <StatCard icon={Download} label="التنزيل" value={download} unit="Mbps" color="#3b82f6"
              active={stage === 'download'} done={download !== null} />
            <StatCard icon={Upload} label="الرفع" value={upload} unit="Mbps" color="#10b981"
              active={stage === 'upload'} done={upload !== null} />
          </div>

          {/* Button */}
          <button
            onClick={isDone ? reset : runTest}
            disabled={stage !== null && !isDone}
            className="mt-4 w-full py-3.5 rounded-2xl font-bold text-white text-base active:scale-95 transition-all disabled:opacity-60"
            style={{
              background: isDone
                ? 'linear-gradient(135deg, #6366f1, #3b82f6)'
                : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            }}
          >
            {stage !== null && !isDone ? '⏳ جاري الفحص...' : isDone ? '🔄 فحص مجدداً' : '🚀 ابدأ الفحص'}
          </button>

          {/* Official Ookla Speedtest */}
          <button
            onClick={() => window.open('https://www.speedtest.net', '_blank', 'noopener')}
            className="mt-2.5 w-full py-3 rounded-2xl font-bold text-blue-600 text-sm bg-blue-50 border border-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} /> افتح Speedtest الرسمي (Ookla)
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2 leading-relaxed">
            للحصول على نتيجة مرجعية دقيقة 100% يُفتح موقع Speedtest by Ookla في متصفح جهازك.
          </p>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 text-sm mb-3">دليل السرعات</h3>
          <div className="space-y-2">
            {[
              { label: 'ممتازة', range: '50+ Mbps', color: '#22c55e' },
              { label: 'جيدة جداً', range: '20–50 Mbps', color: '#3b82f6' },
              { label: 'مقبولة', range: '5–20 Mbps', color: '#f59e0b' },
              { label: 'ضعيفة', range: 'أقل من 5 Mbps', color: '#ef4444' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-sm text-gray-600">{r.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-400">{r.range}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
