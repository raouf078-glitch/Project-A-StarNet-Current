import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload, CircleCheck as CheckCircle2, Clock, Circle as XCircle, Building2, CreditCard, Wallet, ArrowRight, FileText, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import {
  getDeposits, createDeposit, cancelDeposit, DEPOSIT_STATUS,
  fmtMoney, fmtDate, fmtTime,
} from '../lib/walletApi'

const PAYMENT_ACCOUNTS = [
  { id: 'starnet', name: 'حساب ستار نت', number: 'STN-001-2026', icon: Building2, color: 'text-blue-600 bg-blue-50' },
  { id: 'bank', name: 'الحساب البنكي', number: 'BANK-4451-XX', icon: CreditCard, color: 'text-cyan-600 bg-cyan-50' },
  { id: 'wallet', name: 'محفظة إلكترونية', number: 'WALLET-9920', icon: Wallet, color: 'text-green-600 bg-green-50' },
]

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000]

export default function DepositWallet() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [account, setAccount] = useState(null)
  const [amount, setAmount] = useState('')
  const [proofName, setProofName] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDeposits = useCallback(async () => {
    setLoading(true)
    const data = await getDeposits()
    setDeposits(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadDeposits() }, [loadDeposits])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) setProofName(file.name)
  }

  const submit = async () => {
    setSubmitting(true)
    const acc = PAYMENT_ACCOUNTS.find(a => a.id === account)
    const result = await createDeposit({
      accountName: acc.name,
      accountNumber: acc.number,
      amount: Number(amount),
      proofUrl: proofName,
      notes,
    })
    setSubmitting(false)
    if (result) {
      setStep(1)
      setAccount(null)
      setAmount('')
      setProofName('')
      setNotes('')
      loadDeposits()
    }
  }

  const handleCancel = async (id) => {
    await cancelDeposit(id)
    loadDeposits()
  }

  const pending = deposits.filter(d => d.status === 'pending')
  const history = deposits.filter(d => d.status !== 'pending')

  return (
    <div className="min-h-full">
      <PageHeader icon={Plus} title="إيداع الرصيد" subtitle="اشحن محفظتك بسهولة" back onBack={() => navigate('/wallet')} />

      <div className="px-4 py-4 space-y-4 pb-28">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= s ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
              }`}>{s}</div>
              {s < 3 && <div className={`w-8 h-0.5 rounded-full ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Choose account + amount */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="sn-card rounded-2xl p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-3">اختر حساب الدفع</h3>
              <div className="space-y-2">
                {PAYMENT_ACCOUNTS.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setAccount(acc.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                      account === acc.id ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.color}`}>
                      <acc.icon size={18} />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-bold text-gray-700">{acc.name}</p>
                      <p className="text-[11px] text-gray-400 font-mono" dir="ltr">{acc.number}</p>
                    </div>
                    {account === acc.id && <CheckCircle2 size={18} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="sn-card rounded-2xl p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-3">المبلغ</h3>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-center text-lg font-black focus:outline-none focus:border-blue-400"
                dir="ltr"
              />
              <div className="grid grid-cols-4 gap-2 mt-3">
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className="bg-blue-50 text-blue-600 text-xs font-bold py-2 rounded-xl active:scale-95 transition-transform"
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!account || !amount || Number(amount) <= 0}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              متابعة <ArrowRight size={18} className="rotate-180" />
            </button>
          </div>
        )}

        {/* Step 2: Upload proof */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="sn-card rounded-2xl p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-3">رفع إثبات الدفع</h3>
              <label className="block">
                <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-blue-50 transition-colors">
                  {proofName ? (
                    <>
                      <FileText size={32} className="text-blue-600" />
                      <p className="text-sm font-bold text-gray-700">{proofName}</p>
                      <p className="text-[11px] text-green-600">تم الرفع</p>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-blue-400" />
                      <p className="text-sm font-bold text-gray-500">اضغط لرفع الصورة</p>
                      <p className="text-[11px] text-gray-400">PNG, JPG, PDF</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ملاحظات إضافية (اختياري)"
                className="w-full mt-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-all"
              >
                رجوع
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                مراجعة <ArrowRight size={18} className="rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & submit */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="sn-card rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-gray-700 text-sm">مراجعة الطلب</h3>
              {(() => {
                const acc = PAYMENT_ACCOUNTS.find(a => a.id === account)
                return (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">الحساب</span>
                      <span className="font-bold text-gray-700">{acc?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">رقم الحساب</span>
                      <span className="font-bold text-gray-700 font-mono" dir="ltr">{acc?.number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">المبلغ</span>
                      <span className="font-black text-blue-600" dir="ltr">{fmtMoney(amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">إثبات الدفع</span>
                      <span className="font-bold text-gray-700">{proofName || 'غير مرفق'}</span>
                    </div>
                    {notes && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">ملاحظات</span>
                        <span className="font-bold text-gray-700">{notes}</span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-all"
              >
                رجوع
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري...</> : 'تأكيد الإيداع'}
              </button>
            </div>
          </div>
        )}

        {/* Pending deposits */}
        <div className="space-y-2">
          <h3 className="font-bold text-gray-700 text-sm px-1">قيد المراجعة ({pending.length})</h3>
          {loading ? (
            <div className="py-6 text-center text-gray-400 text-sm">جاري التحميل...</div>
          ) : pending.length === 0 ? (
            <div className="sn-card rounded-2xl p-4 text-center">
              <Clock size={28} className="text-gray-300 mx-auto mb-1.5" />
              <p className="text-xs text-gray-400">لا توجد طلبات قيد المراجعة</p>
            </div>
          ) : (
            pending.map(d => {
              const s = DEPOSIT_STATUS[d.status] || DEPOSIT_STATUS.pending
              return (
                <div key={d.id} className="sn-card rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Clock size={18} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700">{fmtMoney(d.amount)}</p>
                    <p className="text-[11px] text-gray-400">{d.account_name} · {fmtDate(d.created_at)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
                  <button onClick={() => handleCancel(d.id)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center active:scale-90 transition-transform">
                    <X size={14} className="text-red-500" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-gray-700 text-sm px-1">سجل الإيداعات</h3>
            {history.map(d => {
              const s = DEPOSIT_STATUS[d.status] || DEPOSIT_STATUS.pending
              const Icon = d.status === 'approved' ? CheckCircle2 : d.status === 'rejected' ? XCircle : Clock
              const iconColor = d.status === 'approved' ? 'text-green-600 bg-green-50' : d.status === 'rejected' ? 'text-red-500 bg-red-50' : 'text-gray-500 bg-gray-50'
              return (
                <div key={d.id} className="sn-card rounded-2xl p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700">{fmtMoney(d.amount)}</p>
                    <p className="text-[11px] text-gray-400">{d.account_name} · {fmtDate(d.created_at)} {fmtTime(d.created_at)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
