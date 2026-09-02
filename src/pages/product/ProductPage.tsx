import { useState } from 'react'
import type { FormEvent } from 'react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { Select } from '../../component/select/Select'
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

type ProductDetail = 'total-product' | null

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
    price: '',
    image: '',
  })

  const activeProducts = products.length
  const totalCategories = new Set(products.map((product) => product.category)).size
  const categoryBreakdown = categories.map((category) => ({
    category,
    total: products.filter((product) => product.category === category).length,
  }))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const price = Number(form.price)
    if (!form.name.trim() || !form.category || price <= 0) return

    const productInput = {
      name: form.name.trim(),
      category: form.category,
      price,
      image: form.image || '/product-images/snack-real.png',
    }

    if (editingProductId) {
      onUpdateProduct(editingProductId, productInput)
    } else {
      onAddProduct(productInput)
    }

    setEditingProductId(null)
    setForm({ name: '', category: '', price: '', image: '' })
  }

  function handleEditProduct(product: Product) {
    setSelectedDetail(null)
    setEditingProductId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      image: product.image,
    })
  }

  function handleCancelEdit() {
    setEditingProductId(null)
    setForm({ name: '', category: '', price: '', image: '' })
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
        <PageHeader
          eyebrow="Product"
          title="Kelola data product"
          description="Tambah product baru serta kelola kategori, harga jual, dan gambar product."
          actions={<Button type="button" onClick={onDashboard}>Kembali</Button>}
        />

        <section className="product-stats" aria-label="Ringkasan product">
          <Button type="button" onClick={() => setSelectedDetail('total-product')}>
            <span>Total Product</span>
            <strong>{products.length}</strong>
            <div className="stat-detail">
              <small>{activeProducts} product aktif</small>
              <small>{totalCategories} kategori tersedia</small>
            </div>
          </Button>
        </section>

        {selectedDetail ? (
          <section className="product-detail-page">
            <div className="product-panel-header">
              <div>
                <p>Rincian Product</p>
                <h2>
                  Rincian Total Product
                </h2>
              </div>
              <Button type="button" onClick={() => setSelectedDetail(null)}>Kembali ke Product</Button>
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

            </div>

            <div className="category-breakdown">
              {categoryBreakdown.map((item) => (
                <article key={item.category}>
                  <span>{item.category}</span>
                  <strong>{item.total} product</strong>
                </article>
              ))}
            </div>

            <div className="product-table detail-table">
              {products.map((product) => (
                <div className="product-table-row" key={product.id}>
                  <div className="product-name-cell">
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
          </section>
        ) : (
        <section className="product-grid-page">
          <article className="product-panel product-form-panel">
            <div className="product-panel-header">
              <div>
                <p>Add Product</p>
                <h2>{editingProductId ? 'Edit product' : 'Tambah product baru'}</h2>
              </div>
              {editingProductId && (
                <Button className="product-secondary" type="button" onClick={handleCancelEdit}>
                  Batal Edit
                </Button>
              )}
            </div>

            <form className="product-form-page" onSubmit={handleSubmit}>
              <label>
                Nama Product
                <Input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Contoh: Gula 1kg"
                />
              </label>

              <label>
                Kategori
                <Select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </Select>
              </label>

              <div className="product-form-row">
                <label>
                  Harga
                  <Input
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
                <Input
                  accept="image/*"
                  type="file"
                  onChange={(event) => handleImageChange(event.target.files?.[0])}
                />
              </label>

              <div className="image-preview">
                <img src={form.image || '/product-images/snack-real.png'} alt="Preview product" />
                <span>{form.image ? 'Image siap digunakan' : 'Upload image agar product tampil lebih jelas'}</span>
              </div>

              <Button className="product-primary" variant="primary" type="submit">
                {editingProductId ? 'Update Product' : 'Simpan Product'}
              </Button>
            </form>
          </article>

          <article className="product-panel product-list-panel">
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
                  <strong>{formatCurrency(product.price)}</strong>
                  <Button className="product-edit-button" type="button" onClick={() => handleEditProduct(product)}>
                    Edit
                  </Button>
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
