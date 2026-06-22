'use client'

import dynamic from 'next/dynamic'
import { FullPageLoader } from '@/components/box-loader'

// El portal del coach es pesado y solo para entrenadores: carga en cliente.
const CoachPortal = dynamic(() => import('@/components/coach/CoachPortal'), {
  ssr: false,
  loading: () => <FullPageLoader />,
})

export default function CoachPage() {
  return <CoachPortal />
}
