'use client'

/**
 * ProductCard — card de producto reutilizable del "marketplace engine" (C4a).
 * Módulo composable: se usa en ExploreSection (OS) y puede reusarse en home,
 * campañas, etc. No acopla el carrito; delega la compra al storefront del comercio.
 */
import { Store, Plus, Check } from 'lucide-react'
import { useState } from 'react'
import { useConsumerCart } from '@/lib/consumer-cart-store'

const COP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const ASSET_BASE = API_URL.replace(/\/api$/, '')
const abs = (u?: string | null) => (!u ? '' : u.startsWith('http') ? u : `${ASSET_BASE}${u}`)

export default function ProductCard({ p, onOpen }: { p: any; onOpen: (slug: string) => void }) {
  const add = useConsumerCart(s => s.add)
  const [added, setAdded] = useState(false)
  const onOffer = !!(p.isOnOffer && p.offerPrice)
  const price = onOffer ? p.offerPrice : p.salePrice
  const img = abs(p.imageUrl)

  const onAdd = () => { add(p, 1); setAdded(true); setTimeout(() => setAdded(false), 1200) }

  return (
    <div className="group rounded-2xl bg-white border border-black/[0.07] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      <button onClick={() => onOpen(p.storeSlug)} className="block text-left">
        <div className="aspect-square bg-neutral-100 overflow-hidden relative">
          {img
            ? <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-neutral-300"><Store className="w-8 h-8" /></div>}
          {onOffer && <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Oferta</span>}
        </div>
      </button>
      <div className="p-3 flex-1 flex flex-col">
        <button onClick={() => onOpen(p.storeSlug)} className="text-left">
          <p className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug">{p.name}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-bold text-neutral-900">{COP(price)}</span>
            {onOffer && <span className="text-[11px] text-neutral-400 line-through">{COP(p.salePrice)}</span>}
          </div>
          {p.storeName && <p className="text-[11px] text-neutral-400 mt-1 truncate flex items-center gap-1"><Store className="w-3 h-3" />{p.storeName}</p>}
        </button>
        <button onClick={onAdd} className={`mt-2.5 w-full rounded-lg text-sm font-semibold py-2 inline-flex items-center justify-center gap-1.5 transition-colors ${added ? 'bg-emerald-500 text-white' : 'bg-neutral-900 text-white hover:bg-black'}`}>
          {added ? <><Check className="w-4 h-4" /> Agregado</> : <><Plus className="w-4 h-4" /> Agregar</>}
        </button>
      </div>
    </div>
  )
}
