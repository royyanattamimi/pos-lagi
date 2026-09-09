import { useEffect, useState } from 'react'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ForgotPasswordPage } from './pages/login/ForgotPasswordPage'
import { LoginPage } from './pages/login/LoginPage'
import { StartShiftPage } from './pages/shift/StartShiftPage'
import { supabase } from './lib/supabase'
import {
  createRemoteProduct,
  deleteRemoteProduct,
  loadRemoteProducts,
  updateRemoteProduct,
} from './storage/productStorage'
import { createRemoteTransaction, loadRemoteTransactions } from './storage/transactionStorage'
import { loadPosData, loadRemotePosData, saveRemotePosData } from './storage/posStorage'
import type { Product, ProductInput, ShiftInput, ShiftSession, TransactionRecord } from './types'

function App() {
  const [storedData] = useState(loadPosData)
  const [isStorageReady, setIsStorageReady] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(!supabase)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [isShiftStarted, setIsShiftStarted] = useState(storedData.currentShift?.status === 'Berjalan')
  const [products, setProducts] = useState<Product[]>(storedData.products)
  const [transactions, setTransactions] = useState<TransactionRecord[]>(storedData.transactions)
  const [currentShift, setCurrentShift] = useState<ShiftSession | null>(storedData.currentShift)
  const [shiftHistory, setShiftHistory] = useState<ShiftSession[]>(storedData.shiftHistory)

  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return

      setIsLoggedIn(Boolean(data.session))
      setIsAuthReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session))
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    loadRemotePosData().then((remoteData) => {
      if (!isMounted) return

      setProducts(remoteData.products)
      setTransactions(remoteData.transactions)
      setCurrentShift(remoteData.currentShift)
      setShiftHistory(remoteData.shiftHistory)
      setIsShiftStarted(remoteData.currentShift?.status === 'Berjalan')
      setIsStorageReady(true)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isStorageReady) return

    void saveRemotePosData({ products, transactions, currentShift, shiftHistory })
  }, [isStorageReady, products, transactions, currentShift, shiftHistory])

  useEffect(() => {
    if (!isLoggedIn) return

    let isMounted = true

    loadRemoteProducts(loadPosData().products).then((remoteProducts) => {
      if (!isMounted) return
      setProducts(remoteProducts)
    })

    loadRemoteTransactions(loadPosData().transactions).then((remoteTransactions) => {
      if (!isMounted) return
      setTransactions(remoteTransactions)
    })

    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  async function handleLogin(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.')
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new Error(error.message)

    setIsLoggedIn(true)
    setIsForgotPasswordOpen(false)
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut()
    }

    setIsLoggedIn(false)
    setIsForgotPasswordOpen(false)
    setIsShiftStarted(false)
    setCurrentShift(null)
  }

  async function handleResetPassword(email: string) {
    if (!supabase) {
      throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })

    if (error) throw new Error(error.message)
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
    setIsShiftStarted(false)
  }

  function handleAddProduct(data: ProductInput) {
    const nextProduct: Product = {
      ...data,
      id: Date.now(),
    }

    setProducts((currentProducts) => [nextProduct, ...currentProducts])
    createRemoteProduct(nextProduct).catch((error) => {
      console.error('Gagal menambah product ke Supabase:', error.message)
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== nextProduct.id),
      )
    })
  }

  function handleUpdateProduct(productId: number, data: ProductInput) {
    const previousProducts = products

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              ...data,
            }
          : product,
      ),
    )
    updateRemoteProduct(productId, data).catch((error) => {
      console.error('Gagal mengubah product di Supabase:', error.message)
      setProducts(previousProducts)
    })
  }

  function handleDeleteProduct(productId: number) {
    const previousProducts = products

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId),
    )
    deleteRemoteProduct(productId).catch((error) => {
      console.error('Gagal menghapus product di Supabase:', error.message)
      setProducts(previousProducts)
    })
  }

  function handleCompleteTransaction(transaction: TransactionRecord) {
    setTransactions((currentTransactions) => [transaction, ...currentTransactions])
    createRemoteTransaction(transaction).catch((error) => {
      console.error('Gagal menyimpan transaksi ke Supabase:', error.message)
      setTransactions((currentTransactions) =>
        currentTransactions.filter((currentTransaction) => currentTransaction.id !== transaction.id),
      )
    })
  }

  if (!isAuthReady) {
    return <main className="app-loading">Memuat sesi login...</main>
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
        onDeleteProduct={handleDeleteProduct}
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
    return (
      <ForgotPasswordPage
        onBackToLogin={() => setIsForgotPasswordOpen(false)}
        onResetPassword={handleResetPassword}
      />
    )
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onForgotPassword={() => setIsForgotPasswordOpen(true)}
    />
  )
}

export default App
