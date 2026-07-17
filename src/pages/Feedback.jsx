import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ArrowRight, Send, CheckCircle2, MessageSquareHeart } from 'lucide-react'
import { db } from '../lib/db'
import { useLiveShared } from '../lib/useLive'
import { LOGO_URL } from '../netConfig'
import PageHeader from '../components/PageHeader'

const RATED_KEY = 'starnet_rated'
const LABELS = ['', 'سيئة', 'مقبولة', 'جيدة', 'جيدة جداً', 'ممتازة']

export default function Feedback() {
  const navigate = useNavigate()
  const { data: ratings } = useLiveShared('ratings', { order: '-createdAt', limit: 500 })

  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    try { if (localStorage.getItem(RATED_KEY)) setDone(true) } catch {}
  }, [])

  const count = ratings.length
  const avg = count ? (ratings.reduce((s, r) => s + (Number(r.stars) || 0), 0) / count) : 0

  const submit = async () => {
    if (!stars || submitting) return
    setSubmitting(true)
    try {
      await db.insertShared('ratings', { stars, comment: comment.trim().slice(0, 300) })
      try { localStorage.setItem(RATED_KEY, '1') } catch {}
      setDone(true)
    } catch {
      alert('تعذّر إرسال التقييم، حاول مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  const display = hover || stars

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg))]">
      {/* Header */}
      <PageHeader icon={Star} title="تقييم الخدمة" subtitle="رأيك يهمنا ويساعدنا على التحسين" back />

      <div className="px-4 py-5 space-y-4">
        {/* Average summary */}
        <div className="warm-card rounded-3xl p-5 text-white flex items-center justify-between relative overflow-hidden">
          <Star size={90} className="absolute -left-3 -bottom-4 opacity-20" fill="currentColor" />
          <div className="relative z-10">
            <p className="text-amber-50 text-sm">متوسط تقييم العملاء</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-4xl font-black">{count ? avg.toFixed(1) : '—'}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} fill={i <= Math.round(avg) ? 'currentColor' : 'none'} className="text-white" />
                ))}
              </div>
            </div>
            <p className="text-amber-50 text-xs mt-1">{count} تقييم</p>
          </div>
        </div>

        {done ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle2 size={42} className="text-green-500" />
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-1">شكراً لتقييمك! 💙</h2>
            <p className="text-sm text-gray-400 leading-relaxed">رأيك يساعدنا على تحسين خدمة شبكة ستار نت باستمرار.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl active:scale-95 transition-transform"
            >
              العودة للرئيسية
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center">
              <MessageSquareHeart size={28} className="text-blue-400 mb-2" />
              <h2 className="font-black text-gray-800 text-base">كيف تقيّم خدمة ستار نت؟</h2>
              <p className="text-xs text-gray-400 mt-1">اضغط على النجوم لتقييم الخدمة</p>

              {/* Stars */}
              <div className="flex gap-1.5 my-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onClick={() => setStars(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    className="active:scale-90 transition-transform p-0.5"
                    aria-label={`${i} نجوم`}
                  >
                    <Star
                      size={40}
                      fill={i <= display ? '#f59e0b' : 'none'}
                      className={i <= display ? 'text-amber-500' : 'text-gray-300'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              <div className="h-6">
                {display > 0 && <span className="font-bold text-amber-500">{LABELS[display]}</span>}
              </div>
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="أخبرنا برأيك أو اقتراحك (اختياري)..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-300 resize-none mt-2"
            />

            <button
              onClick={submit}
              disabled={!stars || submitting}
              className="w-full mt-3 py-3.5 rounded-2xl font-bold text-white text-base bg-gradient-to-l from-blue-600 to-cyan-500 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              <Send size={18} /> {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </button>
          </div>
        )}

        {/* Recent comments */}
        {ratings.filter(r => r.comment).length > 0 && (
          <div>
            <p className="text-xs text-gray-400 px-1 mb-2">آراء العملاء</p>
            <div className="space-y-2">
              {ratings.filter(r => r.comment).slice(0, 8).map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={13} fill={i <= (r.stars || 0) ? '#f59e0b' : 'none'} className={i <= (r.stars || 0) ? 'text-amber-500' : 'text-gray-200'} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1.5 leading-snug">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
