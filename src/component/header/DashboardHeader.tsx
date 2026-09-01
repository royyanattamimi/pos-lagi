import { useEffect, useState } from 'react'
import './DashboardHeader.css'

type DashboardHeaderProps = {
  onSearch: () => void
}

export function DashboardHeader({ onSearch }: DashboardHeaderProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const formattedDate = currentDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = currentDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDate(new Date()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <header className="dashboard-header" id="dashboard">
      <div className="dashboard-header-actions">
        <div className="dashboard-search-buttons" aria-label="Pencarian cepat">
          <button type="button" onClick={onSearch}>Search Product & Transaksi</button>
        </div>
        <div className="dashboard-date">
          <strong>{formattedDate}</strong>
          <span>{formattedTime}</span>
        </div>
      </div>
    </header>
  )
}
