import { supabase } from '../lib/supabase'
import { refundToTransaction } from './refund'
import type { RefundInput, RefundRecord, TransactionRecord } from '../types'

export async function loadRemoteRefunds(): Promise<{ records: TransactionRecord[]; available: boolean }> {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')
  const records: TransactionRecord[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('refunds').select('*')
      .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 499)
    if (error?.code === 'PGRST205') return { records: [], available: false }
    if (error) throw new Error(`Gagal memuat refund: ${error.message}`)
    records.push(...(data as RefundRecord[]).map(refundToTransaction))
    if (data.length < 500) return { records, available: true }
  }
}

export async function createRemoteRefund(input: RefundInput): Promise<TransactionRecord> {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')
  const { data, error } = await supabase.rpc('create_pos_refund', { request: input })
  if (error) throw new Error(`Refund belum tersimpan: ${error.message}`)
  if (!data) throw new Error('Konfirmasi refund belum diterima. Coba simpan lagi dengan nomor yang sama.')
  return refundToTransaction(data as RefundRecord)
}
