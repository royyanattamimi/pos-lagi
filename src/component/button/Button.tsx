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
    primary:
      'border-transparent bg-emerald-700 text-white shadow-sm shadow-emerald-900/15 hover:bg-emerald-800 focus-visible:ring-emerald-200',
    secondary:
      'border-slate-200 bg-white text-slate-800 shadow-sm shadow-slate-950/5 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-200',
    danger:
      'border-transparent bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 focus-visible:ring-red-200',
    ghost:
      'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-200',
  }[variant]
  const sizeClass = {
    small: 'min-h-8 px-3 text-xs',
    medium: 'min-h-10 px-4 text-sm',
    large: 'min-h-11 px-5 text-sm',
  }[size]

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-semibold leading-snug transition duration-150 focus-visible:outline-none focus-visible:ring-4 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 ${variantClass} ${sizeClass} ${className}`.trim()}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
