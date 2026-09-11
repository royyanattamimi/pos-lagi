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
      'border-transparent bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 focus-visible:ring-slate-300',
    secondary:
      'border-slate-200 bg-white/90 text-slate-800 shadow-sm shadow-slate-950/5 hover:border-slate-300 hover:bg-white focus-visible:ring-slate-200',
    danger:
      'border-transparent bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700 focus-visible:ring-red-200',
    ghost:
      'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-200',
  }[variant]
  const sizeClass = {
    small: 'min-h-8 px-3 text-xs',
    medium: 'min-h-10 px-4 text-sm',
    large: 'min-h-12 px-5 text-base',
  }[size]

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-extrabold transition duration-200 focus-visible:outline-none focus-visible:ring-4 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${sizeClass} ${className}`.trim()}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
