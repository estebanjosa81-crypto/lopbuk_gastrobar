'use client'

import { useEffect } from 'react'
import { api } from '@/lib/api'

export function DynamicFavicon() {
  useEffect(() => {
    api.getStoreCustomization().then((res) => {
      const logoUrl = res?.data?.storeInfo?.logoUrl
      if (!logoUrl) return

      const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement)
        || document.createElement('link')
      link.rel = 'icon'
      link.href = logoUrl
      document.head.appendChild(link)

      const appleLink = (document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement)
        || document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = logoUrl
      document.head.appendChild(appleLink)
    }).catch(() => {})
  }, [])

  return null
}
