import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Headphones, MessageCircle, Phone, Mail, Send, CircleCheck as CheckCircle2, ChevronLeft } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { supabase } from '../lib/supabaseClient'

const SUPPORT_CHANNELS = [
  { icon: MessageCircle, label: 'واتساب', value: 'تحويل مباشر', color: 'text-green-600 bg-green-50', href: 'https://wa.me/964' },
  { icon: Phone, label: 'اتصال مباشر', value: '964+', color: 'text-blue-600 bg-blue-50', href: 'tel:+964' },
  { icon: Mail, label: 'بريد إلكتروني', value: 'support@starnet', color: 'text-cyan-600 bg-cyan-50', href: 'mailto:support@starnet' },
]

export default function Support() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [orderId, setOrderId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!subject || !message) return
    setSubmitting(true)
    await supabase.from('notifications').insert({
      title: `طلب دعم: ${subject}`,
      body: message + (orderId ? ` (طلب: ${orderId})` : ''),
      type: 'order',
      read: false,
    })
    setSubmitting(false)
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setSubject('')
      setMessage('')
      setOrderId('')
    }, 2000)
  }

  return (
    <div className="min-h-full">
      <PageHeader icon={Headphones} title="الدعم والمساعدة" subtitle="نحن هنا لمساعدتك" back onBack={() => navigate('/wallet')} />

      <div className="px-4 py-4 space-y-4 pb-28">
        {/* Channels */}
        <div className="grid grid-cols-3 gap-2.5">
          {SUPPORT_CHANNELS.map(c => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="sn-card rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-700">{c.label}</span>
              <span className="text-[9px] text-gray-400">{c.value}</span>
            </a>
          ))}
        </div>

        {/* Ticket form */}
        <div className="sn-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-gray-700 text-sm">إنشاء تذكرة دعم</h3>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="موضوع المشكلة"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
          />
          <input
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="رقم الطلب (اختياري)"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 font-mono"
            dir="ltr"
          />
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="اشرح مشكلتك بالتفصيل..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
            rows={4}
          />
          <button
            onClick={submit}
            disabled={!subject || !message || submitting}
            className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
              done ? 'bg-green-500' : 'bg-blue-600'
            }`}
          >
            {done ? <><CheckCircle2 size={18} /> تم الإرسال</> : submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري...</> : <><Send size={18} /> إرسال</>}
          </button>
        </div>
      </div>
    </div>
  )
}
