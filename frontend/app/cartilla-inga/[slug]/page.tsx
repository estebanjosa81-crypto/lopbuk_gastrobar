'use client'

// Cartilla ACTIVA (scope: cartilla-(slug)). Si es de pago y el usuario no tiene
// acceso, CartillaPage muestra el muro de pago; si es gratis o adquirida,
// monta la experiencia completa (módulos, actividades, comunidad, retos).
import { useParams } from 'next/navigation'
import CartillaPage from '@/cartilla-inga/CartillaPage'

export default function CartillaIngaActivaPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  if (!slug) return null
  return <CartillaPage slug={slug} />
}
