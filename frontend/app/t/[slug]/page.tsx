'use client'

import { useRouter } from 'next/navigation'
import { LandingPage } from '@/components/landing-page'

/**
 * Ruta limpia y compartible de cada tienda: /t/<slug>.
 * Renderiza la tienda pública; LandingPage detecta el slug desde la ruta
 * (getStoreSlugFromUrl) y abre el comercio correspondiente.
 */
export default function StoreBySlugPage() {
  const router = useRouter()
  return <LandingPage onGoToLogin={() => router.push('/login')} />
}
