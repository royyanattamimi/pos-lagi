import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`page-heading mb-7 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start ${className}`.trim()}>
      <div className="page-header-copy max-w-3xl">
        <p className="mb-2 text-xs font-black uppercase text-teal-700">{eyebrow}</p>
        <h1 className="m-0 text-2xl font-semibold leading-tight text-slate-950 md:text-3xl">{title}</h1>
        {description && <span className="mt-2 block text-sm leading-6 text-slate-500">{description}</span>}
      </div>
      {actions && <div className="page-header-actions flex flex-wrap items-center justify-end gap-2">{actions}</div>}
    </header>
  )
}
