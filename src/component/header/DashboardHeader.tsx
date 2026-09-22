import { useEffect, useState } from 'react'

export function DashboardHeader() {
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
    <header className="dashboard-header mb-5" id="dashboard">
      <div className="dashboard-header-actions flex items-start justify-end gap-4 max-md:flex-col">
        <div className="dashboard-date text-right max-md:text-left [&_strong]:block [&_strong]:text-slate-950 [&_span]:text-sm [&_span]:font-bold [&_span]:text-slate-500">
          <strong>{formattedDate}</strong>
          <span>{formattedTime}</span>
        </div>
      </div>
    </header>
  )
}
