'use client'

// Redirige al Modo Chat Daimuz (a pantalla completa). Se usa cuando la sección
// persistida del panel todavía apunta al antiguo 'daimuz-chat'.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FullPageLoader } from '@/components/box-loader'

export function ModoChatRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/modo-chat') }, [router])
  return <FullPageLoader />
}
