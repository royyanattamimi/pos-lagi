import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'small' | 'medium' | 'large'
}

export function Button({
  children,
  className = '',
  variant = 'secondary',
  size = 'medium',
  type = 'button',
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: 'border-transparent bg-teal-700 text-white hover:bg-teal-800',
    secondary: 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
    danger: 'border-red-200 bg-red-600 text-white hover:bg-red-700',
    ghost: 'border-transparent bg-transparent text-slate-700 hover:bg-slate-100',
  }[variant]
  const sizeClass = {
    small: 'min-h-8 px-3 text-xs',
    medium: 'min-h-10 px-4 text-sm',
    large: 'min-h-12 px-5 text-base',
  }[size]

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${sizeClass} ${className}`.trim()}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
