import { useState } from 'react'
import type { FormEvent } from 'react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import type { Product, ProductInput } from '../../types'
import './ProductPage.css'

type ProductPageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
  products: Product[]
  onAddProduct: (product: ProductInput) => void
  onUpdateProduct: (productId: number, product: ProductInput) => void
}

type ProductDetail = 'total-product' | 'total-stock' | 'low-stock' | null

const categories = ['Makanan', 'Minuman', 'Sembako', 'Promo']

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
  return currency.format(value)
}

export function ProductPage({
  onDashboard,
  onProduct,
  onTransaction,
  onShift,
  onProfile,
  products,
  onAddProduct,
  onUpdateProduct,
}: ProductPageProps) {
  const [selectedDetail, setSelectedDetail] = useState<ProductDetail>(null)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: '',
    stock: '',
    price: '',
    image: '',
  })

  const totalStock = products.reduce((total, product) => total + product.stock, 0)
  const lowStock = products.filter((product) => product.stock <= 20).length
  const activeProducts = products.filter((product) => product.status === 'Aktif').length
  const totalCategories = new Set(products.map((product) => product.category)).size
  const lowStockItems = products
    .filter((product) => product.stock <= 20)
    .reduce((total, product) => total + product.stock, 0)
  const safeStock = products.filter((product) => product.stock > 20).length
  const categoryBreakdown = categories.map((category) => ({
    category,
    total: products.filter((product) => product.category === category).length,
    stock: products
      .filter((product) => product.category === category)
      .reduce((total, product) => total + product.stock, 0),
  }))
  const detailProducts =
    selectedDetail === 'low-stock'
      ? products.filter((product) => product.stock <= 20)
      : products

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const stock = Number(form.stock)
    const price = Number(form.price)
    if (!form.name.trim() || !form.category || stock < 0 || price <= 0) return

    const productInput = {
      name: form.name.trim(),
      category: form.category,
      stock,
      price,
      image: form.image || '/product-images/snack-real.png',
    }

    if (editingProductId) {
      onUpdateProduct(editingProductId, productInput)
    } else {
      onAddProduct(productInput)
    }

    setEditingProductId(null)
    setForm({ name: '', category: '', stock: '', price: '', image: '' })
  }

  function handleEditProduct(product: Product) {
    setSelectedDetail(null)
    setEditingProductId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      stock: String(product.stock),
      price: String(product.price),
      image: product.image,
    })
  }

  function handleCancelEdit() {
    setEditingProductId(null)
    setForm({ name: '', category: '', stock: '', price: '', image: '' })
  }

  function handleImageChange(file: File | undefined) {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm((currentForm) => ({
        ...currentForm,
        image: typeof reader.result === 'string' ? reader.result : '',
      }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <main className="product-page">
      <Sidebar
        activePage="product"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
      />

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
          <button type="button" onClick={() => setSelectedDetail('total-product')}>
            <span>Total Product</span>
            <strong>{products.length}</strong>
            <div className="stat-detail">
              <small>{activeProducts} product aktif</small>
              <small>{totalCategories} kategori tersedia</small>
            </div>
          </button>
          <button type="button" onClick={() => setSelectedDetail('total-stock')}>
            <span>Total Stok</span>
            <strong>{totalStock}</strong>
            <div className="stat-detail">
              <small>{safeStock} product stok aman</small>
              <small>{lowStockItems} item masuk stok rendah</small>
            </div>
          </button>
          <button type="button" onClick={() => setSelectedDetail('low-stock')}>
            <span>Stok Rendah</span>
            <strong>{lowStock}</strong>
            <div className="stat-detail">
              <small>Batas stok rendah: 20 item</small>
              <small>{products.length - lowStock} product masih aman</small>
            </div>
          </button>
        </section>

        {selectedDetail ? (
          <section className="product-detail-page">
            <div className="product-panel-header">
              <div>
                <p>Rincian Product</p>
                <h2>
                  {selectedDetail === 'total-product' && 'Rincian Total Product'}
                  {selectedDetail === 'total-stock' && 'Rincian Total Stok'}
                  {selectedDetail === 'low-stock' && 'Rincian Stok Rendah'}
                </h2>
              </div>
              <button type="button" onClick={() => setSelectedDetail(null)}>Kembali ke Product</button>
            </div>

            <div className="detail-summary-grid">
              {selectedDetail === 'total-product' && (
                <>
                  <article>
                    <span>Product Aktif</span>
                    <strong>{activeProducts}</strong>
                  </article>
                  <article>
                    <span>Kategori</span>
                    <strong>{totalCategories}</strong>
                  </article>
                  <article>
                    <span>Total Data</span>
                    <strong>{products.length}</strong>
                  </article>
                </>
              )}

              {selectedDetail === 'total-stock' && (
                <>
                  <article>
                    <span>Total Stok</span>
                    <strong>{totalStock}</strong>
                  </article>
                  <article>
                    <span>Stok Aman</span>
                    <strong>{safeStock}</strong>
                  </article>
                  <article>
                    <span>Item Stok Rendah</span>
                    <strong>{lowStockItems}</strong>
                  </article>
                </>
              )}

              {selectedDetail === 'low-stock' && (
                <>
                  <article>
                    <span>Product Stok Rendah</span>
                    <strong>{lowStock}</strong>
                  </article>
                  <article>
                    <span>Batas Minimum</span>
                    <strong>20</strong>
                  </article>
                  <article>
                    <span>Stok Aman</span>
                    <strong>{products.length - lowStock}</strong>
                  </article>
                </>
              )}
            </div>

            {selectedDetail !== 'low-stock' && (
              <div className="category-breakdown">
                {categoryBreakdown.map((item) => (
                  <article key={item.category}>
                    <span>{item.category}</span>
                    <strong>{item.total} product</strong>
                    <small>{item.stock} total stok</small>
                  </article>
                ))}
              </div>
            )}

            <div className="product-table detail-table">
              {detailProducts.map((product) => (
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
          </section>
        ) : (
        <section className="product-grid-page">
          <article className="product-panel">
            <div className="product-panel-header">
              <div>
                <p>Add Product</p>
                <h2>{editingProductId ? 'Edit product' : 'Tambah product baru'}</h2>
              </div>
              {editingProductId && (
                <button className="product-secondary" type="button" onClick={handleCancelEdit}>
                  Batal Edit
                </button>
              )}
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
                  <option value="">Pilih kategori</option>
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

              <label>
                Image Product
                <input
                  accept="image/*"
                  type="file"
                  onChange={(event) => handleImageChange(event.target.files?.[0])}
                />
              </label>

              <div className="image-preview">
                <img src={form.image || '/product-images/snack-real.png'} alt="Preview product" />
                <span>{form.image ? 'Image siap digunakan' : 'Upload image agar product tampil lebih jelas'}</span>
              </div>

              <button className="product-primary" type="submit">
                {editingProductId ? 'Update Product' : 'Simpan Product'}
              </button>
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
              {products.length === 0 ? (
                <div className="empty-product-state">Belum ada product. Tambahkan product manual dari form.</div>
              ) : products.map((product) => (
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
                  <button className="product-edit-button" type="button" onClick={() => handleEditProduct(product)}>
                    Edit
                  </button>
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
