import { useId, useState } from 'react'
import { StickyNote } from 'lucide-react'
import { Button } from '../../component/button/Button'

type ItemNoteProps = {
  name: string
  value: string
  onChange: (value: string) => void
}

export function ItemNote({ name, value, onChange }: ItemNoteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputId = useId()

  return (
    <div className="min-w-0">
      <Button variant="ghost" aria-expanded={isOpen} aria-controls={inputId} onClick={() => setIsOpen(!isOpen)}>
        <StickyNote aria-hidden="true" />{value.trim() ? 'Edit catatan' : 'Catatan'}
      </Button>
      {isOpen ? (
        <div className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-3">
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-600">Catatan untuk {name}</label>
          <textarea
            id={inputId}
            autoFocus
            rows={3}
            maxLength={300}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Contoh: tanpa gula, es sedikit, saus dipisah"
            className="w-full resize-y rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <small className="text-xs text-slate-500">Berlaku untuk item ini. Jika jumlahnya lebih dari satu, tulis permintaan masing-masing. {value.length}/300</small>
          <div className="flex justify-end gap-2">
            {value && <Button variant="ghost" onClick={() => { onChange(''); setIsOpen(false) }}>Hapus</Button>}
            <Button onClick={() => setIsOpen(false)}>Selesai</Button>
          </div>
        </div>
      ) : value.trim() ? (
        <div className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Catatan: {value}</div>
      ) : null}
    </div>
  )
}
