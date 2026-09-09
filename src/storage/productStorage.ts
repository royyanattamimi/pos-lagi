import { supabase } from '../lib/supabase'
import type { Product, ProductInput } from '../types'

type ProductRow = {
  id: number
  name: string
  category: string
  price: number
  image: string
}

export async function loadRemoteProducts(fallbackProducts: Product[]): Promise<Product[]> {
  if (!supabase) return fallbackProducts

  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, price, image')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Gagal memuat products dari Supabase:', error.message)
    return fallbackProducts
  }

  return Array.isArray(data) ? data.map(mapProductRow) : fallbackProducts
}

export async function createRemoteProduct(product: Product) {
  if (!supabase) return

  const { error } = await supabase
    .from('products')
    .insert(mapProductInput(product))

  if (error) throw new Error(error.message)
}

export async function updateRemoteProduct(productId: number, product: ProductInput) {
  if (!supabase) return

  const { error } = await supabase
    .from('products')
    .update(mapProductInput(product))
    .eq('id', productId)

  if (error) throw new Error(error.message)
}

export async function deleteRemoteProduct(productId: number) {
  if (!supabase) return

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
