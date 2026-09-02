import type { SelectHTMLAttributes } from 'react'
import './Select.css'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className = '', children, ...props }: SelectProps) {
  return <select className={`ui-select ${className}`.trim()} {...props}>{children}</select>
}
