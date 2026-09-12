import { useState } from 'react'

import { productPhotos, defaultProductPhoto } from './productPhotos'

type ProductImageProps = { src?: string; name: string; category?: string; className?: string }

export function ProductImage({ src, name, category = '', className = '' }: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const preferred = src?.trim() || defaultProductPhoto(category)
  const resolved = failedSource === preferred ? productPhotos[0].src : preferred
  return <img className={`shrink-0 bg-slate-50 ${className}`} src={resolved} alt={name} loading="lazy" decoding="async" onError={() => setFailedSource(preferred)} />
}
