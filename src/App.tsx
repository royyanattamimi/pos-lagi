import { ProfileProvider } from './context/ProfileContext'
import { useEffect, useState } from 'react'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ForgotPasswordPage } from './pages/login/ForgotPasswordPage'
import { LoginPage } from './pages/login/LoginPage'
import { ShiftReportPage } from './pages/shift/ShiftReportPage'
import { snapshotShift } from './storage/shiftReport'
import { StartShiftPage } from './pages/shift/StartShiftPage'
import { supabase } from './lib/supabase'
import {
  createRemoteProduct,
  deleteRemoteProduct,
  loadRemoteProducts,
  updateRemoteProduct,
} from './storage/productStorage'
import { createRemoteTransaction, loadRemoteTransactions } from './storage/transactionStorage'
import { loadPosData, mergeTransactions, savePosData } from './storage/posStorage'
import { closeExpiredShift, getShiftDeadline } from './storage/shiftLifecycle'
import type { Product, ProductInput, ShiftInput, ShiftSession, TransactionRecord } from './types'

function App() {
  const [accountId, setAccountId] = useState('local')
  const [storedData] = useState(loadPosData)
  const [isAuthReady, setIsAuthReady] = useState(!supabase)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [isShiftStarted, setIsShiftStarted] = useState(storedData.currentShift?.status === 'Berjalan')
  const [products, setProducts] = useState<Product[]>(storedData.products)
  const [transactions, setTransactions] = useState<TransactionRecord[]>(storedData.transactions)
  const [currentShift, setCurrentShift] = useState<ShiftSession | null>(storedData.currentShift)
  const [shiftHistory, setShiftHistory] = useState<ShiftSession[]>(storedData.shiftHistory)

  const [reportView, setReportView] = useState<'history' | 'closing' | null>(null)
  const [reportShiftId, setReportShiftId] = useState('')

  useEffect(() => {
    if (!currentShift || currentShift.status !== 'Berjalan') return
    const activeShift = currentShift

    let timeout: ReturnType<typeof setTimeout>
    function checkShift() {
      clearTimeout(timeout)
      const now = Date.now()
      const endedShift = snapshotShift(closeExpiredShift(activeShift, now), transactions)
      if (endedShift.status === 'Selesai') {
        setCurrentShift(endedShift)
        setShiftHistory((history) => history.map((shift) => snapshotShift(closeExpiredShift(shift, now), transactions)))
        setIsShiftStarted(false)
        setReportShiftId(endedShift.id)
        setReportView('history')
        return
      }

      const remaining = getShiftDeadline(activeShift) - now
      if (Number.isFinite(remaining)) {
        timeout = setTimeout(checkShift, Math.max(1, Math.min(remaining, 60_000)))
      }
    }

    checkShift()
    window.addEventListener('focus', checkShift)
    window.addEventListener('pageshow', checkShift)
    document.addEventListener('visibilitychange', checkShift)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('focus', checkShift)
      window.removeEventListener('pageshow', checkShift)
      document.removeEventListener('visibilitychange', checkShift)
    }
  }, [currentShift, transactions])

  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return

      setAccountId(data.session?.user.id || 'local')
      setIsLoggedIn(Boolean(data.session))
      setIsAuthReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccountId(session?.user.id || 'local')
      setIsLoggedIn(Boolean(session))
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    savePosData({ products, transactions, currentShift, shiftHistory })
  }, [products, transactions, currentShift, shiftHistory])

  useEffect(() => {
    if (!isLoggedIn) return

    let isMounted = true

    loadRemoteProducts(loadPosData().products).then((remoteProducts) => {
      if (!isMounted) return
      setProducts(remoteProducts)
    })

    loadRemoteTransactions(loadPosData().transactions).then((remoteTransactions) => {
      if (!isMounted) return
      setTransactions((currentTransactions) => mergeTransactions(currentTransactions, remoteTransactions))
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

  function handleSaveShiftReport(shift: ShiftSession, cash: number, note: string) {
    const source = shiftHistory.find((entry) => entry.id === shift.id)
    if (!source) throw new Error('Shift tidak ditemukan.')
    const ended = snapshotShift({
      ...source,
      endAt: source.endAt ?? new Date(Math.min(Date.now(), getShiftDeadline(source))).toISOString(),
      status: 'Selesai',
    }, transactions)
    const updated: ShiftSession = {
      ...ended,
      report: { ...ended.report!, closingCash: cash, closingNote: note, savedAt: new Date().toISOString() },
    }
    const nextHistory = shiftHistory.map((entry) => entry.id === updated.id ? updated : entry)
    const nextCurrent = currentShift?.id === updated.id ? updated : currentShift
    savePosData({ products, transactions, currentShift: nextCurrent, shiftHistory: nextHistory }, true)
    setShiftHistory(nextHistory)
    setCurrentShift(nextCurrent)
    if (currentShift?.id === updated.id) setIsShiftStarted(false)
    setReportShiftId(updated.id)
    setReportView('history')
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
    const linkedTransaction = { ...transaction, shiftId: currentShift?.id }
    setTransactions((currentTransactions) => [linkedTransaction, ...currentTransactions])
    createRemoteTransaction(linkedTransaction).catch((error) => {
      console.error('Gagal menyimpan transaksi ke Supabase:', error.message)
      // Payment has already completed. Keep it locally even if remote storage fails.
    })
  }

  if (!isAuthReady) {
    return <main className="app-loading min-h-screen grid place-items-center bg-slate-100 text-slate-600 text-sm font-extrabold">Memuat sesi login...</main>
  }

  if (isLoggedIn && reportView) {
    return <ShiftReportPage
      key={`${reportView}-${reportShiftId}`}
      shifts={shiftHistory}
      transactions={transactions}
      closingShift={reportView === 'closing' && currentShift?.status === 'Berjalan' ? currentShift : null}
      initialShiftId={reportShiftId}
      onBack={() => setReportView(null)}
      onFinish={!isShiftStarted ? () => { setReportShiftId(''); setReportView(null) } : undefined}
      onSave={handleSaveShiftReport}
    />
  }

  if (isLoggedIn && isShiftStarted) {
    return (
      <ProfileProvider key={accountId} accountId={accountId}>
      <DashboardPage
        products={products}
        transactions={transactions}
        currentShift={currentShift}
        shiftHistory={shiftHistory}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onCompleteTransaction={handleCompleteTransaction}
        onEndShift={() => { setReportShiftId(''); setReportView('closing') }}
        onShiftReports={(shiftId?: string) => { setReportShiftId(shiftId ?? ''); setReportView('history') }}
        onLogout={handleLogout}
      />
      </ProfileProvider>
    )
  }

  if (isLoggedIn) {
    return (
      <StartShiftPage
        onShiftReports={() => { setReportShiftId(''); setReportView('history') }}
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
