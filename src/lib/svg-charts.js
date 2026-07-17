function escapeXml(s) {
  return String(s ?? '').replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;'
  )
}

export function xesc(s) {
  return escapeXml(s)
}

export function safeColor(c) {
  const v = String(c ?? '').trim()
  return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : '#2563eb'
}

export function chartSvg(spec) {
  const kind = spec?.kind || 'bar'
  const series = Array.isArray(spec?.series) ? spec.series : []
  const labels = Array.isArray(spec?.labels) ? spec.labels : []
  const w = 320
  const h = 200
  const pad = 24
  const innerW = w - pad * 2
  const innerH = h - pad * 2

  if (!series.length) return ''

  const allData = series.flatMap((s) => Array.isArray(s?.data) ? s.data : [])
  const maxVal = Math.max(1, ...allData.map((v) => Number(v) || 0))

  let body = ''

  if (kind === 'hbar') {
    const n = labels.length || allData.length
    const barH = Math.max(8, Math.min(28, innerH / Math.max(1, n) - 4))
    labels.slice(0, n).forEach((label, i) => {
      const val = Number(allData[i]) || 0
      const bw = (val / maxVal) * innerW
      const y = pad + i * (barH + 4)
      body += `<rect x="${pad}" y="${y}" width="${bw}" height="${barH}" rx="4" fill="#2563eb"/>`
      body += `<text x="${pad + bw + 6}" y="${y + barH / 2 + 4}" font-size="11" fill="#374151">${val}</text>`
      body += `<text x="6" y="${y + barH / 2 + 4}" font-size="11" fill="#6b7280">${escapeXml(label)}</text>`
    })
  } else if (kind === 'pie' || kind === 'donut') {
    const total = allData.reduce((a, b) => a + (Number(b) || 0), 0) || 1
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(innerW, innerH) / 2
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    let angle = -Math.PI / 2
    allData.forEach((val, i) => {
      const slice = ((Number(val) || 0) / total) * Math.PI * 2
      const x1 = cx + r * Math.cos(angle)
      const y1 = cy + r * Math.sin(angle)
      const x2 = cx + r * Math.cos(angle + slice)
      const y2 = cy + r * Math.sin(angle + slice)
      const large = slice > Math.PI ? 1 : 0
      body += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}"/>`
      angle += slice
    })
    if (kind === 'donut') {
      body += `<circle cx="${cx}" cy="${cy}" r="${r * 0.5}" fill="white"/>`
    }
  } else {
    const n = allData.length
    const bw = n > 0 ? innerW / n - 4 : 0
    allData.forEach((val, i) => {
      const bh = (Number(val) || 0) / maxVal * innerH
      const x = pad + i * (bw + 4)
      const y = h - pad - bh
      body += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="3" fill="#2563eb"/>`
      if (labels[i]) body += `<text x="${x + bw / 2}" y="${h - 6}" font-size="10" fill="#6b7280" text-anchor="middle">${escapeXml(labels[i])}</text>`
    })
  }

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
}

export function ganttSvg(spec) {
  return chartSvg(spec)
}

export function ganttDomain() {
  return { min: 0, max: 1 }
}
