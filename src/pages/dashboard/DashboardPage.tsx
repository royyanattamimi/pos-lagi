import { useState } from 'react'
import './DashboardPage.css'
import { DashboardHeader } from '../../component/header/DashboardHeader'
import { PageHeader } from '../../component/header/PageHeader'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { Button } from '../../component/button/Button'
import { ProductPage } from '../product/ProductPage'
import { ProfilePage } from '../profile/ProfilePage'
import { ShiftPage } from '../shift/ShiftPage'
import { TransactionPage } from '../transaction/TransactionPage'
import type { Product, ProductInput, ShiftSession, TransactionRecord } from '../../types'

type DashboardPageProps = {
  products: Product[]
  transactions: TransactionRecord[]
  currentShift: ShiftSession | null
  shiftHistory: ShiftSession[]
  onAddProduct: (product: ProductInput) => void
  onUpdateProduct: (productId: number, product: ProductInput) => void
  onCompleteTransaction: (transaction: TransactionRecord) => void
  onEndShift: () => void
  onLogout: () => void
}

type ActivePage = 'dashboard' | 'product' | 'transaction' | 'shift' | 'profile'
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
  onCompleteTransaction,
  onEndShift,
  onLogout,
}: DashboardPageProps) {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [activeDetail, setActiveDetail] = useState<DashboardDetail>(null)
  const isShiftOpen = currentShift?.status === 'Berjalan'
  const todayKey = new Date().toLocaleDateString('id-ID')
  const todayTransactions = transactions.filter(
    (transaction) => new Date(transaction.createdAt).toLocaleDateString('id-ID') === todayKey,
  )
  const salesToday = todayTransactions.reduce((total, transaction) => total + transaction.grandTotal, 0)
  const activeProducts = products.filter((product) => product.stock > 0)
  const stats = [
    { key: 'sales-today', label: 'Penjualan Hari Ini', value: formatCurrency(salesToday) },
    { key: 'transactions', label: 'Transaksi', value: String(transactions.length) },
    { key: 'active-products', label: 'Product Aktif', value: String(activeProducts.length) },
  ]
  if (activePage === 'transaction') {
    return (
      <TransactionPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('transaction')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        products={products}
        currentShift={currentShift}
        onCompleteTransaction={onCompleteTransaction}
      />
    )
  }

  if (activePage === 'product') {
    return (
      <ProductPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('transaction')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        products={products}
        onAddProduct={onAddProduct}
        onUpdateProduct={onUpdateProduct}
      />
    )
  }

  if (activePage === 'profile') {
    return (
      <ProfilePage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('transaction')}
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
        onTransaction={() => setActivePage('transaction')}
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
    <main className="dashboard-page">
      <Sidebar
        activePage="dashboard"
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('transaction')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        profileName={currentShift?.cashierName}
      />

      <section className="dashboard-content">
        <DashboardHeader
          products={products}
          transactions={transactions}
          onOpenProduct={() => setActivePage('product')}
          onOpenTransaction={() => setActivePage('transaction')}
        />

        <PageHeader
          eyebrow="Dashboard"
          title="Ringkasan operasional toko"
          description="Pantau penjualan, transaksi, dan ketersediaan product dari satu tempat."
        />

        <section className="stats-grid" aria-label="Ringkasan data">
          {stats.map((stat) => (
            <Button
              className="stat-card"
              type="button"
              key={stat.label}
              onClick={() => setActiveDetail(stat.key as DashboardDetail)}
            >
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>Lihat rincian</small>
            </Button>
          ))}
        </section>

        {activeDetail ? (
          <section className="dashboard-detail-panel">
            <div className="panel-header">
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
              <div className="dashboard-detail-list">
                {todayTransactions.length === 0 ? (
                  <div className="empty-dashboard-state">Belum ada penjualan hari ini.</div>
                ) : todayTransactions.map((sale) => (
                  <div className="sales-detail-row" key={sale.id}>
                    <div>
                      <strong>{new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong>
                      <span>{sale.itemCount} item</span>
                    </div>
                    <span>{sale.paymentMethod}</span>
                    <strong>{formatCurrency(sale.grandTotal)}</strong>
                  </div>
                ))}
              </div>
            )}

            {activeDetail === 'transactions' && (
              <div className="dashboard-detail-list">
                {transactions.length === 0 ? (
                  <div className="empty-dashboard-state">Belum ada transaksi. Buat transaksi baru setelah product tersedia.</div>
                ) : transactions.map((transaction) => (
                  <div className="transaction-row" key={transaction.id}>
                    <div>
                      <strong>{transaction.id}</strong>
                      <span>{transaction.cashier}</span>
                    </div>
                    <span>{transaction.itemCount} item</span>
                    <strong>{formatCurrency(transaction.grandTotal)}</strong>
                    <em>{transaction.status}</em>
                  </div>
                ))}
              </div>
            )}

            {activeDetail === 'active-products' && (
              <div className="dashboard-detail-list">
                {activeProducts.length === 0 ? (
                  <div className="empty-dashboard-state">Belum ada product aktif. Tambahkan product manual dulu.</div>
                ) : activeProducts.map((product) => (
                  <div className="product-row" key={product.name}>
                    <div className="dashboard-product-name">
                      <img src={product.image} alt={product.name} />
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.category}</span>
                      </div>
                    </div>
                    <span>{product.stock} stok</span>
                    <strong>{formatCurrency(product.price)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
        <section className="dashboard-grid">
          <article className="panel" id="product">
            <div className="panel-header">
              <div>
                <p>Product</p>
                <h2>Daftar product</h2>
              </div>
              <Button type="button" onClick={() => setActivePage('product')}>Add Product</Button>
            </div>

            <div className="product-list">
              {products.length === 0 ? (
                <div className="empty-dashboard-state">Belum ada product. Klik Add Product untuk input manual.</div>
              ) : products.map((product) => (
                <div className="product-row" key={product.name}>
                  <div className="dashboard-product-name">
                    <img src={product.image} alt={product.name} />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.category}</span>
                    </div>
                  </div>
                  <span>{product.stock} stok</span>
                  <strong>{formatCurrency(product.price)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel" id="transaksi">
            <div className="panel-header">
              <div>
                <p>Transaksi</p>
                <h2>Transaksi terbaru</h2>
              </div>
              <Button type="button" onClick={() => setActivePage('transaction')}>Lihat Semua</Button>
            </div>

            <div className="transaction-list">
              {transactions.length === 0 ? (
                <div className="empty-dashboard-state">Belum ada transaksi yang dibuat.</div>
              ) : transactions.map((transaction) => (
                <div className="transaction-row" key={transaction.id}>
                  <div>
                    <strong>{transaction.id}</strong>
                    <span>{transaction.cashier}</span>
                  </div>
                  <span>{transaction.itemCount} item</span>
                  <strong>{formatCurrency(transaction.grandTotal)}</strong>
                  <em>{transaction.status}</em>
                </div>
              ))}
            </div>
          </article>
        </section>
        )}
      </section>
    </main>
  )
}
