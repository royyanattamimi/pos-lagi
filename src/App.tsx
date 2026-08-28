import { useState } from 'react'
import { DashboardPage } from './Dashboard/DashboardPage'
import { LoginPage } from './Login/LoginPage'
import { StartShiftPage } from './Shift/StartShiftPage'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isShiftStarted, setIsShiftStarted] = useState(false)

  function handleLogout() {
    setIsLoggedIn(false)
    setIsShiftStarted(false)
  }

  if (isLoggedIn && isShiftStarted) {
    return <DashboardPage onLogout={handleLogout} />
  }

  if (isLoggedIn) {
    return (
      <StartShiftPage
        onStartShift={() => setIsShiftStarted(true)}
        onBackToLogin={handleLogout}
      />
    )
  }

  return <LoginPage onLogin={() => setIsLoggedIn(true)} />
}

export default App
