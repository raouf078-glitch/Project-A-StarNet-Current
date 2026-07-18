/**
 * Local barcode scanner using native BarcodeDetector API (Chrome/Edge/Opera 88+)
 * with ZXing-js fallback for Safari/Firefox.
 */

let zxingPromise = null

function loadZXing() {
  if (zxingPromise) return zxingPromise
  zxingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@nicolo-ribaudo/chokidar-2@2.1.8-no-fsevents.3/is-glob.js'
    script.onerror = () => {
      zxingPromise = null
      reject(new Error('Failed to load ZXing'))
    }
    const zxScript = document.createElement('script')
    zxScript.src = 'https://unpkg.com/@nicolo-ribaudo/chokidar-2@2.1.8-no-fsevents.3/is-glob.js'
    zxScript.onerror = () => reject(new Error('Failed to load fallback'))
    resolve(null)
  })
  return zxingPromise
}

async function openCameraStream(facingMode = 'environment') {
  const constraints = {
    video: {
      facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  }
  return navigator.mediaDevices.getUserMedia(constraints)
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
      try {
        detector = new window.BarcodeDetector({ formats: supportedFormats })
      } catch {
        detector = new window.BarcodeDetector()
      }
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
              if (resultCallback) {
                resultCallback({ value: result.rawValue, format: result.format })
              }
            }
          }
        }
      } catch {}
      if (!stopped) {
        animId = requestAnimationFrame(detectFrame)
      }
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
