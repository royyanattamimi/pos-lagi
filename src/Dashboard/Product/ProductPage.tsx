import { useState } from 'react'
import type { FormEvent } from 'react'
import './ProductPage.css'

type ProductPageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onLogout: () => void
}

type Product = {
  id: number
  name: string
  category: string
  stock: number
  price: number
  status: 'Aktif' | 'Stok Rendah'
  image: string
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Kopi Susu Botol',
    category: 'Minuman',
    stock: 24,
    price: 18000,
    status: 'Aktif',
    image: '/product-images/coffee-real.png',
  },
  {
    id: 2,
    name: 'Roti Gandum',
    category: 'Makanan',
    stock: 16,
    price: 22000,
    status: 'Stok Rendah',
    image: '/product-images/bread-real.png',
  },
  {
    id: 3,
    name: 'Beras Premium 5kg',
    category: 'Sembako',
    stock: 12,
    price: 78000,
    status: 'Stok Rendah',
    image: '/product-images/rice-real.png',
  },
  {
    id: 4,
    name: 'Teh Melati 350ml',
    category: 'Minuman',
    stock: 42,
    price: 7000,
    status: 'Aktif',
    image: '/product-images/tea-real.png',
  },
]

const categories = ['Makanan', 'Minuman', 'Sembako', 'Promo']

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
  return currency.format(value)
}

export function ProductPage({ onDashboard, onProduct, onTransaction, onLogout }: ProductPageProps) {
  const [products, setProducts] = useState(initialProducts)
  const [form, setForm] = useState({
    name: '',
    category: 'Makanan',
    stock: '',
    price: '',
  })

  const totalStock = products.reduce((total, product) => total + product.stock, 0)
  const lowStock = products.filter((product) => product.stock <= 20).length

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const stock = Number(form.stock)
    const price = Number(form.price)
    if (!form.name.trim() || stock < 0 || price <= 0) return

    setProducts((currentProducts) => [
      {
        id: Date.now(),
        name: form.name.trim(),
        category: form.category,
        stock,
        price,
        status: stock <= 20 ? 'Stok Rendah' : 'Aktif',
        image: '/product-images/snack-real.png',
      },
      ...currentProducts,
    ])
    setForm({ name: '', category: 'Makanan', stock: '', price: '' })
  }

  return (
    <main className="product-page">
      <aside className="product-sidebar">
        <div className="product-brand">
          <span>PL</span>
          <div>
            <strong>POS Lagi</strong>
            <small>Page Product</small>
          </div>
        </div>

        <nav className="product-nav" aria-label="Navigasi product">
          <button type="button" onClick={onDashboard}>Dashboard</button>
          <button className="active" type="button" onClick={onProduct}>Product</button>
          <button type="button" onClick={onTransaction}>Transaksi</button>
        </nav>

        <button className="product-logout" type="button" onClick={onLogout}>Logout</button>
      </aside>

      <section className="product-content">
        <header className="product-header">
          <div>
            <p>Product</p>
            <h1>Kelola data product</h1>
            <span>Tambah product baru, lihat stok, harga jual, dan status ketersediaan barang.</span>
          </div>
          <button type="button" onClick={onDashboard}>Kembali</button>
        </header>

        <section className="product-stats" aria-label="Ringkasan product">
          <article>
            <span>Total Product</span>
            <strong>{products.length}</strong>
          </article>
          <article>
            <span>Total Stok</span>
            <strong>{totalStock}</strong>
          </article>
          <article>
            <span>Stok Rendah</span>
            <strong>{lowStock}</strong>
          </article>
        </section>

        <section className="product-grid-page">
          <article className="product-panel">
            <div className="product-panel-header">
              <div>
                <p>Add Product</p>
                <h2>Tambah product baru</h2>
              </div>
            </div>

            <form className="product-form-page" onSubmit={handleSubmit}>
              <label>
                Nama Product
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Contoh: Gula 1kg"
                />
              </label>

              <label>
                Kategori
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <div className="product-form-row">
                <label>
                  Stok
                  <input
                    min="0"
                    type="number"
                    value={form.stock}
                    onChange={(event) => setForm({ ...form, stock: event.target.value })}
                    placeholder="0"
                  />
                </label>
                <label>
                  Harga
                  <input
                    min="1"
                    type="number"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    placeholder="25000"
                  />
                </label>
              </div>

              <button className="product-primary" type="submit">Simpan Product</button>
            </form>
          </article>

          <article className="product-panel">
            <div className="product-panel-header">
              <div>
                <p>Daftar Product</p>
                <h2>Product tersedia</h2>
              </div>
            </div>

            <div className="product-table">
              {products.map((product) => (
                <div className="product-table-row" key={product.id}>
                  <div className="product-name-cell">
                    <img src={product.image} alt={product.name} />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.category}</span>
                    </div>
                  </div>
                  <span>{product.stock} stok</span>
                  <strong>{formatCurrency(product.price)}</strong>
                  <em className={product.status === 'Stok Rendah' ? 'low' : ''}>{product.status}</em>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}
