import { useEffect, useState } from 'react'
import { LOGO_DAY, LOGO_NIGHT, NETWORK_NAME } from '../netConfig'
import { getTheme } from '../theme'

const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function formatDate(d) {
  const day = AR_DAYS[d.getDay()]
  const date = d.getDate()
  const month = AR_MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return `${day}، ${date} ${month} ${year}`
}

export default function StarNetHero() {
  const [dark, setDark] = useState(getTheme() === 'dark')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'))
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  return (
    <header className="sn-hero-stage">
      <div className="sn-hero-rays" aria-hidden="true" />
      <div className="sn-hero-mesh" aria-hidden="true" />
      <div className="sn-hero-ambient" aria-hidden="true" />
      <div className="sn-hero-stars" aria-hidden="true" />
      <div className="sn-hero-glow" aria-hidden="true" />
      <div className="sn-hero-skyline" aria-hidden="true">
        <svg className="sn-hero-skyline__svg" viewBox="0 0 800 36" preserveAspectRatio="xMidYMax meet" fill="currentColor">
          <path d="M0 36 H800 V34 H0 Z" opacity="0.35" />
          <path d="M118 34 V22 H122 V34 Z" opacity="0.55" />
          <path d="M120 22 V12" fill="none" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" opacity="0.7" />
          <path d="M116 15 H124 M117 18 H123" fill="none" stroke="currentColor" strokeWidth="0.65" strokeLinecap="round" opacity="0.5" />
          <path d="M582 34 V20 H588 V34 Z" opacity="0.6" />
          <path d="M585 20 V8" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.75" />
          <path d="M580 12 H590 M581 15 H589" fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.55" />
          <path d="M590 11 C596 5 602 5 608 11" fill="none" stroke="currentColor" strokeWidth="0.55" strokeLinecap="round" opacity="0.45" />
          <path d="M588 7.5 C596 0.5 604 0.5 612 7.5" fill="none" stroke="currentColor" strokeWidth="0.45" strokeLinecap="round" opacity="0.28" />
          <path d="M712 34 V24 H716 V34 Z" opacity="0.5" />
          <path d="M714 24 V14" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.65" />
          <path d="M710 17 H718" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.45" />
        </svg>
      </div>
      <div className="sn-hero-curves" aria-hidden="true">
        <svg className="sn-hero-curve sn-hero-curve--1" viewBox="0 0 400 160" preserveAspectRatio="none" fill="none"><path d="M-40 118 C60 58 140 38 200 72 C260 106 320 48 440 88" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
        <svg className="sn-hero-curve sn-hero-curve--2" viewBox="0 0 400 160" preserveAspectRatio="none" fill="none"><path d="M-40 132 C50 78 130 52 205 86 C280 120 340 64 440 102" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        <svg className="sn-hero-curve sn-hero-curve--3" viewBox="0 0 400 160" preserveAspectRatio="none" fill="none"><path d="M-40 146 C70 96 150 70 210 98 C270 126 345 82 440 118" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <svg className="sn-hero-curve sn-hero-curve--4" viewBox="0 0 400 160" preserveAspectRatio="none" fill="none"><path d="M-40 100 C80 42 160 28 210 58 C270 94 330 36 440 70" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" /></svg>
        <svg className="sn-hero-arcs" viewBox="0 0 400 220" preserveAspectRatio="xMidYMin meet" fill="none" aria-hidden="true">
          <circle cx="200" cy="-28" r="62" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
          <circle cx="200" cy="-28" r="98" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
          <circle cx="200" cy="-28" r="134" stroke="currentColor" strokeWidth="1.05" opacity="0.42" />
          <circle cx="200" cy="-28" r="170" stroke="currentColor" strokeWidth="0.9" opacity="0.3" />
          <circle cx="200" cy="-28" r="206" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />
        </svg>
      </div>
      <div className="sn-hero-wifi" aria-hidden="true">
        <span className="sn-hero-wifi__halo" />
        <span className="sn-hero-wifi__pulse" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01" /><path d="M2 8.82a15 15 0 0 1 20 0" /><path d="M5 12.859a10 10 0 0 1 14 0" /><path d="M8.5 16.429a5 5 0 0 1 7 0" /></svg>
      </div>
      <div className="sn-hero-inner">
        <div className="sn-hero-brand">
          <div className="sn-hero-logo-stage">
            <svg className="sn-hero-logo-rings" viewBox="0 0 200 200" fill="none" aria-hidden="true"><g className="sn-hero-logo-rings__svg" stroke="currentColor"><circle cx="100" cy="100" r="42" strokeWidth="0.9" opacity="0.7" /><circle cx="100" cy="100" r="62" strokeWidth="0.75" opacity="0.45" /><circle cx="100" cy="100" r="82" strokeWidth="0.6" opacity="0.28" /></g></svg>
            <div className="sn-hero-logo-ambient" aria-hidden="true">
              <span className="sn-hero-logo-ambient__shine" />
              <span className="sn-cta__spark sn-cta__spark--logo-1" aria-hidden="true">✦</span>
              <span className="sn-cta__spark sn-cta__spark--logo-2" aria-hidden="true">✦</span>
              <span className="sn-cta__spark sn-cta__spark--logo-3" aria-hidden="true">✦</span>
              <span className="sn-cta__spark sn-cta__spark--logo-4" aria-hidden="true">✦</span>
              <span className="sn-cta__spark sn-cta__spark--logo-5" aria-hidden="true">✦</span>
              <span className="sn-cta__spark sn-cta__spark--logo-6" aria-hidden="true">✦</span>
              <span className="sn-cta__spark sn-cta__spark--logo-7" aria-hidden="true">✦</span>
              <span className="sn-cta__spark sn-cta__spark--logo-8" aria-hidden="true">✦</span>
              <span className="sn-cta__spark sn-cta__spark--logo-9" aria-hidden="true">✦</span>
            </div>
            <div className="sn-hero-logo-wrap">
              <img src={LOGO_DAY} alt={NETWORK_NAME} className="sn-hero-logo sn-hero-logo--light" width="300" height="110" />
              <img src={LOGO_NIGHT} alt="" className="sn-hero-logo sn-hero-logo--dark" width="300" height="110" aria-hidden="true" />
            </div>
          </div>
          <p className="sn-hero-trust-badge" aria-label="منذ 2013 — خبرة تثق بها">
            <span className="sn-hero-trust-badge__text">منذ</span>
            <span className="sn-hero-trust-badge__year">2013</span>
            <span className="sn-hero-trust-badge__sep" aria-hidden="true">•</span>
            <span className="sn-hero-trust-badge__text">خبرة تثق بها</span>
          </p>
          <div className="sn-hero-status">
            <svg className="sn-hero-status__wifi" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 20h.01" /><path d="M2 8.82a15 15 0 0 1 20 0" /><path d="M5 12.859a10 10 0 0 1 14 0" /><path d="M8.5 16.429a5 5 0 0 1 7 0" /></svg>
            <span className="sn-hero-status__dot" />
            <span>الشبكة متصلة</span>
          </div>
          <p className="sn-hero-date" aria-live="polite">{formatDate(now)}</p>
        </div>
      </div>
    </header>
  )
}
