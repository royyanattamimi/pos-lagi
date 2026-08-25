import { useMemo, useState } from 'react'
import './TransactionPage.css'

type TransactionPageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onLogout: () => void
}

type Step = 'select' | 'review' | 'payment' | 'finish'

type Product = {
  id: number
  name: string
  category: string
  price: number
  stock: number
  image: string
}

type CartItem = {
  productId: number
  quantity: number
}

const products: Product[] = [
  {
    id: 1,
    name: 'Kopi Susu Botol',
    category: 'Minuman',
    price: 18000,
    stock: 24,
    image: '/product-images/coffee-real.png',
  },
  {
    id: 2,
    name: 'Roti Gandum',
    category: 'Makanan',
    price: 22000,
    stock: 16,
    image: '/product-images/bread-real.png',
  },
  {
    id: 3,
    name: 'Beras Premium 5kg',
    category: 'Sembako',
    price: 78000,
    stock: 12,
    image: '/product-images/rice-real.png',
  },
  {
    id: 4,
    name: 'Teh Melati 350ml',
    category: 'Minuman',
    price: 7000,
    stock: 42,
    image: '/product-images/tea-real.png',
  },
  {
    id: 5,
    name: 'Paket Snack Hemat',
    category: 'Promo',
    price: 29500,
    stock: 18,
    image: '/product-images/snack-real.png',
  },
]

const categories = ['Semua', 'Makanan', 'Minuman', 'Sembako', 'Promo']
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

export function TransactionPage({ onDashboard, onProduct, onTransaction, onLogout }: TransactionPageProps) {
  const [step, setStep] = useState<Step>('select')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paidAmount, setPaidAmount] = useState('')

  const cartItems = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((currentProduct) => currentProduct.id === item.productId)
          return product ? { ...item, product, total: product.price * item.quantity } : null
        })
        .filter((item): item is CartItem & { product: Product; total: number } => Boolean(item)),
    [cart],
  )

  const subtotal = cartItems.reduce((total, item) => total + item.total, 0)
  const tax = Math.round(subtotal * 0.1)
  const grandTotal = subtotal + tax
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
      if (existingItem.quantity >= product.stock) return currentCart

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

    const product = products.find((currentProduct) => currentProduct.id === productId)
    const nextQuantity = Math.min(quantity, product?.stock ?? quantity)
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId ? { ...item, quantity: nextQuantity } : item,
      ),
    )
  }

  function resetTransaction() {
    setStep('select')
    setSelectedCategory('Semua')
    setCart([])
    setPaymentMethod('Cash')
    setPaidAmount('')
  }

  return (
    <main className="transaction-page">
      <aside className="transaction-sidebar">
        <div className="transaction-brand">
          <span>PL</span>
          <div>
            <strong>POS Lagi</strong>
            <small>Page Transaksi</small>
          </div>
        </div>

        <nav className="transaction-nav" aria-label="Navigasi transaksi">
          <button type="button" onClick={onDashboard}>Dashboard</button>
          <button type="button" onClick={onProduct}>Product</button>
          <button className="active" type="button" onClick={onTransaction}>Transaksi</button>
        </nav>

        <button className="transaction-logout" type="button" onClick={onLogout}>Logout</button>
      </aside>

      <section className="transaction-content">
        <header className="transaction-header">
          <div>
            <p>Transaksi</p>
            <h1>Buat transaksi baru</h1>
            <span>Pilih product, review pesanan, proses pembayaran, lalu selesaikan transaksi.</span>
          </div>
          <button type="button" onClick={resetTransaction}>Reset</button>
        </header>

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
                  <button
                    className={selectedCategory === category ? 'selected' : ''}
                    type="button"
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="product-catalog">
                {filteredProducts.map((product) => (
                  <button
                    className="catalog-item"
                    type="button"
                    key={product.id}
                    onClick={() => addProduct(product)}
                  >
                    <img src={product.image} alt={product.name} />
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
                    <b>{formatCurrency(product.price)}</b>
                    <small>{product.stock} stok</small>
                  </button>
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
                      <span>{item.product.name}</span>
                      <strong>{item.quantity}x</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="summary-box">
                <span>Subtotal <strong>{formatCurrency(subtotal)}</strong></span>
              </div>

              <button
                className="primary-action"
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => setStep('review')}
              >
                Review Pesanan
              </button>
            </aside>
          </section>
        )}

        {step === 'review' && (
          <section className="transaction-panel">
            <div className="transaction-panel-header">
              <div>
                <p>Review Pesanan</p>
                <h2>Cek product sebelum pembayaran</h2>
              </div>
            </div>

            <div className="cart-table">
              {cartItems.map((item) => (
                <div className="cart-table-row" key={item.productId}>
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{formatCurrency(item.product.price)} per item</span>
                  </div>
                  <div className="quantity-control">
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                      -
                    </button>
                    <strong>{item.quantity}</strong>
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <b>{formatCurrency(item.total)}</b>
                </div>
              ))}
            </div>

            <div className="summary-box">
              <span>Subtotal <strong>{formatCurrency(subtotal)}</strong></span>
              <span>PPN 10% <strong>{formatCurrency(tax)}</strong></span>
              <span>Total <strong>{formatCurrency(grandTotal)}</strong></span>
            </div>

            <div className="transaction-actions">
              <button type="button" onClick={() => setStep('select')}>Kembali</button>
              <button className="primary-action" type="button" onClick={() => setStep('payment')}>
                Pembayaran
              </button>
            </div>
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
                <button
                  className={paymentMethod === method ? 'selected' : ''}
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>

            <label className="paid-input">
              Nominal dibayar
              <input
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
              <button type="button" onClick={() => setStep('review')}>Kembali</button>
              <button
                className="primary-action"
                type="button"
                disabled={!canFinish}
                onClick={() => setStep('finish')}
              >
                Finish
              </button>
            </div>
          </section>
        )}

        {step === 'finish' && (
          <section className="transaction-panel finish-panel">
            <p>Transaksi Selesai</p>
            <h2>#POS-1050</h2>
            <span>{cartItems.reduce((total, item) => total + item.quantity, 0)} item berhasil dibayar.</span>
            <strong>{formatCurrency(grandTotal)}</strong>
            <div className="transaction-actions">
              <button type="button" onClick={onDashboard}>Kembali ke Dashboard</button>
              <button className="primary-action" type="button" onClick={resetTransaction}>
                Transaksi Baru
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
