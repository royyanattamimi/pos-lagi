import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-200 ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  )
}
