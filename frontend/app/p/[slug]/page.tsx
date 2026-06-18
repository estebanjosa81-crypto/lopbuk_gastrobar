'use client'

// TEMA 3 — Perfil Público del Tenant: lopbuk.com/p/:slug
import { useParams } from 'next/navigation'
import { ProfileThemeThree } from '@/components/profile-theme3/profile-theme-three'

export default function PublicProfilePage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  if (!slug) return null
  return <ProfileThemeThree slug={slug} />
}
