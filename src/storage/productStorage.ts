import { supabase } from '../lib/supabase'
import type { Product, ProductInput } from '../types'

type ProductRow = {
  id: number
  name: string
  category: string
  price: number
  image: string
}

export async function loadRemoteProducts(): Promise<Product[]> {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')

  const records: Product[] = []
  for (let offset = 0; ; offset += 500) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, price, image')
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 499)

  if (error) {
    throw new Error(`Gagal memuat produk: ${error.message}`)
  }

  records.push(...data.map(mapProductRow))
  if (data.length < 500) return records
  }
}

export async function createRemoteProduct(product: Product) {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')

  const { error } = await supabase
    .from('products')
    .insert(mapProductInput(product))

  if (error) throw new Error(error.message)
}

export async function updateRemoteProduct(productId: number, product: ProductInput) {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')

  const { error } = await supabase
    .from('products')
    .update(mapProductInput(product))
    .eq('id', productId)

  if (error) throw new Error(error.message)
}

export async function deleteRemoteProduct(productId: number) {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) throw new Error(error.message)
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    price: Number(row.price),
    image: row.image,
  }
}

function mapProductInput(product: Product | ProductInput) {
  return {
    ...('id' in product ? { id: product.id } : {}),
    name: product.name,
    category: product.category,
    price: product.price,
    image: product.image,
  }
}
