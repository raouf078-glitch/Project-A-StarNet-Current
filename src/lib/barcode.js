/**
 * Local barcode scanner + still-image decode (matching StarNET Hotspot approach).
 * 
 * Live scan: native BarcodeDetector API (Chrome/Edge/Opera 88+).
 * Still image barcode: native BarcodeDetector on an ImageBitmap.
 * Still image OCR: Tesseract.js for reading printed voucher numbers.
 */

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
const MAX_EDGE = 1280
const MIN_DIGITS = 6
const MAX_DIGITS = 16

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

function extractVoucherCode(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''
  if (/^https?:\/\//i.test(text) || text.includes('username=')) {
    const q = text.indexOf('?')
    const query = q >= 0 ? text.slice(q + 1) : text
    for (const part of query.split('&')) {
      const [k, v] = part.split('=')
      if (k === 'username' && v) return decodeURIComponent(v.replace(/\+/g, ' ')).trim()
    }
  }
  return text
}

function extractDigitCode(text) {
  const cleaned = text.replace(/[^\d\sa-zA-Z\-]/g, '')
  const match = cleaned.match(new RegExp(`\\b(\\d{${MIN_DIGITS},${MAX_DIGITS}})\\b`))
  if (match) return match[1]
  const alphaMatch = cleaned.match(/\b([A-Za-z0-9]{6,20})\b/)
  if (alphaMatch) return alphaMatch[1]
  return null
}

async function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (Math.max(w, h) > MAX_EDGE) {
        const scale = MAX_EDGE / Math.max(w, h)
        w = Math.round(w * scale)
        h = Math.round(h * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(img.src)
      resolve(canvas)
    }
    img.onerror = () => reject(new Error('فشل تحميل الصورة'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Decode barcode/QR from a captured image file.
 * Uses native BarcodeDetector on the ImageBitmap.
 */
export async function processImageBarcode(file) {
  const canvas = await fileToCanvas(file)
  if (!('BarcodeDetector' in window)) {
    throw new Error('متصفحك لا يدعم قراءة الباركود مباشرة')
  }
  let detector
  try {
    detector = new window.BarcodeDetector({ formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'codabar'] })
  } catch {
    detector = new window.BarcodeDetector()
  }
  const results = await detector.detect(canvas)
  if (results.length > 0 && results[0].rawValue) {
    return extractVoucherCode(results[0].rawValue)
  }
  return null
}

/**
 * OCR a captured image for printed voucher/card numbers.
 * Uses Tesseract.js (loaded from CDN).
 */
export async function processImageOcr(file) {
  const Tesseract = await loadTesseract()
  const canvas = await fileToCanvas(file)

  // Crop central band (ROI: y 22%-72% of height) matching Hotspot's ROI
  const roiCanvas = document.createElement('canvas')
  const roiY = Math.floor(canvas.height * 0.22)
  const roiH = Math.floor(canvas.height * 0.5)
  roiCanvas.width = canvas.width
  roiCanvas.height = roiH
  const ctx = roiCanvas.getContext('2d')
  ctx.drawImage(canvas, 0, roiY, canvas.width, roiH, 0, 0, canvas.width, roiH)

  const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} })
  const { data } = await worker.recognize(roiCanvas)
  await worker.terminate()

  return extractDigitCode(data.text)
}

// ── Live camera barcode scanner (for BarcodeScanner component) ──

async function openCameraStream(facingMode = 'environment') {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  })
}

export const barcode = {
  async scan({ camera = 'back', formats, onProgress } = {}) {
    const facingMode = camera === 'front' ? 'user' : 'environment'

    if (onProgress) onProgress('جاري تشغيل الكاميرا...')

    const stream = await openCameraStream(facingMode)
    const video = document.createElement('video')
    video.srcObject = stream
    video.setAttribute('playsinline', 'true')
    video.setAttribute('autoplay', 'true')
    video.muted = true
    await video.play()

    if (onProgress) onProgress('الكاميرا جاهزة — وجّه نحو الباركود')

    let stopped = false
    let resultCallback = null
    let animId = null

    const supportedFormats = formats || ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'codabar']
    const hasNative = 'BarcodeDetector' in window
    let detector = null

    if (hasNative) {
      try { detector = new window.BarcodeDetector({ formats: supportedFormats }) }
      catch { detector = new window.BarcodeDetector() }
    }

    const seen = new Set()

    async function detectFrame() {
      if (stopped) return
      try {
        if (detector && video.readyState >= 2) {
          const results = await detector.detect(video)
          for (const result of results) {
            if (result.rawValue && !seen.has(result.rawValue)) {
              seen.add(result.rawValue)
              if (resultCallback) resultCallback({ value: extractVoucherCode(result.rawValue), format: result.format })
            }
          }
        }
      } catch {}
      if (!stopped) animId = requestAnimationFrame(detectFrame)
    }

    animId = requestAnimationFrame(detectFrame)

    return {
      video,
      onResult(cb) { resultCallback = cb },
      stop() {
        stopped = true
        if (animId) cancelAnimationFrame(animId)
        stream.getTracks().forEach(t => t.stop())
        video.srcObject = null
      },
    }
  },
}
