import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, User, Copy, Check, Phone, Camera, Star } from 'lucide-react'
import {
  LOGO_DAY, LOGO_NIGHT, DEPOSIT_NAME, DEPOSIT_ACCOUNTS, SUPPORT_PHONE, SUPPORT_WA, SOCIAL,
} from '../netConfig'
import PageHeader from '../components/PageHeader'

function WhatsAppIcon({ size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function AccountCard({ acc }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(acc.number)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="bg-gradient-to-l from-blue-600 to-blue-500 px-4 py-2">
        <p className="text-white text-sm font-bold text-center">{acc.label}</p>
      </div>
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-blue-600 active:scale-95 transition-transform shrink-0"
        >
          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          <span className="text-xs font-semibold">{copied ? 'تم النسخ' : 'نسخ'}</span>
        </button>
        <div className="text-left flex-1">
          <p className="text-[11px] text-gray-400 mb-0.5">{acc.bank}</p>
          <p className="text-xl font-black text-gray-800 tracking-wide" dir="ltr">{acc.number}</p>
        </div>
      </div>
    </div>
  )
}

export default function Deposit() {
  const navigate = useNavigate()
  const location = useLocation()
  const pkg = location.state?.pkg
  const [logoErr, setLogoErr] = useState(false)

  const waMsg = pkg
    ? `مرحباً، أرغب في طلب ${pkg.name} (${pkg.price} ريال) وسأرسل لكم سند الإيداع.`
    : 'مرحباً، أرغب في طلب باقة وسأرسل لكم سند الإيداع.'
  const waLink = `${SOCIAL.whatsapp}?text=${encodeURIComponent(waMsg)}`

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <PageHeader icon={Building2} title="طلب الباقة" subtitle="إيداع المبلغ وتفعيل الاشتراك" back />

      <div className="px-4 py-5 space-y-4">
        {/* Logo */}
        <div className="flex justify-center">
          {!logoErr ? (
            <img src={document.documentElement.classList.contains('dark') ? LOGO_NIGHT : LOGO_DAY} alt="ستار نت" onError={() => setLogoErr(true)} className="h-20 object-contain" />
          ) : (
            <div className="flex items-center gap-2 text-blue-700">
              <Star size={28} fill="currentColor" />
              <span className="text-2xl font-black">ستار نت</span>
            </div>
          )}
        </div>

        {/* Selected package */}
        {pkg && (
          <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl px-4 py-3 flex items-center justify-between shadow">
            <span className="text-white font-bold">{pkg.name}</span>
            <span className="text-white font-black text-lg">{pkg.price} <span className="text-sm">ريال</span></span>
          </div>
        )}

        {/* Intro message */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-gray-800 font-bold leading-snug">يمكنكم إيداع المبلغ</p>
            <p className="text-blue-600 font-semibold text-sm">عبر أحد حساباتنا التالية</p>
          </div>
        </div>

        {/* Account holder name */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <User size={24} className="text-blue-600" />
          </div>
          <div className="text-right flex-1">
            <p className="text-[11px] text-gray-400">الاسم</p>
            <p className="text-gray-800 font-bold">{DEPOSIT_NAME}</p>
          </div>
        </div>

        {/* Bank accounts */}
        <div className="space-y-3">
          {DEPOSIT_ACCOUNTS.map((acc, i) => (
            <AccountCard key={i} acc={acc} />
          ))}
        </div>

        {/* Deposit slip notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Camera size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-amber-800 font-bold leading-snug">يرجى تصوير سند الإيداع</p>
            <p className="text-amber-700 text-sm">وإرساله لنا لتفعيل الباقة</p>
          </div>
        </div>

        {/* Star net slogan */}
        <div className="flex items-center justify-center gap-2 py-1">
          <Star size={20} className="text-blue-500" fill="currentColor" />
          <p className="text-blue-700 font-black">شبكة ستار نت — خيارك الأفضل</p>
        </div>

        {/* Contact buttons */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow"
        >
          <WhatsAppIcon size={22} />
          <span>إرسال سند الإيداع عبر واتساب</span>
          <span className="font-black" dir="ltr">{SUPPORT_WA.slice(-9)}</span>
        </a>

        <a
          href={`tel:${SUPPORT_PHONE}`}
          className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow"
        >
          <Phone size={20} />
          <span>تواصل معنا عبر اتصال</span>
          <span className="font-black" dir="ltr">{SUPPORT_PHONE}</span>
        </a>

        <p className="text-center text-xs text-gray-400 pt-1">
          بعد الإيداع، أرسل لنا سند الإيداع عبر واتساب أو الاتصال لتفعيل باقتك فوراً.
        </p>
      </div>
    </div>
  )
}
