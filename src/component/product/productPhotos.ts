export const productPhotos = [
  { label: 'Snack', category: 'Promo', src: '/product-images/snack-real.png' },
  { label: 'Roti', category: 'Makanan', src: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=640&q=85' },
  { label: 'Kopi', category: 'Minuman', src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=640&q=85' },
  { label: 'Beras', category: 'Sembako', src: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=640&q=85' },
]

export function defaultProductPhoto(category: string) {
  return productPhotos.find((photo) => photo.category === category)?.src || productPhotos[0].src
}
