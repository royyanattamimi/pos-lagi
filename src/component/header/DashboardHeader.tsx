import { useEffect, useState } from 'react'
import type { Product, TransactionRecord } from '../../types'
import { Button } from '../button/Button'
import { Input } from '../input/Input'

type DashboardHeaderProps = {
  products: Product[]
  transactions: TransactionRecord[]
  onOpenProduct: () => void
  onOpenTransaction: (transaction: TransactionRecord) => void
}

export function DashboardHeader({
  products,
  transactions,
  onOpenProduct,
  onOpenTransaction,
}: DashboardHeaderProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const formattedDate = currentDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = currentDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDate(new Date()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const productResults = normalizedQuery
    ? products.filter((product) =>
        [product.name, product.category].some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
    : []
  const transactionResults = normalizedQuery
    ? transactions.filter((transaction) =>
        [transaction.id, transaction.cashier, transaction.paymentMethod].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      )
    : []
  const hasResults = productResults.length > 0 || transactionResults.length > 0

  return (
    <header className="dashboard-header mb-5" id="dashboard">
      <div className="dashboard-header-actions flex items-start justify-between gap-4 max-md:flex-col">
        <div className="dashboard-search-area relative">
          <div className="dashboard-search-buttons flex gap-2" aria-label="Pencarian cepat">
            <Button type="button" onClick={() => setIsSearchOpen((currentValue) => !currentValue)}>
              Search Product & Transaksi
            </Button>
          </div>

          {isSearchOpen && (
            <div className="dashboard-search-panel absolute z-20 mt-2 w-[min(420px,calc(100vw-40px))] rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari product atau transaksi"
              />

              <div className="dashboard-search-results mt-3 grid gap-2 [&_span]:text-sm [&_span]:font-bold [&_span]:text-slate-500 [&_button]:justify-start [&_button]:text-left [&_small]:block [&_small]:text-xs [&_small]:text-slate-500">
                {!normalizedQuery && <span>Ketik nama product, kategori, no receipt, atau kasir.</span>}
                {normalizedQuery && !hasResults && <span>Data tidak ditemukan.</span>}

                {productResults.map((product) => (
                  <Button type="button" key={product.id} onClick={onOpenProduct}>
                    <strong>{product.name}</strong>
                    <small>Product - {product.category}</small>
                  </Button>
                ))}

                {transactionResults.map((transaction) => (
                  <Button type="button" key={transaction.id} onClick={() => onOpenTransaction(transaction)}>
                    <strong>{transaction.id}</strong>
                    <small>Transaksi - {transaction.cashier}</small>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="dashboard-date text-right max-md:text-left [&_strong]:block [&_strong]:text-slate-950 [&_span]:text-sm [&_span]:font-bold [&_span]:text-slate-500">
          <strong>{formattedDate}</strong>
          <span>{formattedTime}</span>
        </div>
      </div>
    </header>
  )
}
