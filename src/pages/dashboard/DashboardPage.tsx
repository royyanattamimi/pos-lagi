import { useState } from 'react'
import { DashboardHeader } from '../../component/header/DashboardHeader'
import { PageHeader } from '../../component/header/PageHeader'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { Button } from '../../component/button/Button'
import { ProductPage } from '../product/ProductPage'
import { ProfilePage } from '../profile/ProfilePage'
import { ShiftPage } from '../shift/ShiftPage'
import { TransactionPage } from '../transaction/TransactionPage'
import { TransactionDetailPage } from '../transaction/detail/TransactionDetailPage'
import { TransactionHistoryPage } from '../transaction/history/TransactionHistoryPage'
import type { Product, ProductInput, ShiftSession, TransactionRecord } from '../../types'

type DashboardPageProps = {
  products: Product[]
  transactions: TransactionRecord[]
  currentShift: ShiftSession | null
  shiftHistory: ShiftSession[]
  onAddProduct: (product: ProductInput) => void
  onUpdateProduct: (productId: number, product: ProductInput) => void
  onDeleteProduct: (productId: number) => void
  onCompleteTransaction: (transaction: TransactionRecord) => void
  onEndShift: () => void
  onLogout: () => void
}

type ActivePage = 'dashboard' | 'product' | 'transaction' | 'checkout' | 'shift' | 'profile'
type DashboardDetail = 'sales-today' | 'transactions' | 'active-products' | null

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
  return currency.format(value)
}

export function DashboardPage({
  products,
  transactions,
  currentShift,
  shiftHistory,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onCompleteTransaction,
  onEndShift,
  onLogout,
}: DashboardPageProps) {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [activeDetail, setActiveDetail] = useState<DashboardDetail>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null)
  const isShiftOpen = currentShift?.status === 'Berjalan'
  const todayKey = new Date().toLocaleDateString('id-ID')
  const todayTransactions = transactions.filter(
    (transaction) => new Date(transaction.createdAt).toLocaleDateString('id-ID') === todayKey,
  )
  const salesToday = todayTransactions.reduce((total, transaction) => total + transaction.grandTotal, 0)
  const activeProducts = products
  const stats = [
    { key: 'sales-today', label: 'Penjualan Hari Ini', value: formatCurrency(salesToday) },
    { key: 'transactions', label: 'Transaksi', value: String(transactions.length) },
    { key: 'active-products', label: 'Product Aktif', value: String(activeProducts.length) },
  ]
  if (selectedTransaction) {
    return (
      <TransactionDetailPage
        transaction={selectedTransaction}
        onBack={() => setSelectedTransaction(null)}
        onDashboard={() => {
          setSelectedTransaction(null)
          setActivePage('dashboard')
        }}
        onProduct={() => {
          setSelectedTransaction(null)
          setActivePage('product')
        }}
        onTransaction={() => {
          setSelectedTransaction(null)
          setActivePage('checkout')
        }}
        onProfile={() => {
          setSelectedTransaction(null)
          setActivePage('profile')
        }}
        profileName={currentShift?.cashierName}
      />
    )
  }

  if (activePage === 'checkout') {
    return (
      <TransactionPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('checkout')}
        onHistory={() => setActivePage('transaction')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        products={products}
        currentShift={currentShift}
        onCompleteTransaction={onCompleteTransaction}
      />
    )
  }

  if (activePage === 'transaction') {
    return (
      <TransactionHistoryPage
        transactions={transactions}
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('checkout')}
        onProfile={() => setActivePage('profile')}
        onNewTransaction={() => setActivePage('checkout')}
        onSelectTransaction={setSelectedTransaction}
        profileName={currentShift?.cashierName}
      />
    )
  }

  if (activePage === 'product') {
    return (
      <ProductPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('checkout')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        products={products}
        onAddProduct={onAddProduct}
        onUpdateProduct={onUpdateProduct}
        onDeleteProduct={onDeleteProduct}
      />
    )
  }

  if (activePage === 'profile') {
    return (
      <ProfilePage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('checkout')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        onLogout={onLogout}
        isShiftOpen={isShiftOpen}
        currentShift={currentShift}
      />
    )
  }

  if (activePage === 'shift') {
    return (
      <ShiftPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('checkout')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        currentShift={currentShift}
        shiftHistory={shiftHistory}
        transactions={transactions}
        onEndShift={onEndShift}
      />
    )
  }

  return (
    <main className="dashboard-page min-h-screen grid grid-cols-1 bg-slate-100 text-slate-900 md:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar
        activePage="dashboard"
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('checkout')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        profileName={currentShift?.cashierName}
      />

      <section className="dashboard-content min-w-0 p-5 md:p-8">
        <DashboardHeader
          products={products}
          transactions={transactions}
          onOpenProduct={() => setActivePage('product')}
          onOpenTransaction={setSelectedTransaction}
        />

        <PageHeader
          eyebrow="Dashboard"
          title="Ringkasan operasional toko"
          description="Pantau penjualan, transaksi, dan ketersediaan product dari satu tempat."
        />

        <section className="stats-grid mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan data">
          {stats.map((stat) => (
            <Button
              className="stat-card grid min-h-32 gap-2 rounded-lg border border-slate-200 bg-white p-5 text-left shadow-lg shadow-slate-900/5 hover:border-slate-300"
              type="button"
              key={stat.label}
              onClick={() => {
                if (stat.key === 'transactions') {
                  setActiveDetail(null)
                  setActivePage('checkout')
                  return
                }

                setActiveDetail(stat.key as DashboardDetail)
              }}
            >
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.key === 'transactions' ? 'Buat transaksi baru' : 'Lihat rincian'}</small>
            </Button>
          ))}
        </section>

        {activeDetail && (
          <section className="dashboard-detail-panel rounded-lg border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="panel-header mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
              <div>
                <p>Rincian Dashboard</p>
                <h2>
                  {activeDetail === 'sales-today' && 'Penjualan Hari Ini'}
                  {activeDetail === 'transactions' && 'Transaksi'}
                  {activeDetail === 'active-products' && 'Product Aktif'}
                </h2>
              </div>
              <Button type="button" onClick={() => setActiveDetail(null)}>Kembali</Button>
            </div>

            {activeDetail === 'sales-today' && (
              <div className="dashboard-detail-list grid gap-3">
                {todayTransactions.length === 0 ? (
                  <div className="empty-dashboard-state rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">Belum ada penjualan hari ini.</div>
                ) : todayTransactions.map((sale) => (
                  <Button
                    className="sales-detail-row transaction-detail-trigger grid w-full grid-cols-[1fr_auto] gap-3 rounded-lg border border-slate-100 bg-white p-3 text-left hover:border-slate-300"
                    type="button"
                    key={sale.id}
                    onClick={() => setSelectedTransaction(sale)}
                  >
                    <div>
                      <strong>{new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong>
                      <span>{sale.itemCount} item</span>
                    </div>
                    <span>{sale.paymentMethod}</span>
                    <strong>{formatCurrency(sale.grandTotal)}</strong>
                  </Button>
                ))}
              </div>
            )}

            {activeDetail === 'transactions' && (
              <div className="dashboard-detail-list grid gap-3">
                {transactions.length === 0 ? (
                  <div className="empty-dashboard-state rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">Belum ada transaksi. Buat transaksi baru setelah product tersedia.</div>
                ) : transactions.map((transaction) => (
                  <Button
                    className="transaction-row transaction-detail-trigger grid w-full grid-cols-[1fr_auto] gap-3 rounded-lg border border-slate-100 bg-white p-3 text-left hover:border-slate-300"
                    type="button"
                    key={transaction.id}
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <div>
                      <strong>{transaction.id}</strong>
                      <span>{transaction.cashier}</span>
                    </div>
                    <span>{transaction.itemCount} item</span>
                    <strong>{formatCurrency(transaction.grandTotal)}</strong>
                    <em>{transaction.status}</em>
                  </Button>
                ))}
              </div>
            )}

            {activeDetail === 'active-products' && (
              <div className="dashboard-detail-list grid gap-3">
                {activeProducts.length === 0 ? (
                  <div className="empty-dashboard-state rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">Belum ada product aktif. Tambahkan product manual dulu.</div>
                ) : activeProducts.map((product) => (
                  <div className="product-row flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white p-3" key={product.name}>
                    <div className="dashboard-product-name flex items-center gap-3 [&_img]:h-12 [&_img]:w-14 [&_img]:rounded-lg [&_img]:object-cover [&_span]:text-sm [&_span]:text-slate-500">
                      <img src={product.image} alt={product.name} />
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.category}</span>
                      </div>
                    </div>
                    <strong>{formatCurrency(product.price)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  )
}
