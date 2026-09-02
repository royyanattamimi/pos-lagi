import { useEffect, useState } from 'react'
import type { Product, TransactionRecord } from '../../types'
import { Button } from '../button/Button'
import { Input } from '../input/Input'
import './DashboardHeader.css'

type DashboardHeaderProps = {
  products: Product[]
  transactions: TransactionRecord[]
  onOpenProduct: () => void
  onOpenTransaction: () => void
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
    <header className="dashboard-header" id="dashboard">
      <div className="dashboard-header-actions">
        <div className="dashboard-search-area">
          <div className="dashboard-search-buttons" aria-label="Pencarian cepat">
            <Button type="button" onClick={() => setIsSearchOpen((currentValue) => !currentValue)}>
              Search Product & Transaksi
            </Button>
          </div>

          {isSearchOpen && (
            <div className="dashboard-search-panel">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari product atau transaksi"
              />

              <div className="dashboard-search-results">
                {!normalizedQuery && <span>Ketik nama product, kategori, no receipt, atau kasir.</span>}
                {normalizedQuery && !hasResults && <span>Data tidak ditemukan.</span>}

                {productResults.map((product) => (
                  <Button type="button" key={product.id} onClick={onOpenProduct}>
                    <strong>{product.name}</strong>
                    <small>Product - {product.category}</small>
                  </Button>
                ))}

                {transactionResults.map((transaction) => (
                  <Button type="button" key={transaction.id} onClick={onOpenTransaction}>
                    <strong>{transaction.id}</strong>
                    <small>Transaksi - {transaction.cashier}</small>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="dashboard-date">
          <strong>{formattedDate}</strong>
          <span>{formattedTime}</span>
        </div>
      </div>
    </header>
  )
}
