export type Product = {
  id: number
  name: string
  category: string
  stock: number
  price: number
  status: 'Aktif' | 'Stok Rendah'
  image: string
}

export type ProductInput = {
  name: string
  category: string
  stock: number
  price: number
  image: string
}

export type TransactionItem = {
  productId: number
  name: string
  price: number
  quantity: number
  total: number
}

export type TransactionRecord = {
  id: string
  cashier: string
  createdAt: string
  items: TransactionItem[]
  itemCount: number
  subtotal: number
  tax: number
  grandTotal: number
  paid: number
  change: number
  paymentMethod: string
  status: 'Lunas'
}

export type TransactionInput = Omit<TransactionRecord, 'id' | 'createdAt' | 'status'>

export type ShiftInput = {
  cashierName: string
  shiftTime: string
  openingCash: number
  note: string
}

export type ShiftSession = ShiftInput & {
  id: string
  startAt: string
  endAt?: string
  status: 'Berjalan' | 'Selesai'
}
