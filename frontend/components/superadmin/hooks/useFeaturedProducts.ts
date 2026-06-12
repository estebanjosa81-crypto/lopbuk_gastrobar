'use client'

import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export function useFeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false)
  const [featuredSearch, setFeaturedSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const fetchFeatured = useCallback(async () => {
    setIsLoadingFeatured(true)
    const result = await api.getPlatformFeatured()
    if (result.success && result.data) setFeaturedProducts(result.data)
    setIsLoadingFeatured(false)
  }, [])

  useEffect(() => { fetchFeatured() }, [fetchFeatured])

  const handleFeaturedSearch = async (q: string) => {
    setFeaturedSearch(q)
    if (!q.trim()) { setSearchResults([]); return }
    setIsSearching(true)
    try {
      const res = await fetch(`${API_URL}/storefront/products?limit=30&store=all&search=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (json.success && json.data?.products) setSearchResults(json.data.products)
    } catch {}
    setIsSearching(false)
  }

  const addToFeatured = async (product: any) => {
    if (featuredProducts.find(p => p.id === product.id)) { toast.info('Ya está en destacados'); return }
    const newList = [...featuredProducts, product]
    setFeaturedProducts(newList)
    setSearchResults([])
    setFeaturedSearch('')
    const result = await api.updatePlatformFeatured(newList.map((p: any) => p.id))
    if (result.success) toast.success(`"${product.name}" añadido a destacados`)
    else { toast.error(result.error || 'Error al guardar'); setFeaturedProducts(featuredProducts) }
  }

  const removeFromFeatured = async (productId: number) => {
    const newList = featuredProducts.filter((p: any) => p.id !== productId)
    setFeaturedProducts(newList)
    await api.updatePlatformFeatured(newList.map((p: any) => p.id))
    toast.success('Producto removido de destacados')
  }

  return {
    featuredProducts, isLoadingFeatured, featuredSearch, searchResults, isSearching,
    fetchFeatured, handleFeaturedSearch, addToFeatured, removeFromFeatured,
  }
}
