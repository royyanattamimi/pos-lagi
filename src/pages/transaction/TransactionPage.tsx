import { useMemo, useState } from 'react'
import { History } from 'lucide-react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { ReceiptPage } from './receipt/ReceiptPage'
import type { Product, ShiftSession, TransactionItem, TransactionRecord } from '../../types'
import './TransactionPage.css'

type TransactionPageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onHistory: () => void
  onShift: () => void
  onProfile: () => void
  products: Product[]
  currentShift: ShiftSession | null
  onCompleteTransaction: (transaction: TransactionRecord) => void
}

type Step = 'select' | 'review' | 'payment' | 'finish'

type CartItem = {
  productId: number
  quantity: number
}

const steps: Step[] = ['select', 'review', 'payment', 'finish']

const stepLabel: Record<Step, string> = {
  select: 'Pilih Product',
  review: 'Review Pesanan',
  payment: 'Pembayaran',
  finish: 'Finish',
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
  return currency.format(value)
}

export function TransactionPage({
  onDashboard,
  onProduct,
  onTransaction,
  onHistory,
  onShift,
  onProfile,
  products,
  currentShift,
  onCompleteTransaction,
}: TransactionPageProps) {
  const [step, setStep] = useState<Step>('select')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paidAmount, setPaidAmount] = useState('')
  const [receipt, setReceipt] = useState<TransactionRecord | null>(null)
  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  )

  const cartItems = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((currentProduct) => currentProduct.id === item.productId)
          return product ? { ...item, product, total: product.price * item.quantity } : null
        })
        .filter((item): item is CartItem & { product: Product; total: number } => Boolean(item)),
    [cart, products],
  )

  const subtotal = cartItems.reduce((total, item) => total + item.total, 0)
  const grandTotal = subtotal
  const paid = Number(paidAmount || 0)
  const change = Math.max(paid - grandTotal, 0)
  const canFinish = paymentMethod !== 'Cash' || paid >= grandTotal
  const filteredProducts =
    selectedCategory === 'Semua'
      ? products
      : products.filter((product) => product.category === selectedCategory)

  function addProduct(product: Product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.productId === product.id)
      if (!existingItem) return [...currentCart, { productId: product.id, quantity: 1 }]

      return currentCart.map((item) =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
      )
    })
  }

  function updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      setCart((currentCart) => currentCart.filter((item) => item.productId !== productId))
      return
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    )
  }

  function resetTransaction() {
    setStep('select')
    setSelectedCategory('Semua')
    setCart([])
    setPaymentMethod('Cash')
    setPaidAmount('')
    setReceipt(null)
  }

  function finishPayment() {
    const items: TransactionItem[] = cartItems.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      total: item.total,
    }))
    const createdAt = new Date().toISOString()
    const transaction: TransactionRecord = {
      id: `#POS-${createdAt.replace(/\D/g, '').slice(0, 14)}`,
      cashier: currentShift?.cashierName || '-',
      createdAt,
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal,
      tax: 0,
      grandTotal,
      paid: paymentMethod === 'Cash' ? paid : grandTotal,
      change: paymentMethod === 'Cash' ? change : 0,
      paymentMethod,
      status: 'Lunas',
    }

    setReceipt(transaction)
    onCompleteTransaction(transaction)
    setStep('finish')
  }

  if (step === 'finish') {
    if (!receipt) return null

    return (
      <ReceiptPage
        transaction={receipt}
        onNewTransaction={resetTransaction}
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={resetTransaction}
        onShift={onShift}
        onProfile={onProfile}
      />
    )
  }

  return (
    <main className="transaction-page">
      <Sidebar
        activePage="transaction"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
      />

      <section className="transaction-content">
        <PageHeader
          eyebrow="Transaksi"
          title="Buat transaksi baru"
          description="Pilih product, review pesanan, proses pembayaran, lalu selesaikan transaksi."
          actions={(
            <>
              <Button className="transaction-history-button" type="button" onClick={onHistory}>
                <History aria-hidden="true" />
                Riwayat Transaksi
              </Button>
              <Button type="button" onClick={resetTransaction}>Reset</Button>
            </>
          )}
        />

        <section className="transaction-stepper" aria-label="Flow transaksi">
          {steps.map((currentStep, index) => (
            <span className={steps.indexOf(step) >= index ? 'done' : ''} key={currentStep}>
              {index + 1}. {stepLabel[currentStep]}
            </span>
          ))}
        </section>

        {step === 'select' && (
          <section className="transaction-grid">
            <article className="transaction-panel">
              <div className="transaction-panel-header">
                <div>
                  <p>Product</p>
                  <h2>Pilih product</h2>
                </div>
              </div>

              <div className="category-list">
                {categories.map((category) => (
                  <Button
                    className={selectedCategory === category ? 'selected' : ''}
                    type="button"
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="product-catalog">
                {products.length === 0 ? (
                  <div className="empty-order">Belum ada product. Input product manual dulu di halaman Product.</div>
                ) : filteredProducts.map((product) => (
                  <Button
                    className="catalog-item"
                    type="button"
                    key={product.id}
                    onClick={() => addProduct(product)}
                  >
                    <img src={product.image} alt={product.name} />
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
                    <b>{formatCurrency(product.price)}</b>
                  </Button>
                ))}
              </div>
            </article>

            <aside className="transaction-panel order-panel">
              <div className="transaction-panel-header">
                <div>
                  <p>Keranjang</p>
                  <h2>Pesanan berjalan</h2>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <div className="empty-order">Belum ada product dipilih.</div>
              ) : (
                <div className="mini-cart">
                  {cartItems.map((item) => (
                    <div className="mini-cart-row" key={item.productId}>
                      <div className="mini-cart-info">
                        <strong>{item.product.name}</strong>
                        <span>{formatCurrency(item.product.price)} per item</span>
                      </div>
                      <div className="mini-cart-control">
                        <Button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                          -
                        </Button>
                        <Input
                          min="1"
                          type="number"
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                          aria-label={`Jumlah ${item.product.name}`}
                        />
                        <Button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                          +
                        </Button>
                      </div>
                      <b>{formatCurrency(item.total)}</b>
                    </div>
                  ))}
                </div>
              )}

              <div className="summary-box">
                <span>Subtotal <strong>{formatCurrency(subtotal)}</strong></span>
              </div>

              <Button
                className="primary-action"
                variant="primary"
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => setStep('review')}
              >
                Review Pesanan
              </Button>
            </aside>
          </section>
        )}

        {step === 'review' && (
          <section className="review-layout">
            <article className="transaction-panel review-items-panel">
              <div className="transaction-panel-header">
                <div>
                  <p>Review Pesanan</p>
                  <h2>Cek product sebelum pembayaran</h2>
                </div>
                <strong className="review-item-count">{cartItems.length} product</strong>
              </div>

              <div className="cart-table">
                {cartItems.map((item) => (
                  <div className="cart-table-row" key={item.productId}>
                    <div className="review-product-cell">
                      <img src={item.product.image} alt={item.product.name} />
                      <div>
                        <strong>{item.product.name}</strong>
                        <span>{item.product.category}</span>
                        <small>{formatCurrency(item.product.price)} per item</small>
                      </div>
                    </div>
                    <div className="quantity-control">
                      <Button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                        -
                      </Button>
                      <strong>{item.quantity}</strong>
                      <Button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                        +
                      </Button>
                    </div>
                    <b>{formatCurrency(item.total)}</b>
                  </div>
                ))}
              </div>
            </article>

            <aside className="transaction-panel review-summary-panel">
              <div className="transaction-panel-header">
                <div>
                  <p>Ringkasan</p>
                  <h2>Total pesanan</h2>
                </div>
              </div>

              <div className="review-summary-list">
                <span>Jumlah Item <strong>{cartItems.reduce((total, item) => total + item.quantity, 0)}</strong></span>
                <span>Subtotal <strong>{formatCurrency(subtotal)}</strong></span>
                <span>Total <strong>{formatCurrency(grandTotal)}</strong></span>
              </div>

              <div className="transaction-actions review-actions">
                <Button type="button" onClick={() => setStep('select')}>Kembali</Button>
                <Button className="primary-action" variant="primary" type="button" onClick={() => setStep('payment')}>
                  Pembayaran
                </Button>
              </div>
            </aside>
          </section>
        )}

        {step === 'payment' && (
          <section className="transaction-panel payment-panel">
            <div className="transaction-panel-header">
              <div>
                <p>Pembayaran</p>
                <h2>Pilih metode pembayaran</h2>
              </div>
            </div>

            <div className="payment-methods">
              {['Cash', 'QRIS', 'Debit'].map((method) => (
                <Button
                  className={paymentMethod === method ? 'selected' : ''}
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </Button>
              ))}
            </div>

            <label className="paid-input">
              Nominal dibayar
              <Input
                min="0"
                type="number"
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                placeholder={String(grandTotal)}
                disabled={paymentMethod !== 'Cash'}
              />
            </label>

            <div className="summary-box">
              <span>Total Tagihan <strong>{formatCurrency(grandTotal)}</strong></span>
              <span>Kembalian <strong>{formatCurrency(change)}</strong></span>
            </div>

            <div className="transaction-actions">
              <Button type="button" onClick={() => setStep('review')}>Kembali</Button>
              <Button
                className="primary-action"
                variant="primary"
                type="button"
                disabled={!canFinish}
                onClick={finishPayment}
              >
                Finish
              </Button>
            </div>
          </section>
        )}

      </section>
    </main>
  )
}
