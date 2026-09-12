import { useState } from 'react'
import type { FormEvent } from 'react'
import { Boxes, ImagePlus, Package, Search, Tags, Trash2, WalletCards } from 'lucide-react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { Select } from '../../component/select/Select'
import type { Product, ProductInput } from '../../types'

type ProductPageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
  products: Product[]
  onAddProduct: (product: ProductInput) => void
  onUpdateProduct: (productId: number, product: ProductInput) => void
  onDeleteProduct: (productId: number) => void
}

type ProductDetail = 'total-product' | 'category' | null

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
  onDeleteProduct,
}: ProductPageProps) {
  const [selectedDetail, setSelectedDetail] = useState<ProductDetail>(null)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Semua')
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    image: '',
  })

  const activeProducts = products.length
  const productCategories = Array.from(new Set(products.map((product) => product.category))).filter(Boolean)
  const totalCategories = productCategories.length
  const totalCatalogValue = products.reduce((total, product) => total + product.price, 0)
  const highestProduct = products.reduce<Product | null>(
    (currentHighest, product) =>
      !currentHighest || product.price > currentHighest.price ? product : currentHighest,
    null,
  )
  const lowestProduct = products.reduce<Product | null>(
    (currentLowest, product) =>
      !currentLowest || product.price < currentLowest.price ? product : currentLowest,
    null,
  )
  const availableCategories = Array.from(new Set([...categories, ...productCategories]))
  const categoryBreakdown = availableCategories.map((category) => {
    const categoryProducts = products.filter((product) => product.category === category)
    const categoryValue = categoryProducts.reduce((total, product) => total + product.price, 0)
    const categoryAverage = categoryProducts.length ? Math.round(categoryValue / categoryProducts.length) : 0
    const percentage = products.length ? Math.round((categoryProducts.length / products.length) * 100) : 0

    return {
      category,
      products: categoryProducts,
      total: categoryProducts.length,
      value: categoryValue,
      average: categoryAverage,
      percentage,
    }
  })
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(appliedSearch.toLowerCase())
    const matchesCategory = categoryFilter === 'Semua' || product.category === categoryFilter

    return matchesSearch && matchesCategory
  })
  const detailTitle = selectedDetail === 'category'
    ? 'Rincian Kategori'
    : 'Rincian Total Product'

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

  function handleDeleteProduct(product: Product) {
    const shouldDelete = window.confirm(`Hapus product "${product.name}"?`)
    if (!shouldDelete) return

    onDeleteProduct(product.id)
    if (editingProductId === product.id) handleCancelEdit()
  }

  function openCategoryDetail() {
    setSelectedDetail('category')
  }

  function applyCategoryFilter(category: string) {
    setCategoryFilter(category)
    setSelectedDetail(null)
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
    <main className="product-page app-shell">
      <Sidebar
        activePage="product"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
      />

      <section className="product-content content-shell">
        <PageHeader
          eyebrow="Product"
          title="Kelola data product"
          description="Tambah product baru serta kelola kategori, harga jual, dan gambar product."
          actions={<Button type="button" onClick={onDashboard}>Kembali</Button>}
        />

        <section className="product-stats mb-5 grid gap-3 md:grid-cols-2" aria-label="Ringkasan product">
          <button className="product-stat-card" type="button" onClick={() => setSelectedDetail('total-product')}>
            <span className="product-stat-icon grid h-12 w-12 place-items-center rounded-lg border border-teal-100 bg-teal-50 text-teal-700 shadow-sm shadow-teal-900/5 [&_svg]:h-5 [&_svg]:w-5">
              <Package aria-hidden="true" />
            </span>
            <div>
              <span>Total Product</span>
              <strong>{products.length}</strong>
            </div>
            <small>{activeProducts} product aktif</small>
          </button>

          <button className="product-stat-card" type="button" onClick={openCategoryDetail}>
            <span className="product-stat-icon grid h-12 w-12 place-items-center rounded-lg border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm shadow-cyan-900/5 [&_svg]:h-5 [&_svg]:w-5">
              <Tags aria-hidden="true" />
            </span>
            <div>
              <span>Kategori</span>
              <strong>{totalCategories}</strong>
            </div>
            <small>{categoryFilter === 'Semua' ? 'Semua kategori' : categoryFilter}</small>
          </button>

        </section>

        {selectedDetail ? (
          <section className="product-detail-page surface-panel">
            <div className="product-panel-header mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
              <div>
                <p>Rincian Product</p>
                <h2>
                  {detailTitle}
                </h2>
              </div>
              <Button type="button" onClick={() => setSelectedDetail(null)}>Kembali ke Product</Button>
            </div>

            {selectedDetail === 'total-product' && (
              <>
                <div className="detail-summary-grid inventory-summary-grid mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 [&_article]:grid [&_article]:gap-1 [&_article]:rounded-lg [&_article]:border [&_article]:border-slate-200 [&_article]:bg-slate-50 [&_article]:p-4 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-slate-500 [&_strong]:text-xl [&_strong]:font-black text-xs font-bold text-slate-500">
                  <article>
                    <span>Product Aktif</span>
                    <strong>{activeProducts}</strong>
                    <small>Total item yang siap dipakai transaksi</small>
                  </article>
                  <article>
                    <span>Nilai Katalog</span>
                    <strong>{formatCurrency(totalCatalogValue)}</strong>
                    <small>Akumulasi harga jual semua product</small>
                  </article>
                  <article>
                    <span>Harga Tertinggi</span>
                    <strong>{highestProduct ? formatCurrency(highestProduct.price) : '-'}</strong>
                    <small>{highestProduct?.name ?? 'Belum ada product'}</small>
                  </article>
                  <article>
                    <span>Harga Terendah</span>
                    <strong>{lowestProduct ? formatCurrency(lowestProduct.price) : '-'}</strong>
                    <small>{lowestProduct?.name ?? 'Belum ada product'}</small>
                  </article>
                </div>

                <div className="inventory-board mb-4 grid gap-3 md:grid-cols-2">
                  <section className="inventory-card grid grid-cols-[48px_minmax(0,1fr)] gap-3 surface-panel-muted">
                    <div className="inventory-card-icon grid h-12 w-12 place-items-center rounded-lg border border-teal-100 bg-teal-50 text-teal-700 [&_svg]:h-5 [&_svg]:w-5">
                      <Boxes aria-hidden="true" />
                    </div>
                    <div>
                      <span>Status Inventori</span>
                      <strong>{products.length > 0 ? 'Data product tersedia' : 'Belum ada data'}</strong>
                      <p>{products.length > 0 ? `${products.length} product sudah masuk katalog kasir.` : 'Tambahkan product dari form agar katalog bisa dipakai transaksi.'}</p>
                    </div>
                  </section>
                  <section className="inventory-card grid grid-cols-[48px_minmax(0,1fr)] gap-3 surface-panel-muted">
                    <div className="inventory-card-icon grid h-12 w-12 place-items-center rounded-lg border border-teal-100 bg-teal-50 text-teal-700 [&_svg]:h-5 [&_svg]:w-5">
                      <WalletCards aria-hidden="true" />
                    </div>
                    <div>
                      <span>Rentang Harga</span>
                      <strong>
                        {lowestProduct && highestProduct
                          ? `${formatCurrency(lowestProduct.price)} - ${formatCurrency(highestProduct.price)}`
                          : '-'}
                      </strong>
                      <p>Gunakan data ini untuk memeriksa product yang terlalu murah atau terlalu mahal.</p>
                    </div>
                  </section>
                </div>

                <div className="product-table detail-table inventory-table grid gap-3">
                  {products.length === 0 ? (
                    <div className="empty-product-state empty-state">Belum ada product. Tambahkan product manual dari form.</div>
                  ) : products.map((product) => (
                    <div className="product-table-row grid gap-3 data-row md:grid-cols-[minmax(200px,1fr)_110px_120px_114px] md:items-center" key={product.id}>
                      <div className="product-name-cell flex items-center gap-3 [&_img]:h-14 [&_img]:w-16 [&_img]:rounded-lg [&_img]:object-cover [&_span]:text-sm [&_span]:text-slate-500">
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
              </>
            )}

            {selectedDetail === 'category' && (
              <>
                <div className="detail-summary-grid mb-4 grid gap-3 md:grid-cols-2 [&_article]:grid [&_article]:gap-1 [&_article]:rounded-lg [&_article]:border [&_article]:border-slate-200 [&_article]:bg-slate-50 [&_article]:p-4 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-slate-500 [&_strong]:text-xl [&_strong]:font-black text-xs font-bold text-slate-500">
                  <article>
                    <span>Total Kategori</span>
                    <strong>{totalCategories}</strong>
                    <small>Kategori yang punya product</small>
                  </article>
                  <article>
                    <span>Product Tampil</span>
                    <strong>{filteredProducts.length}</strong>
                    <small>{categoryFilter === 'Semua' ? 'Belum ada filter kategori' : `Filter ${categoryFilter} aktif`}</small>
                  </article>
                </div>

                <div className="category-breakdown category-dashboard mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {categoryBreakdown.map((item) => (
                    <Button type="button" key={item.category} onClick={() => applyCategoryFilter(item.category)}>
                      <span>{item.category}</span>
                      <strong>{item.total} product</strong>
                      <small>{item.percentage}% dari katalog</small>
                      <div className="category-progress h-2 overflow-hidden rounded-full bg-slate-200 [&_i]:block [&_i]:h-full [&_i]:rounded-full [&_i]:bg-teal-700" aria-hidden="true">
                        <i style={{ width: `${item.percentage}%` }}></i>
                      </div>
                    </Button>
                  ))}
                </div>

                <div className="category-list-detail grid gap-3 md:grid-cols-2">
                  {categoryBreakdown.map((item) => (
                    <section className="category-detail-card grid gap-3 surface-panel-muted" key={item.category}>
                      <div className="category-detail-header flex items-start justify-between gap-3 border-b border-slate-100 pb-3 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-slate-500 [&_strong]:block [&_strong]:font-black [&_b]:text-right">
                        <div>
                          <span>{item.category}</span>
                          <strong>{item.total} product</strong>
                        </div>
                        <b>{formatCurrency(item.average)}</b>
                      </div>
                      <div className="category-mini-list grid gap-2 [&_div]:flex [&_div]:items-center [&_div]:justify-between [&_div]:gap-3 [&_span]:text-sm [&_span]:text-slate-500 [&_strong]:text-sm text-sm font-bold text-slate-500">
                        {item.products.length === 0 ? (
                          <small>Belum ada product di kategori ini.</small>
                        ) : item.products.slice(0, 3).map((product) => (
                          <div key={product.id}>
                            <span>{product.name}</span>
                            <strong>{formatCurrency(product.price)}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </>
            )}
          </section>
        ) : (
        <section className="product-grid-page grid items-start gap-5 xl:grid-cols-[minmax(340px,0.72fr)_minmax(520px,1.28fr)]">
          <article className="product-panel product-form-panel surface-panel xl:sticky xl:top-5">
            <div className="product-panel-header mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
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

            <form className="product-form-page grid gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-bold [&_label]:text-slate-600" onSubmit={handleSubmit}>
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

              <div className="product-form-row grid gap-3">
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

              <div className="image-preview grid min-h-24 grid-cols-[96px_minmax(0,1fr)] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 [&_img]:h-20 [&_img]:w-24 [&_img]:rounded-lg [&_img]:object-cover [&_div]:grid [&_div]:grid-cols-[22px_minmax(0,1fr)] [&_div]:items-center [&_div]:gap-2 [&_svg]:h-5 [&_svg]:w-5 [&_span]:text-sm [&_span]:font-semibold [&_span]:text-slate-500">
                <img src={form.image || '/product-images/snack-real.png'} alt="Preview product" />
                <div>
                  <ImagePlus aria-hidden="true" />
                  <span>{form.image ? 'Image siap digunakan' : 'Upload image agar product tampil lebih jelas'}</span>
                </div>
              </div>

              <Button className="product-primary" variant="primary" type="submit">
                {editingProductId ? 'Update Product' : 'Simpan Product'}
              </Button>
            </form>
          </article>

          <article className="product-panel product-list-panel surface-panel">
            <div className="product-panel-header mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
              <div>
                <p>Daftar Product</p>
                <h2>Product tersedia</h2>
              </div>
            </div>

            <form
              className="product-list-toolbar mb-4 grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 md:grid-cols-[minmax(220px,1fr)_180px_112px]"
              onSubmit={(event) => {
                event.preventDefault()
                setAppliedSearch(productSearch.trim())
              }}
            >
              <Input
                type="search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Cari nama product"
                aria-label="Cari nama product"
              />
              <Select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter kategori product"
              >
                <option value="Semua">Semua kategori</option>
                {categories.map((category) => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </Select>
              <Button variant="primary" type="submit">
                <Search aria-hidden="true" />
                Search
              </Button>
            </form>

            <div className="product-table grid gap-3">
              {filteredProducts.length > 0 && (
                <div className="product-table-head hidden grid-cols-[minmax(200px,1fr)_110px_120px_114px] gap-3 px-3 text-xs font-black uppercase text-slate-400 md:grid" aria-hidden="true">
                  <span>Product</span>
                  <span>Kategori</span>
                  <span>Harga</span>
                  <span>Aksi</span>
                </div>
              )}
              {filteredProducts.length === 0 ? (
                <div className="empty-product-state empty-state">
                  {products.length === 0
                    ? 'Belum ada product. Tambahkan product manual dari form.'
                    : 'Product tidak ditemukan pada pencarian atau kategori ini.'}
                </div>
              ) : filteredProducts.map((product) => (
                <div className="product-table-row grid gap-3 data-row md:grid-cols-[minmax(200px,1fr)_110px_120px_114px] md:items-center" key={product.id}>
                  <div className="product-name-cell flex items-center gap-3 [&_img]:h-14 [&_img]:w-16 [&_img]:rounded-lg [&_img]:object-cover [&_span]:text-sm [&_span]:text-slate-500">
                    <img src={product.image} alt={product.name} />
                    <div>
                      <strong>{product.name}</strong>
                    </div>
                  </div>
                  <span className="product-category w-fit rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{product.category}</span>
                  <strong>{formatCurrency(product.price)}</strong>
                  <div className="product-row-actions flex justify-start gap-2 md:justify-end">
                    <Button className="product-edit-button" type="button" onClick={() => handleEditProduct(product)}>
                      Edit
                    </Button>
                    <Button
                      className="product-delete-button"
                      variant="ghost"
                      size="small"
                      type="button"
                      aria-label={`Hapus ${product.name}`}
                      title={`Hapus ${product.name}`}
                      onClick={() => handleDeleteProduct(product)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
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
