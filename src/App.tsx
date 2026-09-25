import { ProfileProvider } from './context/ProfileContext'
import { useEffect, useRef, useState } from 'react'
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
import { createRemoteRefund, loadRemoteRefunds } from './storage/refundStorage'
import { createRemoteTransaction, loadRemoteTransactions } from './storage/transactionStorage'
import { loadPosData, emptyPosData } from './storage/posStorage'
import { loadRemoteShifts, saveRemoteShift } from './storage/shiftStorage'
import { Button } from './component/button/Button'
import { closeExpiredShift, getShiftDeadline } from './storage/shiftLifecycle'
import type { RefundInput, Product, ProductInput, ShiftInput, ShiftSession, TransactionRecord } from './types'

function App() {
  const [accountId, setAccountId] = useState('local')
  const storedData = emptyPosData
  const [dataReady, setDataReady] = useState(false)
  const [dataError, setDataError] = useState('')
  const [reload, setReload] = useState(0)
  const [loadedKey, setLoadedKey] = useState('')
  const databaseKey = `${accountId}:${reload}`
  const closingRef = useRef(false)
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
  const [refundAvailable, setRefundAvailable] = useState(false)

  useEffect(() => {
    if (!isLoggedIn || loadedKey !== databaseKey || !dataReady || !currentShift || currentShift.status !== 'Berjalan') return
    const activeShift = currentShift

    let timeout: ReturnType<typeof setTimeout>
    async function checkShift() {
      clearTimeout(timeout)
      const now = Date.now()
      const endedShift = snapshotShift(closeExpiredShift(activeShift, now), transactions)
      if (endedShift.status === 'Selesai') {
        if (closingRef.current) return
        closingRef.current = true
        try {
          await saveRemoteShift(endedShift, activeShift)
        } catch (error) {
          setDataError(error instanceof Error ? error.message : 'Gagal menutup shift.')
          setDataReady(false)
          return
        } finally { closingRef.current = false }
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
  }, [currentShift, transactions, dataReady, isLoggedIn, loadedKey, databaseKey])

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
    let cancelled = false
    if (!isLoggedIn) return
    async function load() {
      try {
        const [remoteProducts, sales, refunds, remoteShifts] = await Promise.all([
          loadRemoteProducts(), loadRemoteTransactions(), loadRemoteRefunds(), loadRemoteShifts(),
        ])
        const remoteTransactions = [...sales, ...refunds.records]
        const shifts: ShiftSession[] = []
        for (const shift of remoteShifts) {
          const reconciled = snapshotShift(closeExpiredShift(shift), remoteTransactions)
          if (reconciled !== shift) await saveRemoteShift(reconciled, shift)
          shifts.push(reconciled)
        }
        if (cancelled) return
        const active = shifts.find((shift) => shift.status === 'Berjalan') ?? null
        setRefundAvailable(refunds.available)
        setProducts(remoteProducts)
        setTransactions(remoteTransactions)
        setShiftHistory(shifts)
        setCurrentShift(active)
        setIsShiftStarted(Boolean(active))
        setReportView(null)
        setDataError('')
        setLoadedKey(`${accountId}:${reload}`)
        setDataReady(true)
      } catch (error) {
        if (!cancelled) setDataError(error instanceof Error ? error.message : 'Gagal memuat database.')
      }
    }
    void load()
    return () => { cancelled = true }
  }, [isLoggedIn, accountId, reload])

  async function handleImportLocal() {
    const legacy = loadPosData()
    const [remoteProducts, remoteTransactions, remoteShifts] = await Promise.all([
      loadRemoteProducts(), loadRemoteTransactions(), loadRemoteShifts(),
    ])
    for (const product of legacy.products) {
      if (!remoteProducts.some((entry) => entry.id === product.id)) await createRemoteProduct(product)
    }
    for (const transaction of legacy.transactions) {
      if (!remoteTransactions.some((entry) => entry.id === transaction.id)) await createRemoteTransaction(transaction)
    }
    const shifts = new Map(legacy.shiftHistory.map((shift) => [shift.id, shift]))
    if (legacy.currentShift) shifts.set(legacy.currentShift.id, legacy.currentShift)
    for (const shift of shifts.values()) {
      if (!remoteShifts.some((entry) => entry.id === shift.id)) await saveRemoteShift(shift)
    }
    setReload((value) => value + 1)
  }

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

  async function handleStartShift(data: ShiftInput) {
    const shift: ShiftSession = {
      ...data,
      id: `SHIFT-${crypto.randomUUID()}`,
      startAt: new Date().toISOString(),
      status: 'Berjalan',
    }

    await saveRemoteShift(shift)
    setCurrentShift(shift)
    setShiftHistory((currentHistory) => [shift, ...currentHistory])
    setIsShiftStarted(true)
  }

  async function handleSaveShiftReport(shift: ShiftSession, cash: number, note: string) {
    const source = shiftHistory.find((entry) => entry.id === shift.id)
    if (!source) throw new Error('Shift tidak ditemukan.')
    const [sales, refunds] = await Promise.all([loadRemoteTransactions(), loadRemoteRefunds()])
    const latestTransactions = [...sales, ...refunds.records]
    const ended = snapshotShift({
      ...source,
      endAt: source.endAt ?? new Date(Math.min(Date.now(), getShiftDeadline(source))).toISOString(),
      status: 'Selesai',
    }, latestTransactions)
    const updated: ShiftSession = {
      ...ended,
      report: { ...ended.report!, closingCash: cash, closingNote: note, savedAt: new Date().toISOString() },
    }
    const nextHistory = shiftHistory.map((entry) => entry.id === updated.id ? updated : entry)
    const nextCurrent = currentShift?.id === updated.id ? updated : currentShift
    await saveRemoteShift(updated, source)
    setTransactions(latestTransactions)
    setShiftHistory(nextHistory)
    setCurrentShift(nextCurrent)
    if (currentShift?.id === updated.id) setIsShiftStarted(false)
    setReportShiftId(updated.id)
    setReportView('history')
  }

  async function handleAddProduct(data: ProductInput) {
    const product: Product = { ...data, id: Date.now() }
    await createRemoteProduct(product)
    setProducts((current) => [product, ...current])
  }

  async function handleUpdateProduct(productId: number, data: ProductInput) {
    await updateRemoteProduct(productId, data)
    setProducts((current) => current.map((product) => product.id === productId ? { ...product, ...data } : product))
  }

  async function handleDeleteProduct(productId: number) {
    await deleteRemoteProduct(productId)
    setProducts((current) => current.filter((product) => product.id !== productId))
  }

  async function handleCompleteTransaction(transaction: TransactionRecord) {
    if (!currentShift || currentShift.status !== 'Berjalan' || Date.now() >= getShiftDeadline(currentShift)) {
      throw new Error('Shift sudah berakhir. Mulai shift baru sebelum transaksi.')
    }
    const linked = { ...transaction, shiftId: currentShift.id }
    await createRemoteTransaction(linked)
    const [sales, refunds] = await Promise.all([loadRemoteTransactions(), loadRemoteRefunds()])
    setTransactions([...sales, ...refunds.records])
    setRefundAvailable(refunds.available)
  }

  async function handleRefund(input: RefundInput) {
    if (!currentShift || currentShift.id !== input.shiftId || currentShift.status !== 'Berjalan') {
      throw new Error('Shift aktif tidak ditemukan.')
    }
    const refund = await createRemoteRefund(input)
    const shifts = await loadRemoteShifts()
    setShiftHistory(shifts)
    const latestShift = shifts.find((shift) => shift.id === input.shiftId)
    if (latestShift) {
      setCurrentShift(latestShift)
      setIsShiftStarted(latestShift.status === 'Berjalan')
    }
    setTransactions((current) => [refund, ...current.filter((entry) => entry.id !== refund.id)])
  }

  if (!isAuthReady) {
    return <main className="app-loading min-h-screen grid place-items-center bg-slate-100 text-slate-600 text-sm font-extrabold">Memuat sesi login...</main>
  }

  if (isLoggedIn && (!dataReady || loadedKey !== databaseKey)) {
    return <main className="min-h-screen grid place-items-center bg-slate-100 p-6">
      <section className="max-w-lg rounded-xl bg-white p-6">
        <h1 className="text-xl font-bold">{dataError ? 'Database belum bisa dimuat' : 'Memuat data dari database…'}</h1>
        {dataError && <><p role="alert" className="my-4 text-sm text-red-600">{dataError}</p><p className="mb-4 text-sm">Pastikan migrasi database sudah dijalankan dan koneksi tersedia.</p><Button onClick={() => { setDataError(''); setReload((value) => value + 1) }}>Coba lagi</Button></>}
      </section>
    </main>
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
        onRefund={handleRefund}
        refundAvailable={refundAvailable}
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
        onImportLocal={handleImportLocal}
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
