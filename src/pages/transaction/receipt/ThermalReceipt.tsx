import type { TransactionRecord } from '../../../types'
import type { AppSettings } from '../../../storage/settingsStorage'

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const formatCurrency = (value: number) => currency.format(value)

type Props = { transaction: TransactionRecord; settings: AppSettings; branch: string; sample?: boolean }

export function ThermalReceipt({ transaction, settings, branch, sample = false }: Props) {
  const totalItems = transaction.items.reduce((total, item) => total + item.quantity, 0)
  return (
          <article className="thermal-receipt" aria-label={`Nota ${transaction.id}`}>
            <header className="thermal-store">
              {sample && <p className="thermal-caption">CONTOH NOTA</p>}
              <h2>{settings.storeName}</h2>
              <p>{branch || 'Cabang Utama'}</p>
              {settings.storeAddress && <p className="whitespace-pre-wrap">{settings.storeAddress}</p>}
              {settings.storePhone && <p>{settings.storePhone}</p>}
              <p className="thermal-caption">NOTA PEMBAYARAN</p>
            </header>

            <dl className="thermal-meta thermal-divider">
              <div><dt>No. nota</dt><dd>{transaction.id}</dd></div>
              <div><dt>Tanggal</dt><dd>{new Date(transaction.createdAt).toLocaleDateString('id-ID')}</dd></div>
              <div><dt>Waktu</dt><dd>{new Date(transaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</dd></div>
              {settings.showCashierOnReceipt && <div><dt>Kasir</dt><dd>{transaction.cashier}</dd></div>}
            </dl>

            <div className="thermal-items thermal-divider">
              {transaction.items.map((item) => (
                <div className="thermal-item" key={item.productId}>
                  <strong>{item.name}</strong>
                  <div className="thermal-line">
                    <span>{item.quantity} x {formatCurrency(item.price)}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                  {settings.showNotesOnReceipt && item.note && <p className="thermal-note">Catatan: {item.note}</p>}
                </div>
              ))}
            </div>

            <dl className="thermal-totals thermal-divider">
              <div><dt>Jumlah item</dt><dd>{totalItems}</dd></div>
              <div><dt>Subtotal</dt><dd>{formatCurrency(transaction.subtotal)}</dd></div>
              {transaction.tax !== 0 && <div><dt>Pajak</dt><dd>{formatCurrency(transaction.tax)}</dd></div>}
              <div className="thermal-grand-total"><dt>TOTAL</dt><dd>{formatCurrency(transaction.grandTotal)}</dd></div>
              <div><dt>Metode</dt><dd>{transaction.paymentMethod}</dd></div>
              <div><dt>Dibayar</dt><dd>{formatCurrency(transaction.paid)}</dd></div>
              <div><dt>Kembalian</dt><dd>{formatCurrency(transaction.change)}</dd></div>
            </dl>

            <footer className="thermal-footer">
              <strong className="thermal-paid">LUNAS</strong>
              <p className="whitespace-pre-wrap">{settings.receiptFooter}</p>
              <p>Simpan nota ini sebagai bukti pembayaran.</p>
              <span>*** Sampai jumpa kembali ***</span>
            </footer>
          </article>
  )
}
