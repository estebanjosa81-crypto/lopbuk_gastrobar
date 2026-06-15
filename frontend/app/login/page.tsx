'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { useAuthStore } from '@/lib/auth-store'
import { DEFAULT_SLUG } from '@/lib/panel-sections'

/** Solo aceptamos destinos internos (evita open-redirects). */
function safeNext(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return `/panel/${DEFAULT_SLUG}`
}

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isCheckingAuth, checkAuth, user } = useAuthStore()

  const next = safeNext(searchParams.get('next'))

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // En cuanto haya sesión (al cargar o tras login), va al destino solicitado.
  // El rol comunidad_admin tiene su propio panel: /comunidad/admin.
  useEffect(() => {
    if (!isAuthenticated) return
    const dest = user?.role === 'comunidad_admin' && next === `/panel/${DEFAULT_SLUG}`
      ? '/comunidad/admin'
      : next
    router.replace(dest)
  }, [isAuthenticated, user, next, router])

  if (isCheckingAuth || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <AuthForm onGoBack={() => router.push('/')} />
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}
