import { supabase } from '../lib/supabase'
import type { ShiftSession } from '../types'

export async function loadRemoteShifts(): Promise<ShiftSession[]> {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')
  const shifts: ShiftSession[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('shift_sessions').select('data').order('id', { ascending: false }).range(offset, offset + 499)
    if (error) throw new Error(`Gagal memuat shift: ${error.message}`)
    shifts.push(...data.map((row) => row.data as ShiftSession))
    if (data.length < 500) return shifts
  }
}

export async function saveRemoteShift(shift: ShiftSession, previous?: ShiftSession) {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')
  const row = { id: shift.id, data: shift, updated_at: new Date().toISOString() }
  // Compare against the loaded document so another device cannot be overwritten silently.
  const query = previous
    ? supabase.from('shift_sessions').update(row).eq('id', shift.id).eq('data', JSON.stringify(previous))
    : supabase.from('shift_sessions').insert(row)
  const { data, error } = await query.select('id')
  if (error) throw new Error(`Shift belum tersimpan: ${error.message}`)
  if (!data?.length) throw new Error('Shift berubah di perangkat lain. Muat ulang halaman sebelum menyimpan kembali.')
}
