import { useMemo, useState } from 'react'
import { History } from 'lucide-react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { ReceiptPage } from './receipt/ReceiptPage'
import type { Product, ShiftSession, TransactionItem, TransactionRecord } from '../../types'

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
    <main className="transaction-page app-shell">
      <Sidebar
        activePage="transaction"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
      />

      <section className="transaction-content content-shell">
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

        <section className="transaction-stepper mb-5 grid gap-2 md:grid-cols-4 [&_span]:rounded-lg [&_span]:border [&_span]:border-slate-200 [&_span]:bg-white [&_span]:px-3 [&_span]:py-2 [&_span]:text-sm [&_span]:font-extrabold [&_span]:text-slate-500 [&_.done]:border-teal-200 [&_.done]:bg-teal-50 [&_.done]:text-teal-800" aria-label="Flow transaksi">
          {steps.map((currentStep, index) => (
            <span className={steps.indexOf(step) >= index ? 'done' : ''} key={currentStep}>
              {index + 1}. {stepLabel[currentStep]}
            </span>
          ))}
        </section>

        {step === 'select' && (
          <section className="transaction-grid grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <article className="transaction-panel surface-panel">
              <div className="transaction-panel-header mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
                <div>
                  <p>Product</p>
                  <h2>Pilih product</h2>
                </div>
              </div>

              <div className="category-list mb-4 flex flex-wrap gap-2 [&_.selected]:bg-slate-950 [&_.selected]:text-white">
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

              <div className="product-catalog grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {products.length === 0 ? (
                  <div className="empty-order empty-state">Belum ada product. Input product manual dulu di halaman Product.</div>
                ) : filteredProducts.map((product) => (
                  <Button
                    className="catalog-item grid min-h-52 content-start justify-items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-teal-300 [&_img]:h-28 [&_img]:w-full [&_img]:rounded-lg [&_img]:object-cover [&_span]:text-sm [&_span]:text-slate-500 [&_b]:text-teal-700"
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

            <aside className="transaction-panel order-panel surface-panel xl:sticky xl:top-5">
              <div className="transaction-panel-header mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
                <div>
                  <p>Keranjang</p>
                  <h2>Pesanan berjalan</h2>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <div className="empty-order empty-state">Belum ada product dipilih.</div>
              ) : (
                <div className="mini-cart grid gap-3">
                  {cartItems.map((item) => (
                    <div className="mini-cart-row grid gap-2 rounded-lg border border-slate-100 p-3" key={item.productId}>
                      <div className="mini-cart-info grid gap-1 [&_span]:text-sm [&_span]:text-slate-500">
                        <strong>{item.product.name}</strong>
                        <span>{formatCurrency(item.product.price)} per item</span>
                      </div>
                      <div className="mini-cart-control grid grid-cols-[36px_1fr_36px] gap-2">
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

              <div className="summary-box my-4 grid gap-2 rounded-lg bg-slate-50 p-4 [&_span]:flex [&_span]:items-center [&_span]:justify-between [&_strong]:text-slate-950">
                <span>Subtotal <strong>{formatCurrency(subtotal)}</strong></span>
              </div>

              <Button
                className="primary-action w-full"
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
          <section className="review-layout grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <article className="transaction-panel review-items-panel surface-panel">
              <div className="transaction-panel-header mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
                <div>
                  <p>Review Pesanan</p>
                  <h2>Cek product sebelum pembayaran</h2>
                </div>
                <strong className="review-item-count rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">{cartItems.length} product</strong>
              </div>

              <div className="cart-table grid gap-3">
                {cartItems.map((item) => (
                  <div className="cart-table-row grid gap-3 rounded-lg border border-slate-100 p-3 md:grid-cols-[1fr_120px_120px] md:items-center" key={item.productId}>
                    <div className="review-product-cell flex items-center gap-3 [&_img]:h-14 [&_img]:w-16 [&_img]:rounded-lg [&_img]:object-cover [&_span]:block [&_span]:text-sm [&_span]:text-slate-500 [&_small]:text-xs [&_small]:text-slate-500">
                      <img src={item.product.image} alt={item.product.name} />
                      <div>
                        <strong>{item.product.name}</strong>
                        <span>{item.product.category}</span>
                        <small>{formatCurrency(item.product.price)} per item</small>
                      </div>
                    </div>
                    <div className="quantity-control grid grid-cols-[36px_1fr_36px] items-center gap-2 text-center">
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

            <aside className="transaction-panel review-summary-panel surface-panel">
              <div className="transaction-panel-header mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
                <div>
                  <p>Ringkasan</p>
                  <h2>Total pesanan</h2>
                </div>
              </div>

              <div className="review-summary-list grid gap-3 rounded-lg bg-slate-50 p-4 [&_span]:flex [&_span]:justify-between [&_strong]:text-slate-950">
                <span>Jumlah Item <strong>{cartItems.reduce((total, item) => total + item.quantity, 0)}</strong></span>
                <span>Subtotal <strong>{formatCurrency(subtotal)}</strong></span>
                <span>Total <strong>{formatCurrency(grandTotal)}</strong></span>
              </div>

              <div className="transaction-actions review-actions mt-4 flex gap-2">
                <Button type="button" onClick={() => setStep('select')}>Kembali</Button>
                <Button className="primary-action w-full" variant="primary" type="button" onClick={() => setStep('payment')}>
                  Pembayaran
                </Button>
              </div>
            </aside>
          </section>
        )}

        {step === 'payment' && (
          <section className="transaction-panel payment-panel surface-panel">
            <div className="transaction-panel-header mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
              <div>
                <p>Pembayaran</p>
                <h2>Pilih metode pembayaran</h2>
              </div>
            </div>

            <div className="payment-methods mb-4 flex flex-wrap gap-2 [&_.selected]:bg-slate-950 [&_.selected]:text-white">
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

            <label className="paid-input grid gap-2 text-sm font-bold text-slate-600">
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

            <div className="summary-box my-4 grid gap-2 rounded-lg bg-slate-50 p-4 [&_span]:flex [&_span]:items-center [&_span]:justify-between [&_strong]:text-slate-950">
              <span>Total Tagihan <strong>{formatCurrency(grandTotal)}</strong></span>
              <span>Kembalian <strong>{formatCurrency(change)}</strong></span>
            </div>

            <div className="transaction-actions mt-4 flex gap-2">
              <Button type="button" onClick={() => setStep('review')}>Kembali</Button>
              <Button
                className="primary-action w-full"
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
