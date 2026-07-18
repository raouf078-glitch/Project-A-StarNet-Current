/**
 * CardReader — Camera OCR component for reading printed voucher/card numbers.
 * Uses Tesseract.js for OCR processing. Captures frames from the camera,
 * processes them, and extracts numeric codes.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TESSERACT_CDN
    script.onload = () => resolve(window.Tesseract)
    script.onerror = () => reject(new Error('فشل تحميل محرك القراءة'))
    document.head.appendChild(script)
  })
}

function extractCode(text) {
  const cleaned = text.replace(/[^0-9a-zA-Z\s\-]/g, '')
  const patterns = [
    /\b(\d{6,16})\b/,
    /\b([A-Za-z0-9]{6,20})\b/,
  ]
  for (const pat of patterns) {
    const match = cleaned.match(pat)
    if (match) return match[1]
  }
  return null
}

export default function CardReader({ onRead, className = '', style = {} }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const workerRef = useRef(null)
  const [status, setStatus] = useState('loading')
  const [statusText, setStatusText] = useState('جاري تحميل محرك القراءة...')
  const [error, setError] = useState(null)
  const [flash, setFlash] = useState(false)
  const stoppedRef = useRef(false)
  const [retryCount, setRetryCount] = useState(0)

  const callbackRef = useRef(onRead)
  useEffect(() => { callbackRef.current = onRead }, [onRead])

  const processFrame = useCallback(async () => {
    if (stoppedRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const cropH = Math.floor(canvas.height * 0.3)
    const cropY = Math.floor((canvas.height - cropH) / 2)
    ctx.drawImage(video, 0, cropY, canvas.width, cropH, 0, 0, canvas.width, cropH)

    try {
      const worker = workerRef.current
      if (!worker) return
      const { data } = await worker.recognize(canvas)
      const code = extractCode(data.text)
      if (code && callbackRef.current) {
        setFlash(true)
        setTimeout(() => setFlash(false), 300)
        callbackRef.current({ value: code, raw: data.text })
      }
    } catch {}
  }, [])

  useEffect(() => {
    let animId = null
    let interval = null
    stoppedRef.current = false

    async function init() {
      try {
        setStatus('loading')
        setStatusText('جاري تحميل محرك القراءة...')

        const Tesseract = await loadTesseract()

        setStatusText('جاري تهيئة محرك OCR...')
        const worker = await Tesseract.createWorker('eng', 1, {
          logger: () => {},
        })
        workerRef.current = worker

        setStatusText('جاري تشغيل الكاميرا...')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        streamRef.current = stream

        if (stoppedRef.current) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        setStatus('ready')
        setStatusText('وجّه الكاميرا نحو رقم البطاقة')

        interval = setInterval(() => {
          if (!stoppedRef.current) processFrame()
        }, 1500)
      } catch (err) {
        if (!stoppedRef.current) {
          setStatus('error')
          setError(err.message || 'فشل تشغيل الكاميرا')
        }
      }
    }

    init()

    return () => {
      stoppedRef.current = true
      if (interval) clearInterval(interval)
      if (animId) cancelAnimationFrame(animId)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => {})
        workerRef.current = null
      }
    }
  }, [processFrame, retryCount])

  const containerStyle = {
    position: 'relative', width: '100%', height: '300px',
    borderRadius: '12px', overflow: 'hidden', backgroundColor: '#111',
    ...style,
  }

  return (
    <div className={className} style={containerStyle}>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Scan region overlay */}
      {status === 'ready' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '80%', height: '28%',
            border: flash ? '3px solid rgba(34,197,94,0.95)' : '2px solid rgba(255,255,255,0.7)',
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
            transition: 'border-color 150ms ease',
          }} />
        </div>
      )}

      {/* Loading state */}
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', gap: '12px', zIndex: 10,
        }}>
          <div style={{
            width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff', borderRadius: '50%',
            animation: 'card-reader-spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: '14px', opacity: 0.9 }}>{statusText}</span>
          <style>{`@keyframes card-reader-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', padding: '20px',
          textAlign: 'center', zIndex: 10,
        }}>
          <span style={{ fontSize: '24px', marginBottom: '8px' }}>&#128247;</span>
          <span style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>{error}</span>
          <button
            onClick={() => setRetryCount(c => c + 1)}
            style={{
              padding: '8px 20px', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff',
              fontSize: '14px', cursor: 'pointer',
            }}
          >إعادة المحاولة</button>
        </div>
      )}
    </div>
  )
}
