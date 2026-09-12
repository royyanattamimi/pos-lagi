import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-slate-950/5 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  )
}
