import { useState } from 'react'
import { ArrowLeft, Package, Settings2 } from 'lucide-react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { Select } from '../../component/select/Select'
import { ProductImage } from '../../component/product/ProductImage'
import type { Product } from '../../types'

type ActiveProductsPageProps = {
  products: Product[]
  profileName?: string
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
}

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export function ActiveProductsPage({ products, profileName, onDashboard, onProduct, onTransaction, onShift, onProfile }: ActiveProductsPageProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('name')
  const categories = [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b, 'id'))
  const filtered = products.filter((product) =>
    (!category || product.category === category) && product.name.toLocaleLowerCase('id').includes(query.trim().toLocaleLowerCase('id')),
  ).sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : a.name.localeCompare(b.name, 'id'))
  const average = products.length ? products.reduce((sum, product) => sum + product.price, 0) / products.length : 0

  return (
    <main className="active-products-page app-shell">
      <Sidebar activePage="product" onDashboard={onDashboard} onProduct={onProduct} onTransaction={onTransaction} onShift={onShift} onProfile={onProfile} profileName={profileName} />
      <section className="content-shell">
        <PageHeader eyebrow="Katalog" title="Produk aktif" actions={<>
          <Button size="small" onClick={onDashboard}><ArrowLeft aria-hidden="true" />Kembali</Button>
          <Button size="small" variant="primary" onClick={onProduct}><Settings2 aria-hidden="true" />Kelola produk</Button>
        </>} />
        <dl className="mb-6 grid gap-4 sm:grid-cols-3" aria-label="Ringkasan produk aktif">
          {[['Produk aktif', products.length], ['Kategori', categories.length], ['Rata-rata harga', products.length ? currency.format(average) : '-']].map(([label, value]) => (
            <div key={label} className="min-w-0 border-l-2 border-emerald-600 py-2 pl-4">
              <dt className="text-xs text-slate-500">{label}</dt><dd className="mt-2 break-words text-2xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mb-5 grid gap-3 border-y border-slate-200 py-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="field-label">Cari produk<Input type="search" placeholder="Nama produk" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label className="field-label">Kategori<Select aria-label="Kategori" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Semua kategori</option>{categories.map((name) => <option key={name} value={name}>{name || 'Tanpa kategori'}</option>)}</Select></label>
          <label className="field-label">Urutkan<Select aria-label="Urutkan" value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Nama A-Z</option><option value="price-low">Harga terendah</option><option value="price-high">Harga tertinggi</option></Select></label>
        </div>
        <p className="mb-4 text-xs text-slate-500" role="status">{filtered.length} dari {products.length} produk</p>
        {filtered.length ? <div className="saved-product-grid">
          {filtered.map((product) => <article className="saved-product-card" key={product.id}>
            <div className="saved-product-photo"><ProductImage src={product.image} name={product.name} category={product.category} /></div>
            <div className="saved-product-info">
              <span className="text-xs text-slate-500">{product.category || 'Tanpa kategori'}</span>
              <h3 className="font-semibold">{product.name}</h3>
              <strong className="text-lg text-emerald-700">{currency.format(product.price)}</strong>
            </div>
          </article>)}
        </div> : <div className="empty-state grid justify-items-center gap-3 py-10 text-center">
          <Package size={28} aria-hidden="true" /><strong>{products.length ? 'Produk tidak ditemukan' : 'Belum ada produk aktif'}</strong>
          {products.length ? <Button size="small" onClick={() => { setQuery(''); setCategory(''); setSort('name') }}>Reset filter</Button> : <Button size="small" variant="primary" onClick={onProduct}>Tambah produk</Button>}
        </div>}
      </section>
    </main>
  )
}
