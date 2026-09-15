import type { ShiftSession } from '../types'

export function getShiftDeadline(shift: ShiftSession): number {
  const deadline = new Date(shift.startAt)
  deadline.setHours(24, 0, 0, 0)
  return deadline.getTime()
}

export function closeExpiredShift(shift: ShiftSession, now = Date.now()): ShiftSession {
  const deadline = getShiftDeadline(shift)
  if (shift.status !== 'Berjalan' || !Number.isFinite(deadline) || now < deadline) return shift

  return { ...shift, status: 'Selesai', endAt: new Date(deadline).toISOString() }
}
