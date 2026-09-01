import { useState } from 'react'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { LoginPage } from './pages/login/LoginPage'
import { StartShiftPage } from './pages/shift/StartShiftPage'
import type { Product, ProductInput, ShiftInput, ShiftSession, TransactionRecord } from './types'

function dateDaysAgo(days: number, time: string) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const [hours, minutes] = time.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)

  return date.toISOString()
}

const previousShiftHistory: ShiftSession[] = [
  {
    id: 'SHIFT-PREV-1',
    cashierName: 'Kasir Trial',
    shiftTime: '08:00 - 16:00',
    openingCash: 500000,
    note: 'Riwayat tracking hari sebelumnya',
    startAt: dateDaysAgo(1, '08:00'),
    endAt: dateDaysAgo(1, '16:05'),
    status: 'Selesai',
  },
  {
    id: 'SHIFT-PREV-2',
    cashierName: 'Kasir Trial',
    shiftTime: '08:00 - 16:00',
    openingCash: 450000,
    note: 'Riwayat tracking hari sebelumnya',
    startAt: dateDaysAgo(2, '08:03'),
    endAt: dateDaysAgo(2, '16:00'),
    status: 'Selesai',
  },
  {
    id: 'SHIFT-PREV-3',
    cashierName: 'Kasir Trial',
    shiftTime: '16:00 - 22:00',
    openingCash: 350000,
    note: 'Riwayat tracking hari sebelumnya',
    startAt: dateDaysAgo(3, '16:00'),
    endAt: dateDaysAgo(3, '22:04'),
    status: 'Selesai',
  },
]

const previousTransactions: TransactionRecord[] = [
  {
    id: '#POS-PREV-001',
    cashier: 'Kasir Trial',
    createdAt: dateDaysAgo(1, '10:12'),
    items: [{ productId: 0, name: 'Riwayat Penjualan', price: 120000, quantity: 1, total: 120000 }],
    itemCount: 1,
    subtotal: 120000,
    tax: 12000,
    grandTotal: 132000,
    paid: 132000,
    change: 0,
    paymentMethod: 'Cash',
    status: 'Lunas',
  },
  {
    id: '#POS-PREV-002',
    cashier: 'Kasir Trial',
    createdAt: dateDaysAgo(2, '13:25'),
    items: [{ productId: 0, name: 'Riwayat Penjualan', price: 230000, quantity: 1, total: 230000 }],
    itemCount: 1,
    subtotal: 230000,
    tax: 23000,
    grandTotal: 253000,
    paid: 253000,
    change: 0,
    paymentMethod: 'QRIS',
    status: 'Lunas',
  },
  {
    id: '#POS-PREV-003',
    cashier: 'Kasir Trial',
    createdAt: dateDaysAgo(3, '18:40'),
    items: [{ productId: 0, name: 'Riwayat Penjualan', price: 175000, quantity: 1, total: 175000 }],
    itemCount: 1,
    subtotal: 175000,
    tax: 17500,
    grandTotal: 192500,
    paid: 192500,
    change: 0,
    paymentMethod: 'Cash',
    status: 'Lunas',
  },
]

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isShiftStarted, setIsShiftStarted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>(previousTransactions)
  const [currentShift, setCurrentShift] = useState<ShiftSession | null>(null)
  const [shiftHistory, setShiftHistory] = useState<ShiftSession[]>(previousShiftHistory)

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
