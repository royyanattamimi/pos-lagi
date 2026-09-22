import { useMemo, useState } from 'react'
import { Minus, Plus, ArrowLeft, ArrowRight, Check, Search } from 'lucide-react'
import { ProductImage } from '../../component/product/ProductImage'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { ItemNote } from './ItemNote'
import { ReceiptPage } from './receipt/ReceiptPage'
import type { Product, ShiftSession, TransactionItem, TransactionRecord } from '../../types'

type TransactionPageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onPaidTransactions: () => void
  onShift: () => void
  onProfile: () => void
  products: Product[]
  currentShift: ShiftSession | null
  onCompleteTransaction: (transaction: TransactionRecord) => void
}

type Step = 'select' | 'review' | 'payment' | 'finish'

type CartItem = {
  note?: string
  productId: number
  quantity: number
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
  onPaidTransactions,
  onShift,
  onProfile,
  products,
  currentShift,
  onCompleteTransaction,
}: TransactionPageProps) {
  const [step, setStep] = useState<Step>('select')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
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
  const change = paymentMethod === 'Cash' ? Math.max(paid - grandTotal, 0) : 0
  const canFinish = paymentMethod !== 'Cash' || paid >= grandTotal
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('id-ID')
  const filteredProducts = products.filter((product) =>
    (selectedCategory === 'Semua' || product.category === selectedCategory) &&
    (!normalizedQuery || `${product.name} ${product.category}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)),
  )

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

  function updateNote(productId: number, note: string) {
    setCart((currentCart) => currentCart.map((item) =>
      item.productId === productId ? { ...item, note } : item,
    ))
  }

  function resetTransaction() {
    setStep('select')
    setSelectedCategory('Semua')
    setSearchInput('')
    setSearchQuery('')
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
      note: item.note?.trim() || undefined,
    }))
    const createdAt = new Date().toISOString()
    const transaction: TransactionRecord = {
      id: `#POS-${createdAt.replace(/\D/g, '').slice(0, 14)}-${crypto.randomUUID().slice(0, 8)}`,
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
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={resetTransaction} onPaidTransactions={onPaidTransactions}
        onShift={onShift}
        onProfile={onProfile}
      />
    )
  }

  return (
    <main className={`transaction-page app-shell ${step === 'select' ? 'transaction-select-page' : ''} ${step === 'review' ? 'transaction-review-page' : ''}`}>
      <Sidebar
        activePage="transaction"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction} onPaidTransactions={onPaidTransactions}
        onShift={onShift}
        onProfile={onProfile}
      />

      <section className="transaction-content content-shell">
        <PageHeader
          eyebrow="Transaksi"
          title="Buat transaksi baru"
          description="Pilih product, review pesanan, proses pembayaran, lalu selesaikan transaksi."
          actions={step !== 'select' ? (
            <Button onClick={() => setStep(step === 'payment' ? 'review' : 'select')}>
              <ArrowLeft aria-hidden="true" /> Kembali
            </Button>
          ) : undefined}
        />

        {step === 'select' && (
          <section className="transaction-grid transaction-layout">
            <article className="transaction-panel surface-panel">
              <div className="transaction-panel-header mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
                <div>
                  <p>Product</p>
                  <h2>Pilih product</h2>
                </div>
              </div>

              <form
                role="search"
                aria-label="Cari produk transaksi"
                className="mb-4 flex flex-wrap gap-2"
                onSubmit={(event) => { event.preventDefault(); setSearchQuery(searchInput) }}
              >
                <Input
                  className="min-w-0 flex-1 basis-48"
                  type="search"
                  aria-label="Nama atau kategori produk"
                  placeholder="Cari nama atau kategori produk..."
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value)
                    if (!event.target.value) setSearchQuery('')
                  }}
                />
                <Button variant="primary" type="submit"><Search aria-hidden="true" /> Cari</Button>
                {(searchInput || searchQuery) && (
                  <Button onClick={() => { setSearchInput(''); setSearchQuery('') }}>Hapus pencarian</Button>
                )}
              </form>
              {normalizedQuery && <p className="mb-3 text-sm text-slate-500" role="status">{filteredProducts.length} produk ditemukan untuk “{searchQuery.trim()}”.</p>}

              <div className="category-list mb-4 flex flex-wrap gap-2 [&_.selected]:bg-slate-950 [&_.selected]:text-white">
                {categories.map((category) => (
                  <Button
                    className={selectedCategory === category ? 'selected' : ''}
                    aria-pressed={selectedCategory === category}
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
                ) : filteredProducts.length === 0 ? (
                  <div className="empty-state sm:col-span-2 xl:col-span-3">Produk tidak ditemukan. Coba kata kunci lain atau pilih kategori Semua.</div>
                ) : filteredProducts.map((product) => (
                  <Button
                    className="catalog-item grid min-h-52 content-start justify-items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-teal-300 [&_img]:h-28 [&_img]:w-full [&_img]:rounded-lg [&_img]:object-cover [&_span]:text-sm [&_span]:text-slate-500 [&_b]:text-teal-700"
                    type="button"
                    key={product.id}
                    onClick={() => addProduct(product)}
                  >
                    <ProductImage src={product.image} name={product.name} category={product.category} />
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
                    <b>{formatCurrency(product.price)}</b>
                  </Button>
                ))}
              </div>
            </article>

            <aside aria-label="Keranjang pesanan" className="transaction-panel order-panel surface-panel">
              <div className="transaction-panel-header mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
                <div>
                  <h2>Pesanan</h2>
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
                        <Button type="button" aria-label={`Kurangi ${item.product.name}`} title={`Kurangi ${item.product.name}`} onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                          <Minus aria-hidden="true" />
                        </Button>
                        <Input
                          min="1"
                          type="number"
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                          aria-label={`Jumlah ${item.product.name}`}
                        />
                        <Button type="button" aria-label={`Tambah ${item.product.name}`} title={`Tambah ${item.product.name}`} onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                          <Plus aria-hidden="true" />
                        </Button>
                      </div>
                      <ItemNote name={item.product.name} value={item.note ?? ''} onChange={(note) => updateNote(item.productId, note)} />
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
                Review Pesanan <ArrowRight aria-hidden="true" />
              </Button>
            </aside>
          </section>
        )}

        {step === 'review' && (
          <section className="review-layout transaction-layout">
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
                      <ProductImage src={item.product.image} name={item.product.name} category={item.product.category} />
                      <div>
                        <strong>{item.product.name}</strong>
                        <span>{item.product.category}</span>
                        <small>{formatCurrency(item.product.price)} per item</small>
                        <ItemNote name={item.product.name} value={item.note ?? ''} onChange={(note) => updateNote(item.productId, note)} />
                      </div>
                    </div>
                    <div className="quantity-control grid grid-cols-[36px_1fr_36px] items-center gap-2 text-center">
                      <Button type="button" aria-label={`Kurangi ${item.product.name}`} title={`Kurangi ${item.product.name}`} onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                        <Minus aria-hidden="true" />
                      </Button>
                      <strong>{item.quantity}</strong>
                      <Button type="button" aria-label={`Tambah ${item.product.name}`} title={`Tambah ${item.product.name}`} onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                        <Plus aria-hidden="true" />
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
                <Button className="primary-action checkout-action" variant="primary" size="large" type="button" onClick={() => setStep('payment')}>
                  <span>Lanjut ke pembayaran</span> <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </aside>
          </section>
        )}

        {step === 'payment' && (
          <section className="payment-layout transaction-layout">
            <article className="transaction-panel payment-panel surface-panel">
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
                  aria-pressed={paymentMethod === method}
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </Button>
              ))}
            </div>

            <div className="paid-input grid gap-2">
              <label htmlFor="paid-amount" className="text-sm font-bold text-slate-600">
                Nominal dibayar (Rupiah)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-bold text-slate-600" aria-hidden="true">Rp</span>
                <Input
                  id="paid-amount"
                  className="pl-11 text-lg font-semibold tabular-nums"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={paymentMethod === 'Cash'
                    ? (paidAmount === '' ? '' : Number(paidAmount).toLocaleString('id-ID'))
                    : grandTotal.toLocaleString('id-ID')}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/[^0-9]/g, '')
                    if (digits.length <= 15) setPaidAmount(digits)
                  }}
                  placeholder="Contoh: 50.000"
                  disabled={paymentMethod !== 'Cash'}
                  aria-describedby="paid-amount-help paid-amount-detail"
                />
              </div>
              <p id="paid-amount-help" className="text-xs text-slate-500">
                {paymentMethod === 'Cash'
                  ? 'Masukkan uang tunai yang diterima dari pelanggan. Contoh: 50.000 = lima puluh ribu rupiah.'
                  : `Pembayaran ${paymentMethod} mengikuti total tagihan secara otomatis.`}
              </p>
              <p id="paid-amount-detail" className="text-sm font-medium text-slate-700" aria-live="polite">
                {paymentMethod !== 'Cash'
                  ? `Nominal pembayaran: ${formatCurrency(grandTotal)}.`
                  : paidAmount === ''
                    ? `Total yang harus dibayar: ${formatCurrency(grandTotal)}.`
                    : paid < grandTotal
                      ? `Uang diterima ${formatCurrency(paid)}. Masih kurang ${formatCurrency(grandTotal - paid)}.`
                      : paid === grandTotal
                        ? `Uang diterima ${formatCurrency(paid)}. Pembayaran pas, tanpa kembalian.`
                        : `Uang diterima ${formatCurrency(paid)}. Kembalian ${formatCurrency(change)}.`}
              </p>
            </div>

            </article>
            <aside className="transaction-panel payment-summary-panel surface-panel">
              <div className="transaction-panel-header mb-4 border-b border-slate-100 pb-4">
                <p className="mb-1 text-xs font-black uppercase text-teal-700">Ringkasan</p>
                <h2 className="m-0 text-xl font-black">Total pembayaran</h2>
              </div>

            <div className="summary-box my-4 grid gap-2 rounded-lg bg-slate-50 p-4 [&_span]:flex [&_span]:items-center [&_span]:justify-between [&_strong]:text-slate-950">
              <span>Total Tagihan <strong>{formatCurrency(grandTotal)}</strong></span>
              <span>Nominal Dibayar <strong>{formatCurrency(paymentMethod === 'Cash' ? paid : grandTotal)}</strong></span>
              <span>Kembalian <strong>{formatCurrency(change)}</strong></span>
            </div>

            <div className="transaction-actions mt-4 flex gap-2">
              <Button
                className="primary-action checkout-action"
                variant="primary"
                size="large"
                type="button"
                disabled={!canFinish}
                onClick={finishPayment}
              >
                <Check aria-hidden="true" /> Selesaikan transaksi
              </Button>
            </div>
            </aside>
          </section>
        )}

      </section>
    </main>
  )
}
