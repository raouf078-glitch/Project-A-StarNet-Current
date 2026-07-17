/**
 * BarcodeScanner — camera barcode/QR scanning component.
 * Native BarcodeDetector where available, ZXing WASM fallback elsewhere
 * (handled inside lib/barcode). Renders the live feed with a scan frame,
 * flashes green on a successful read, and fires onScan once per code.
 */

import React, { useEffect, useRef, useState } from 'react'
import { barcode } from '../lib/barcode'

/**
 * @param {object} props
 * @param {function} props.onScan - Called once per newly seen code: ({ value, format })
 * @param {'front'|'back'} [props.camera='back'] - Which camera to use
 * @param {string[]} [props.formats] - Barcode formats to look for (default: common retail + QR)
 * @param {boolean} [props.overlay=true] - Draw the scan-frame overlay
 * @param {string} [props.className] - CSS class for the container
 * @param {object} [props.style] - Inline styles for the container
 */
export default function BarcodeScanner({
  onScan,
  camera = 'back',
  formats,
  overlay = true,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null)
  const detectorRef = useRef(null)
  const callbackRef = useRef(onScan)

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [statusText, setStatusText] = useState('Preparing…')
  const [flash, setFlash] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => { callbackRef.current = onScan }, [onScan])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setStatus('loading')
      setError(null)

      try {
        const det = await barcode.scan({
          camera,
          ...(formats ? { formats } : {}),
          onProgress: (text) => { if (!cancelled) setStatusText(text) },
        })

        if (cancelled) { det.stop(); return }

        detectorRef.current = det
        const videoEl = det.video
        videoEl.style.width = '100%'
        videoEl.style.height = '100%'
        videoEl.style.objectFit = 'cover'
        videoEl.style.display = 'block'

        if (containerRef.current) {
          const wrapper = containerRef.current.querySelector('[data-barcode-video]')
          if (wrapper) { wrapper.innerHTML = ''; wrapper.appendChild(videoEl) }
        }

        setStatus('ready')

        det.onResult((scan) => {
          if (cancelled) return
          setFlash(true)
          setTimeout(() => setFlash(false), 250)
          if (callbackRef.current) callbackRef.current(scan)
        })
      } catch (err) {
        if (cancelled) return
        console.error('[BarcodeScanner] init error:', err)
        setStatus('error')
        setError(err.message || 'Failed to start the scanner')
      }
    }

    init()
    return () => {
      cancelled = true
      if (detectorRef.current) { detectorRef.current.stop(); detectorRef.current = null }
    }
  }, [camera, retryCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const containerStyle = {
    position: 'relative', width: '100%', height: '300px',
    borderRadius: '12px', overflow: 'hidden', backgroundColor: '#111',
    ...style,
  }

  const mediaStyle = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  }

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      <div data-barcode-video style={mediaStyle} />
      {overlay && status === 'ready' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '70%', height: '45%',
            border: flash ? '3px solid rgba(34,197,94,0.95)' : '2px solid rgba(255,255,255,0.7)',
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
            transition: 'border-color 120ms ease',
          }} />
        </div>
      )}
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', gap: '12px', zIndex: 10,
        }}>
          <div style={{
            width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff', borderRadius: '50%',
            animation: 'barcode-spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: '14px', opacity: 0.9 }}>{statusText}</span>
          <style>{`@keyframes barcode-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
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
            onClick={() => setRetryCount((c) => c + 1)}
            style={{
              padding: '8px 20px', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff',
              fontSize: '14px', cursor: 'pointer',
            }}
          >Retry</button>
        </div>
      )}
    </div>
  )
}
