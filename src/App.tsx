import { useState } from 'react'
import { DashboardPage } from './Dashboard/DashboardPage'
import { LoginPage } from './Login/LoginPage'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (isLoggedIn) {
    return <DashboardPage onLogout={() => setIsLoggedIn(false)} />
  }

  return <LoginPage onLogin={() => setIsLoggedIn(true)} />
}

export default App
