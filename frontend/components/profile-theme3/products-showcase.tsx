'use client'

import React, { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { API_URL, formatCOP } from './types'
import type { PublicProduct } from './types'

/** Mini-catálogo embebido: productos públicos (activos) de la tienda. */
export function ProductsShowcase({ slug }: { slug: string }) {
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [storeSlug, setStoreSlug] = useState<string>(slug)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/profile/${encodeURIComponent(slug)}/products`).then(r => r.json()).catch(() => null)
        if (!alive) return
        if (res?.success && res.data) {
          setProducts(res.data.products || [])
          setStoreSlug(res.data.storeSlug || slug)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [slug])

  if (loading) return null
  if (products.length === 0) return null

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" /> Productos
        </h2>
        <a href={`/t/${storeSlug}`} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">Ver tienda completa →</a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => {
          const price = p.isOnOffer && p.offerPrice ? p.offerPrice : p.salePrice
          return (
            <a key={p.id} href={`/t/${storeSlug}`} className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="w-8 h-8" /></div>}
              </div>
              <div className="p-3">
                {p.brand && <p className="text-[11px] uppercase tracking-wide text-gray-400 truncate">{p.brand}</p>}
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{p.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-bold text-gray-900">{formatCOP(Number(price))}</span>
                  {p.isOnOffer && p.offerPrice ? <span className="text-xs text-gray-400 line-through">{formatCOP(Number(p.salePrice))}</span> : null}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}

export default ProductsShowcase
