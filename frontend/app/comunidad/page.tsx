'use client'

// Feed público de la Comunidad Daimuz — cualquier visitante.
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { CommunityFeed } from '@/components/community/community-feed'

export default function ComunidadPage() {
  const { checkAuth } = useAuthStore()
  useEffect(() => { checkAuth() }, [checkAuth])
  return <CommunityFeed />
}
