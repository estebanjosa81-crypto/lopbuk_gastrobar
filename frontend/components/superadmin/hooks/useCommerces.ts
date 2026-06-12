'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function useCommerces() {
  const [marketplaceCards, setMarketplaceCards] = useState<any[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [cardSearch, setCardSearch] = useState('')
  const [savingCardId, setSavingCardId] = useState<string | null>(null)

  const fetchMarketplaceCards = useCallback(async () => {
    setIsLoadingCards(true)
    try {
      const res = await api.getMarketplaceCards()
      if (res.success && res.data) setMarketplaceCards(res.data as any[])
    } catch { /* noop */ }
    setIsLoadingCards(false)
  }, [])

  const patchCardLocal = (id: string, patch: Record<string, any>) => {
    setMarketplaceCards(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  const saveMarketplaceCard = async (card: any) => {
    setSavingCardId(card.id)
    try {
      const res = await api.updateMarketplaceCard(card.id, {
        coverUrl: card.coverUrl ?? null,
        cardDescription: card.cardDescription ?? null,
        isVerified: Boolean(card.isVerified),
        marketplaceVisible: Boolean(card.marketplaceVisible),
        marketplaceOrder: Number(card.marketplaceOrder) || 0,
      })
      if (res.success) toast.success('Tarjeta actualizada')
      else toast.error(res.error || 'No se pudo guardar')
    } catch { toast.error('Error al guardar la tarjeta') }
    setSavingCardId(null)
  }

  return {
    marketplaceCards, isLoadingCards, cardSearch, setCardSearch, savingCardId,
    fetchMarketplaceCards, patchCardLocal, saveMarketplaceCard,
  }
}
