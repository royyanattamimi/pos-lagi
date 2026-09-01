import { useState } from 'react'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ForgotPasswordPage } from './pages/login/ForgotPasswordPage'
import { LoginPage } from './pages/login/LoginPage'
import { StartShiftPage } from './pages/shift/StartShiftPage'
import type { Product, ProductInput, ShiftInput, ShiftSession, TransactionRecord } from './types'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [isShiftStarted, setIsShiftStarted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [currentShift, setCurrentShift] = useState<ShiftSession | null>(null)
  const [shiftHistory, setShiftHistory] = useState<ShiftSession[]>([])

  function handleLogout() {
    setIsLoggedIn(false)
    setIsForgotPasswordOpen(false)
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

  function handleUpdateProduct(productId: number, data: ProductInput) {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              ...data,
              status: data.stock <= 20 ? 'Stok Rendah' : 'Aktif',
            }
          : product,
      ),
    )
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
        onUpdateProduct={handleUpdateProduct}
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

  if (isForgotPasswordOpen) {
    return <ForgotPasswordPage onBackToLogin={() => setIsForgotPasswordOpen(false)} />
  }

  return (
    <LoginPage
      onLogin={() => setIsLoggedIn(true)}
      onForgotPassword={() => setIsForgotPasswordOpen(true)}
    />
  )
}

export default App
