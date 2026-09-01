import { useState } from 'react'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { LoginPage } from './pages/login/LoginPage'
import { StartShiftPage } from './pages/shift/StartShiftPage'
import type { Product, ProductInput, ShiftInput, ShiftSession, TransactionRecord } from './types'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isShiftStarted, setIsShiftStarted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [currentShift, setCurrentShift] = useState<ShiftSession | null>(null)
  const [shiftHistory, setShiftHistory] = useState<ShiftSession[]>([])

  function handleLogout() {
    setIsLoggedIn(false)
    setIsShiftStarted(false)
    setCurrentShift(null)
  }

  function handleStartShift(data: ShiftInput) {
    const shift: ShiftSession = {
      ...data,
      id: `SHIFT-${Date.now()}`,
      startAt: new Date().toISOString(),
      status: 'Berjalan',
    }

    setCurrentShift(shift)
    setShiftHistory((currentHistory) => [shift, ...currentHistory])
    setIsShiftStarted(true)
  }

  function handleEndShift() {
    if (!currentShift || currentShift.status === 'Selesai') return

    const endedShift: ShiftSession = {
      ...currentShift,
      endAt: new Date().toISOString(),
      status: 'Selesai',
    }

    setCurrentShift(endedShift)
    setShiftHistory((currentHistory) =>
      currentHistory.map((shift) => (shift.id === endedShift.id ? endedShift : shift)),
    )
  }

  function handleAddProduct(data: ProductInput) {
    const nextProduct: Product = {
      ...data,
      id: Date.now(),
      status: data.stock <= 20 ? 'Stok Rendah' : 'Aktif',
    }

    setProducts((currentProducts) => [nextProduct, ...currentProducts])
  }

  function handleCompleteTransaction(transaction: TransactionRecord) {
    setTransactions((currentTransactions) => [transaction, ...currentTransactions])
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const soldItem = transaction.items.find((item) => item.productId === product.id)
        if (!soldItem) return product

        const nextStock = Math.max(product.stock - soldItem.quantity, 0)
        return {
          ...product,
          stock: nextStock,
          status: nextStock <= 20 ? 'Stok Rendah' : 'Aktif',
        }
      }),
    )
  }

  if (isLoggedIn && isShiftStarted) {
    return (
      <DashboardPage
        products={products}
        transactions={transactions}
        currentShift={currentShift}
        shiftHistory={shiftHistory}
        onAddProduct={handleAddProduct}
        onCompleteTransaction={handleCompleteTransaction}
        onEndShift={handleEndShift}
        onLogout={handleLogout}
      />
    )
  }

  if (isLoggedIn) {
    return (
      <StartShiftPage
        onStartShift={handleStartShift}
        onBackToLogin={handleLogout}
      />
    )
  }

  return <LoginPage onLogin={() => setIsLoggedIn(true)} />
}

export default App
