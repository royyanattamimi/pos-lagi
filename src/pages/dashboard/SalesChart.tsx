import { useState } from 'react'

type SalesChartProps = {
  data: { label: string; date: string; total: number }[]
  description: string
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
})

export function SalesChart({ data, description }: SalesChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const width = Math.max(600, 150 + data.length * 38)
  const left = 125
  const right = width - 30
  const top = 20
  const bottom = 220
  const maximum = Math.max(...data.map((point) => point.total), 1000)
  const magnitude = 10 ** Math.floor(Math.log10(maximum))
  const ceiling = Math.ceil(maximum / magnitude) * magnitude
  const points = data.map((point, index) => ({
    ...point,
    x: left + index * (right - left) / Math.max(data.length - 1, 1),
    y: bottom - point.total / ceiling * (bottom - top),
  }))
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const selected = selectedIndex === null ? null : points[selectedIndex]

  return (
    <div className="mt-4">
      <div className="overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${width} 260`}
          style={{ width: '100%', minWidth: width, height: 260 }}
          aria-label={`Grafik garis penjualan ${description}`}
        >
          <title>{`Penjualan ${description}. Pilih titik untuk melihat nominal penjualan.`}</title>
          {Array.from({ length: 5 }, (_, index) => {
            const y = bottom - index * (bottom - top) / 4
            return (
              <g key={index}>
                <line x1={left} x2={right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                <text x={left - 12} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                  {currency.format(ceiling * index / 4)}
                </text>
              </g>
            )
          })}
          <polygon points={`${left},${bottom} ${line} ${right},${bottom}`} fill="#d1fae5" fillOpacity="0.45" />
          <polyline points={line} fill="none" stroke="#047857" strokeWidth="3" strokeLinejoin="round" />
          {points.map((point, index) => (
            <g key={point.date}>
              <text x={point.x} y={248} textAnchor="middle" fontSize="11" fill="#64748b">{point.label}</text>
              <g
                role="button"
                tabIndex={0}
                aria-label={`${point.date}: ${currency.format(point.total)}`}
                aria-pressed={selectedIndex === index}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setSelectedIndex(index)}
                onFocus={() => setSelectedIndex(index)}
                onClick={() => setSelectedIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedIndex(index)
                  }
                }}
              >
                <circle cx={point.x} cy={point.y} r="14" fill="transparent" />
                <circle cx={point.x} cy={point.y} r={selectedIndex === index ? 6 : 4} fill={selectedIndex === index ? '#047857' : 'white'} stroke="#047857" strokeWidth="2" />
              </g>
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-2 min-h-5 text-sm text-slate-600" aria-live="polite">
        {selected ? `${selected.date}: ${currency.format(selected.total)}` : 'Pilih titik pada grafik untuk melihat jumlah penjualan.'}
      </p>
    </div>
  )
}
