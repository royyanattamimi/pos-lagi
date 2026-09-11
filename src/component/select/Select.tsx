import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`min-h-11 w-full rounded-xl border border-slate-200 bg-white/95 px-3 text-slate-900 shadow-sm shadow-slate-950/5 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  )
}
